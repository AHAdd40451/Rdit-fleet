import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import PhoneInput from 'react-native-phone-number-input';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

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

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                  {lastName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.profileName}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.profileRole}>
              {userProfile.role === 'admin' ? 'Administrator' : 'User'}
            </Text>
          </View>

          {/* Edit Button */}
          {!isEditing && (
            <View style={styles.editButtonContainer}>
              <Button
                variant="gradient"
                title="Edit Profile"
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              />
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name</Text>
              <Input
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                editable={isEditing}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name</Text>
              <Input
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                editable={isEditing}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputWrapper}>
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
                  containerStyle={styles.phoneInput}
                  textContainerStyle={styles.phoneInputTextContainer}
                  textInputStyle={styles.phoneInputText}
                  codeTextStyle={styles.phoneInputCodeText}
                />
              </View>
            </View>

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.cancelButton}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.saveButtonContainer}>
                  <Button
                    variant="gradient"
                    title={loading ? 'Saving...' : 'Save Changes'}
                    onPress={handleUpdateProfile}
                    style={styles.saveButton}
                    disabled={loading}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: TEAL_GREEN,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 60,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: TEAL_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
  },
  editButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  editButton: {
    maxWidth: 200,
    alignSelf: 'center',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
    alignItems: 'stretch',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    minHeight: 50,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    flex: 1,
  },
  saveButton: {
    width: '100%',
    marginBottom: 0,
  },
  phoneInputWrapper: {
    width: '100%',
  },
  phoneInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  phoneInputTextContainer: {
    backgroundColor: '#fff',
    paddingVertical: 0,
  },
  phoneInputText: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  phoneInputCodeText: {
    fontSize: 16,
    color: '#000',
  },
});

