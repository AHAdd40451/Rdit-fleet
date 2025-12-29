import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { CountryPicker } from 'react-native-country-codes-picker';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingBar } from './LoadingBar';

interface User {
  id?: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  email?: string;
  role: string;
}

interface UserModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id'>) => Promise<void>;
  editingUser?: User | null;
  loading?: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  visible,
  onClose,
  onSave,
  editingUser,
  loading = false,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (editingUser) {
      setFirstName(editingUser.first_name || '');
      setLastName(editingUser.last_name || '');
      const phone = editingUser.phone_no || '';
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
    } else {
      // Reset form for new user
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setCountryCode('+1');
      setCountryFlag('🇺🇸');
      setEmail('');
    }
  }, [editingUser, visible]);

  const handleSave = async () => {
    if (!firstName || !lastName || !phoneNumber) {
      return;
    }

    // Basic phone number validation (should have at least 7 digits)
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      return;
    }
    
    // Format phone number with country code
    const formattedValue = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return;
      }
    }

    const userData: Omit<User, 'id'> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_no: formattedValue.trim(),
      role: editingUser?.role || 'user',
    };

    if (email.trim()) {
      userData.email = email.trim();
    }

    await onSave(userData);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalContent}>
                  <View style={styles.header}>
                    <Text style={styles.modalTitle}>
                      {editingUser ? 'Edit User' : 'Create New User'}
                    </Text>
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}
                      disabled={loading}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.form}>
                    <View style={styles.inputContainer}>
                      <Input
                        variant="text"
                        label="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        style={styles.input}
                        autoCapitalize="words"
                        editable={!loading}
                      />
                      <Input
                        variant="text"
                        label="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        style={styles.input}
                        autoCapitalize="words"
                        editable={!loading}
                      />
                      <View style={styles.phoneInputContainer}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.phoneInputWrapper}>
                          <TouchableOpacity
                            style={styles.countryCodeButton}
                            onPress={() => setShowCountryPicker(true)}
                            disabled={loading}
                          >
                            <Text style={styles.countryFlag}>{countryFlag}</Text>
                            <Text style={styles.countryCodeText}>{countryCode}</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={styles.phoneInputText}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="Phone number"
                            keyboardType="phone-pad"
                            editable={!loading}
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
                      <Input
                        variant="text"
                        label="Email (Optional)"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Email"
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.buttonContainer}>
                      <Button
                        variant="gradient"
                        title={
                          loading
                            ? editingUser
                              ? 'Updating...'
                              : 'Creating...'
                            : editingUser
                            ? 'Update User'
                            : 'Create User'
                        }
                        onPress={handleSave}
                        disabled={loading || !firstName || !lastName || !phoneNumber}
                        style={styles.saveButton}
                      />
                      {loading && (
                        <View style={styles.loadingContainer}>
                          <LoadingBar variant="bar" />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  saveButton: {
    maxWidth: 300,
    marginBottom: 12,
  },
  loadingContainer: {
    marginTop: 8,
    width: '100%',
    maxWidth: 300,
    marginBottom: 12,
  },
  phoneInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    backgroundColor: '#f9f9f9',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  phoneInputText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: '100%',
  },
});

