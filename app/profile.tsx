import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CountryPicker } from 'react-native-country-codes-picker';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { TopBar } from '../src/components/TopBar';
import profileStyles from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, session, user, refreshUserProfile } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // Load user profile data into form
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setEmail(userProfile.email || '');
      const phone = userProfile.phone_no || '';
      // Extract country code and phone number if phone starts with +
      if (phone.startsWith('+')) {
        const match = phone.match(/^(\+\d{1,4})(.*)/);
        if (match) {
          setCountryCode(match[1]);
          setPhoneNumber(match[2].trim());
        } else {
          setPhoneNumber(phone);
        }
      } else {
        setPhoneNumber(phone);
      }
      console.log('userProfile.avatar_url', userProfile);
      // Load profile image URL if it exists, otherwise reset to null
      if (userProfile.avatar_url && userProfile.avatar_url.trim() !== '') {
        setProfileImageUri(userProfile.avatar_url);
      } else {
        setProfileImageUri(null);
      }
    }
  }, [userProfile]);

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }

    // Validate phone number if provided
    if (phoneNumber.trim()) {
      // Basic phone number validation (should have at least 7 digits)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
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
        // Format phone number with country code
        const formattedValue = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
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
        .select('id, email, phone_no, role, first_name, last_name, userId, avatar_url')
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
        // Extract country code and phone number if phone starts with +
        if (phone.startsWith('+')) {
          const match = phone.match(/^(\+\d{1,4})(.*)/);
          if (match) {
            setCountryCode(match[1]);
            setPhoneNumber(match[2].trim());
          } else {
            setPhoneNumber(phone);
          }
        } else {
          setPhoneNumber(phone);
        }
      }
      setIsEditing(false);
  };

  const uploadProfileImage = async (uri: string) => {
    try {
      if (!userProfile?.id) throw new Error('User profile not found');
  
      // Ensure we have a valid session for storage operations
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // If no session exists and user is phone-based, we need to handle RLS differently
      // For now, try to upload - RLS policies should allow authenticated users
      if (!currentSession && !session) {
        console.warn('No Supabase session found. Storage upload may fail due to RLS policies.');
      }
  
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      // Determine content type based on file extension
      const contentTypeMap: { [key: string]: string } = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const contentType = contentTypeMap[fileExt] || 'image/jpeg';
  
      // React Native compatible: Use expo-file-system to read local file
      // Read file as base64 string
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;
  
      const { error, data: uploadData } = await supabase.storage
        .from('redi-fleet')
        .upload(filePath, arrayBuffer, {
          contentType: contentType,
          upsert: true,
          cacheControl: '3600',
        });
  
      if (error) {
        console.error('Supabase upload error:', error);
        
        // Provide helpful error message for RLS issues
        if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          throw new Error(
            'Storage upload failed: Permission denied. Please ensure your Supabase storage bucket has RLS policies that allow authenticated users to upload files to the profiles/ folder.'
          );
        }
        throw error;
      }
  
      const { data: urlData } = supabase.storage
        .from('redi-fleet')
        .getPublicUrl(filePath);
  
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      throw err;
    }
  };
  
  

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo access');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
  
      if (result.canceled) return;
  
      const imageUri = result.assets[0].uri;
  
      setLoading(true);
  
      // 1. Upload to Supabase bucket
      const publicUrl = await uploadProfileImage(imageUri);
  
      // 2. Save URL in users table
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userProfile?.id);

      if (error) throw error;  

      // 3. If user is phone-based, update AsyncStorage with fresh data
      if (userProfile?.phone_no && !session?.user?.email) {
        const { data: updatedProfile } = await supabase
          .from('users')
          .select('id, email, phone_no, role, first_name, last_name, userId, avatar_url')
          .eq('id', userProfile.id)
          .single();
        
        if (updatedProfile) {
          await AsyncStorage.setItem('phone_user', JSON.stringify(updatedProfile));
        }
      }

      // 4. Update UI
      setProfileImageUri(publicUrl);
      await refreshUserProfile();
  
      showToast('Profile image updated', 'success');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Image upload failed');
    } finally {
      setLoading(false);
    }
  };
  

  // Prepare data for FlatList
  const renderContent = () => (
    <>
      {/* Header */}
      <TopBar
        title="Profile"
        showBack={true}
      />

      {/* Profile Section */}
      <View style={profileStyles.profileSection}>
        <View style={profileStyles.avatarContainer}>
          <TouchableOpacity onPress={handleSelectImage} activeOpacity={0.7}>
            <View style={profileStyles.avatar}>
              {profileImageUri && profileImageUri.trim() !== '' ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={profileStyles.avatarImage}
                  onError={(error) => {
                    console.error('Image load error:', error);
                    // Fallback to initials if image fails to load
                    setProfileImageUri(null);
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={profileStyles.avatarText}>
                  {firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : ''}
                  {lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : ''}
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
            <TouchableOpacity
              style={profileStyles.countryCodeButton}
              onPress={() => setShowCountryPicker(true)}
              disabled={!isEditing}
            >
              <Text style={profileStyles.countryFlag}>{countryFlag}</Text>
              <Text style={profileStyles.countryCodeText}>{countryCode}</Text>
            </TouchableOpacity>
            <TextInput
              style={profileStyles.phoneInputText}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              keyboardType="phone-pad"
              editable={isEditing}
              placeholderTextColor="#999"
            />
          </View>
          <CountryPicker
            show={showCountryPicker}
            pickerButtonOnPress={(item) => {
              setCountryCode(item.dial_code);
              setCountryFlag(item.flag);
              setShowCountryPicker(false);
            }}
            onBackdropPress={() => setShowCountryPicker(false)}
            lang="en"
          />
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

