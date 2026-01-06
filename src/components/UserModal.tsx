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
} from 'react-native';
import PhoneInput, { ICountry, getCountryByCca2 } from 'react-native-international-phone-number';
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
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(getCountryByCca2('US'));

  // Helper function to get country code from phone number
  const getCountryCodeFromPhone = (phone: string): string => {
    if (!phone.startsWith('+')) {
      return 'PK'; // Default to Pakistan
    }
    
    // Try to match country codes (longest first to avoid conflicts)
    if (phone.startsWith('+971')) return 'AE'; // UAE
    if (phone.startsWith('+966')) return 'SA'; // Saudi Arabia
    if (phone.startsWith('+974')) return 'QA'; // Qatar
    if (phone.startsWith('+965')) return 'KW'; // Kuwait
    if (phone.startsWith('+973')) return 'BH'; // Bahrain
    if (phone.startsWith('+968')) return 'OM'; // Oman
    if (phone.startsWith('+961')) return 'LB'; // Lebanon
    if (phone.startsWith('+962')) return 'JO'; // Jordan
    if (phone.startsWith('+92')) return 'PK'; // Pakistan
    if (phone.startsWith('+91')) return 'IN'; // India
    if (phone.startsWith('+86')) return 'CN'; // China
    if (phone.startsWith('+81')) return 'JP'; // Japan
    if (phone.startsWith('+49')) return 'DE'; // Germany
    if (phone.startsWith('+44')) return 'GB'; // UK
    if (phone.startsWith('+39')) return 'IT'; // Italy
    if (phone.startsWith('+34')) return 'ES'; // Spain
    if (phone.startsWith('+33')) return 'FR'; // France
    if (phone.startsWith('+61')) return 'AU'; // Australia
    if (phone.startsWith('+55')) return 'BR'; // Brazil
    if (phone.startsWith('+27')) return 'ZA'; // South Africa
    if (phone.startsWith('+20')) return 'EG'; // Egypt
    if (phone.startsWith('+7')) return 'RU'; // Russia
    if (phone.startsWith('+1')) return 'US'; // US/Canada
    
    return 'PK'; // Default
  };

  // Helper function to extract phone number without country code
  const extractPhoneNumber = (phone: string): string => {
    if (!phone.startsWith('+')) {
      return phone;
    }
    
    // Remove country codes (try longest first)
    const patterns = [
      /^\+971/,  // UAE
      /^\+966/,  // Saudi Arabia
      /^\+974/,  // Qatar
      /^\+965/,  // Kuwait
      /^\+973/,  // Bahrain
      /^\+968/,  // Oman
      /^\+961/,  // Lebanon
      /^\+962/,  // Jordan
      /^\+92/,   // Pakistan
      /^\+91/,   // India
      /^\+86/,   // China
      /^\+81/,   // Japan
      /^\+49/,   // Germany
      /^\+44/,   // UK
      /^\+39/,   // Italy
      /^\+34/,   // Spain
      /^\+33/,   // France
      /^\+61/,   // Australia
      /^\+55/,   // Brazil
      /^\+27/,   // South Africa
      /^\+20/,   // Egypt
      /^\+1/,    // US/Canada
      /^\+7/,    // Russia
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(phone)) {
        return phone.replace(pattern, '').trim();
      }
    }
    
    // Fallback: try to remove first 1-4 digits after +
    const match = phone.match(/^\+\d{1,4}(.*)/);
    if (match) {
      return match[1].trim();
    }
    
    return phone;
  };

  useEffect(() => {
    if (editingUser) {
      setFirstName(editingUser.first_name || '');
      setLastName(editingUser.last_name || '');
      const phone = editingUser.phone_no || '';
      const countryCode = getCountryCodeFromPhone(phone);
      setSelectedCountry(getCountryByCca2(countryCode) || getCountryByCca2('US'));
      setPhoneNumber(extractPhoneNumber(phone));
      setEmail(editingUser.email || '');
    } else {
      // Reset form for new user
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setSelectedCountry(getCountryByCca2('US'));
      setEmail('');
    }
  }, [editingUser, visible]);

  const handleSave = async () => {
    if (!firstName || !lastName || !phoneNumber) {
      return;
    }

    // Construct phone number with country code
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    // Access calling code from selectedCountry object
    let callingCode = '1'; // Default to USA
    
    if (selectedCountry) {
      // Try different possible property names for calling code
      const possibleProperties = [
        'callingCode',
        'calling_code', 
        'dialCode',
        'phoneCode',
        'countryCode',
        'phone_code'
      ];
      
      for (const prop of possibleProperties) {
        if ((selectedCountry as any)[prop]) {
          callingCode = String((selectedCountry as any)[prop]).replace('+', '');
          break;
        }
      }
      
      // If still not found, try to get it from the country's cca2 code
      if (callingCode === '1' && (selectedCountry as any).cca2) {
        // Expanded lookup table for calling codes by cca2
        const countryCallingCodes: { [key: string]: string } = {
          'AE': '971', 'SA': '966', 'QA': '974', 'KW': '965', 'BH': '973',
          'OM': '968', 'LB': '961', 'JO': '962', 'PK': '92', 'IN': '91',
          'CN': '86', 'JP': '81', 'DE': '49', 'GB': '44', 'IT': '39',
          'ES': '34', 'FR': '33', 'AU': '61', 'BR': '55', 'ZA': '27',
          'EG': '20', 'RU': '7', 'US': '1', 'CA': '1', 'MX': '52',
          'AR': '54', 'CL': '56', 'CO': '57', 'PE': '51', 'VE': '58',
          'NZ': '64', 'SG': '65', 'MY': '60', 'TH': '66', 'ID': '62',
          'PH': '63', 'VN': '84', 'KR': '82', 'TW': '886', 'HK': '852',
          'TR': '90', 'IL': '972', 'NG': '234', 'KE': '254'
        };
        const cca2 = (selectedCountry as any).cca2;
        if (countryCallingCodes[cca2]) {
          callingCode = countryCallingCodes[cca2];
        }
      }
    }
    
    const formattedValue = `+${callingCode}${digitsOnly}`;

    // Basic validation - ensure phone has at least some digits
    if (digitsOnly.length < 7) {
      return;
    }

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
      phone_no: formattedValue,
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
                          value={phoneNumber}
                          onChangePhoneNumber={setPhoneNumber}
                          selectedCountry={selectedCountry}
                          onChangeSelectedCountry={setSelectedCountry}
                          disabled={loading}
                          phoneInputStyles={{
                            container: {
                              minHeight: 48,
                              backgroundColor: '#fff',
                              borderWidth: 1,
                              borderColor: '#E0E0E0',
                              borderRadius: 8,
                              paddingTop: 14,
                              paddingRight: 12,
                              paddingBottom: 14,
                              paddingLeft: 12,
                            },
                            flagContainer: {
                              backgroundColor: 'transparent',
                              paddingRight: 8,
                            },
                            flag: {
                              fontSize: 20,
                            },
                            caret: {
                              color: '#000',
                              fontSize: 16,
                            },
                            divider: {
                              backgroundColor: '#E0E0E0',
                              width: 1,
                              marginHorizontal: 8,
                            },
                            callingCode: {
                              fontSize: 16,
                              color: '#000',
                              fontWeight: '400',
                            },
                            input: {
                              fontSize: 16,
                              color: '#000',
                              flex: 1,
                            },
                          }}
                          placeholder="Phone Number"
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
    paddingBottom: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    overflow: 'hidden',
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
    overflow: 'hidden',
  },
  inputContainer: {
    width: '100%',
    overflow: 'hidden',
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
});

