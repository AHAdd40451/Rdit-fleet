import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  LogBox,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput from 'react-native-phone-number-input';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavBar } from '../src/components/BottomNavBar';
import profileStyles from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, session, user, refreshUserProfile } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const phoneInput = useRef<PhoneInput>(null);

  // Load user profile data into form
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setEmail(userProfile.email || '');
      const phone = userProfile.phone_no || '';
      setPhoneNumber(phone);
      setFormattedPhoneNumber(phone);
    }
  }, [userProfile]);

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }

    // Validate phone number if provided
    if (phoneNumber.trim()) {
      const checkValid = phoneInput.current?.isValidNumber(phoneNumber);
      if (!checkValid) {
        showToast('Please enter a valid phone number', 'error');
        return;
      }
    }

    // Validate email if provided
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
    }

    if (!userProfile?.id) {
      showToast('User profile not found', 'error');
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };

      if (email.trim()) {
        updateData.email = email.trim();
      }

      if (phoneNumber.trim()) {
        // Use formatted phone number (with country code) from state
        const formattedValue = formattedPhoneNumber || phoneNumber;
        updateData.phone_no = formattedValue.trim();
      }

      // Update user in database
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Database error:', updateError);
        throw new Error(
          updateError.message || 'Failed to update profile. Please try again.'
        );
      }

      // Fetch updated profile from database
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('users')
        .select('id, email, phone_no, role, first_name, last_name, userId')
        .eq('id', userProfile.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
        // Still continue with refresh
      }

      // If user is phone-based, update AsyncStorage with fresh data
      if (userProfile.phone_no && !session?.user?.email) {
        const updatedUserData = updatedProfile || {
          ...userProfile,
          ...updateData,
        };
        await AsyncStorage.setItem('phone_user', JSON.stringify(updatedUserData));
      }

      // Refresh user profile in context
      await refreshUserProfile();

      showToast('Profile updated successfully!', 'success', 2000);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Update profile error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
      // Reset form to original values
      if (userProfile) {
        setFirstName(userProfile.first_name || '');
        setLastName(userProfile.last_name || '');
        setEmail(userProfile.email || '');
        const phone = userProfile.phone_no || '';
        setPhoneNumber(phone);
        setFormattedPhoneNumber(phone);
      }
      setIsEditing(false);
  };

  const handleSelectImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Media library permission is required to select photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Prepare data for FlatList
  const renderContent = () => (
    <>
      {/* Header */}
      <View style={profileStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={profileStyles.backButton}
        >
          <Text style={profileStyles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={profileStyles.headerTitle}>Profile</Text>
        <View style={profileStyles.placeholder} />
      </View>

      {/* Profile Section */}
      <View style={profileStyles.profileSection}>
        <View style={profileStyles.avatarContainer}>
          <TouchableOpacity onPress={handleSelectImage} activeOpacity={0.7}>
            <View style={profileStyles.avatar}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={profileStyles.avatarImage}
                />
              ) : (
                <Text style={profileStyles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                  {lastName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={profileStyles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={profileStyles.profileName}>
          {firstName} {lastName}
        </Text>
        <Text style={profileStyles.profileRole}>
          {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
        </Text>
      </View>

      {/* Edit Button */}
      {!isEditing && (
        <View style={profileStyles.editButtonContainer}>
          <Button
            variant="gradient"
            title="Edit Profile"
            onPress={() => setIsEditing(true)}
            style={profileStyles.editButton}
          />
        </View>
      )}

      {/* Form Section */}
      <View style={profileStyles.formSection}>
        <View style={profileStyles.inputContainer}>
          <Text style={profileStyles.label}>First Name</Text>
          <Input
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditing}
            style={profileStyles.input}
          />
        </View>

        <View style={profileStyles.inputContainer}>
          <Text style={profileStyles.label}>Last Name</Text>
          <Input
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            editable={isEditing}
            style={profileStyles.input}
          />
        </View>

        <View style={profileStyles.inputContainer}>
          <Text style={profileStyles.label}>Email</Text>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
            keyboardType="email-address"
            autoCapitalize="none"
            style={profileStyles.input}
          />
        </View>

        <View style={profileStyles.inputContainer}>
          <Text style={profileStyles.label}>Phone Number</Text>
          <View style={profileStyles.phoneInputWrapper}>
            <PhoneInput
              ref={phoneInput}
              defaultValue={phoneNumber}
              defaultCode="US"
              layout="first"
              onChangeText={(text) => {
                setPhoneNumber(text);
              }}
              onChangeFormattedText={(text) => {
                setFormattedPhoneNumber(text);
              }}
              withDarkTheme={false}
              withShadow={false}
              autoFocus={false}
              disabled={!isEditing}
              containerStyle={profileStyles.phoneInput}
              textContainerStyle={profileStyles.phoneInputTextContainer}
              textInputStyle={profileStyles.phoneInputText}
              codeTextStyle={profileStyles.phoneInputCodeText}
            />
          </View>
        </View>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <View style={profileStyles.buttonGroup}>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={profileStyles.cancelButton}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={profileStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={profileStyles.saveButtonContainer}>
              <Button
                variant="gradient"
                title={loading ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdateProfile}
                style={profileStyles.saveButton}
                disabled={loading}
              />
            </View>
          </View>
        )}
      </View>
    </>
  );

  if (!userProfile) {
    return (
      <SafeAreaView style={profileStyles.container} edges={['top', 'bottom']}>
        <View style={profileStyles.loadingContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={profileStyles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={profileStyles.keyboardView}
      >
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => renderContent()}
          keyExtractor={() => 'profile-content'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={profileStyles.scrollContent}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </KeyboardAvoidingView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

