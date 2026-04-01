import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import PhoneInput, { ICountry, getCountryByCca2 } from 'react-native-international-phone-number';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TopBar } from '../src/components/TopBar';
import { CompanySetupSkeleton } from '../src/components/SkeletonScreens';
import CountryPicker from 'react-native-country-picker-modal';

export default function CompanySetupScreen() {

  const router = useRouter();
  const { showToast } = useToast();
  const { session, userProfile, user, loading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('United States');
  const [countryCode, setCountryCode] = useState('US');
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<ICountry | undefined>(
    getCountryByCca2('US')
  );
  const [state, setState] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);

  const onSelectCountry = (c) => {
    setCountryCode(c.cca2);
    setCountry(c.name);
    setSelectedPhoneCountry(getCountryByCca2(c.cca2) || getCountryByCca2('US'));
  };
  useEffect(() => {
    const checkCompanyAndAccess = async () => {

      if (authLoading) return;

      if (!session || !user) {
        router.replace('/');
        return;
      }

      if (userProfile?.role !== 'admin') {

        if (userProfile?.role === 'user') {
          router.replace('/userDashboard');
        } else {
          router.replace('/');
        }

        return;
      }

      try {

        const { data: companyData, error } = await supabase
          .from('company')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (companyData) {
          router.replace('/adminDashboard');
          return;
        }

        setCheckingCompany(false);

      } catch (error) {

        console.error('Error checking company:', error);
        setCheckingCompany(false);

      }

    };

    checkCompanyAndAccess();

  }, [session, user, userProfile, authLoading]);

  if (checkingCompany || authLoading) {
    return <CompanySetupSkeleton />;
  }

  const handleCreateCompany = async () => {

    if (!companyName.trim() || !country.trim() || !state.trim() || !timezone.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {

      const companyData = {
        user_id: user.id,
        company_name: companyName.trim(),
        country: country.trim(),
        ...(state.trim() && { state: state.trim() }),
        ...(legalName.trim() && { legal_name: legalName.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(supportEmail.trim() && { support_email: supportEmail.trim() }),
        ...(address.trim() && { address: address.trim() }),
        ...(timezone.trim() && { timezone: timezone.trim() }),
        units: units,
      };

      const { error } = await supabase
        .from('company')
        .insert([companyData]);

      if (error) throw error;

      showToast('Company created successfully!', 'success');

      setTimeout(() => {
        router.replace('/adminDashboard');
      }, 2000);

    } catch (error) {

      showToast('Failed to create company', 'error');

    } finally {
      setLoading(false);
    }

  };

  return (

    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >

        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* <TopBar
            title="Company Setup"
            showBack={true}
          /> */}

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Company Setup</Text>
            <Text style={styles.welcomeSubtitle}>
              Please provide your company information to get started with RediFleet.
            </Text>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.formContainer}>

              <Input
                variant="text"
                label="Company Name *"
                value={companyName}
                onChangeText={setCompanyName}
                style={styles.input}
                placeholder="Enter company name"
              />

              <Text style={styles.countryLabel}>Country *</Text>

              <View style={styles.countryPicker}>

                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCountryNameButton
                  withAlphaFilter
                  onSelect={onSelectCountry}
                />

              </View>

              <Input
                variant="text"
                label="State *"
                value={state}
                onChangeText={setState}
                style={styles.input}
                placeholder="Enter state"
              />

              <Input
                variant="text"
                label="Legal Name (Optional)"
                value={legalName}
                onChangeText={setLegalName}
                style={styles.input}
                placeholder="Enter legal name"
              />

              <View style={styles.phoneInputContainer}>
                <PhoneInput
                  value={phone}
                  onChangePhoneNumber={setPhone}
                  selectedCountry={selectedPhoneCountry}
                  onChangeSelectedCountry={setSelectedPhoneCountry}
                  defaultCountry="US"
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
                label="Support Email (Optional)"
                value={supportEmail}
                onChangeText={setSupportEmail}
                style={styles.input}
                keyboardType="email-address"
                placeholder="Enter email"
              />

              <Input
                variant="text"
                label="Address (Optional)"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
                multiline
                numberOfLines={3}
                placeholder="Enter address"
              />

              <Input
                variant="text"
                label="Timezone *"
                value={timezone}
                onChangeText={setTimezone}
                style={styles.input}
                placeholder="Enter timezone"
              />

              <View style={styles.unitsContainer}>

                <Text style={styles.unitsLabel}>Units *</Text>

                <View style={styles.unitsButtons}>

                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      units === 'imperial' && styles.unitButtonActive,
                    ]}
                    onPress={() => setUnits('imperial')}
                  >

                    <Text style={styles.unitButtonText}>
                      Imperial
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      units === 'metric' && styles.unitButtonActive,
                    ]}
                    onPress={() => setUnits('metric')}
                  >

                    <Text style={styles.unitButtonText}>
                      Metric
                    </Text>

                  </TouchableOpacity>

                </View>

              </View>

              <Button
                variant="gradient"
                title={loading ? 'Creating...' : 'Create Company'}
                onPress={handleCreateCompany}
                disabled={loading}
              />

              {loading && <LoadingBar variant="bar" />}

            </View>
          </View>

        </ScrollView>

      </KeyboardAvoidingView>

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
    paddingBottom: 32,
  },

  welcomeSection: {
    padding: 20,
    marginTop: 30,
  },

  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  welcomeSubtitle: {
    textAlign: 'center',
    color: '#666',
  },

  contentSection: {
    paddingHorizontal: 20,
  },

  formContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },

  input: {
    marginBottom: 16,
  },
  phoneInputContainer: {
    marginBottom: 16,
  },

  countryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  countryPicker: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  unitsContainer: {
    marginBottom: 16,
  },

  unitsLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },

  unitsButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  unitButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },

  unitButtonActive: {
    backgroundColor: '#14AB98',
  },

  unitButtonText: {
    fontSize: 16,
  },

});
