import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
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
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const phoneInput = useRef<PhoneInput>(null);

  useEffect(() => {
    if (editingUser) {
      setFirstName(editingUser.first_name || '');
      setLastName(editingUser.last_name || '');
      const phone = editingUser.phone_no || '';
      setPhoneNumber(phone);
      setFormattedPhoneNumber(phone);
    } else {
      // Reset form for new user
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setFormattedPhoneNumber('');
      setEmail('');
    }
  }, [editingUser, visible]);

  const handleSave = async () => {
    if (!firstName || !lastName || !phoneNumber) {
      return;
    }

    // Validate phone number using the library
    const checkValid = phoneInput.current?.isValidNumber(phoneNumber);
    if (!checkValid || !phoneNumber) {
      return;
    }
    
    // Use formatted phone number (with country code) from state
    const formattedValue = formattedPhoneNumber || phoneNumber;

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
                          disabled={loading}
                          containerStyle={styles.phoneInput}
                          textContainerStyle={styles.phoneInputTextContainer}
                          textInputStyle={styles.phoneInputText}
                          codeTextStyle={styles.phoneInputCodeText}
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

