import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import PhoneInput, { ICountry, getCountryByCca2 } from 'react-native-international-phone-number';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { TopBar } from '../src/components/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sidebar } from '../src/components/Sidebar';
import { SettingsSkeleton } from '../src/components/SkeletonScreens';

const TEAL_GREEN = '#14AB98';

type TabType = 'profile' | 'company';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, session, user, refreshUserProfile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(getCountryByCca2('US'));
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Company state
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [loadingCompanyData, setLoadingCompanyData] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Load user profile data
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
    }
  }, [userProfile]);

  // Load company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!session?.user?.id || userProfile?.role !== 'admin') {
        setLoadingCompanyData(false);
        return;
      }

      try {
        const { data: companyData, error } = await supabase
          .from('company')
          .select('company_name, country, state, legal_name, phone, support_email, address, timezone, units')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching company:', error);
        }

        if (companyData) {
          setCompanyName(companyData.company_name || '');
          setCountry(companyData.country || '');
          setState(companyData.state || '');
          setLegalName(companyData.legal_name || '');
          setPhone(companyData.phone || '');
          setSupportEmail(companyData.support_email || '');
          setAddress(companyData.address || '');
          setTimezone(companyData.timezone || '');
          setUnits(companyData.units || 'imperial');
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoadingCompanyData(false);
      }
    };

    fetchCompanyData();
  }, [session, userProfile]);

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }

    if (phoneNumber.trim()) {
      // Basic phone number validation (should have at least 7 digits)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        showToast('Please enter a valid phone number', 'error');
        return;
      }
    }

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

    setProfileLoading(true);

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
        updateData.phone_no = formattedValue.trim();
      }

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

      const { data: updatedProfile, error: fetchError } = await supabase
        .from('users')
        .select('id, email, phone_no, role, first_name, last_name, userId')
        .eq('id', userProfile.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
      }

      if (userProfile.phone_no && !session?.user?.email) {
        const updatedUserData = updatedProfile || {
          ...userProfile,
          ...updateData,
        };
        await AsyncStorage.setItem('phone_user', JSON.stringify(updatedUserData));
      }

      await refreshUserProfile();
      showToast('Profile updated successfully!', 'success', 2000);
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Update profile error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelEditProfile = () => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setEmail(userProfile.email || '');
      const phone = userProfile.phone_no || '';
      const getCountryCodeFromPhone = (phone: string): string => {
        if (!phone.startsWith('+')) return 'PK';
        if (phone.startsWith('+971')) return 'AE';
        if (phone.startsWith('+966')) return 'SA';
        if (phone.startsWith('+974')) return 'QA';
        if (phone.startsWith('+965')) return 'KW';
        if (phone.startsWith('+973')) return 'BH';
        if (phone.startsWith('+968')) return 'OM';
        if (phone.startsWith('+961')) return 'LB';
        if (phone.startsWith('+962')) return 'JO';
        if (phone.startsWith('+92')) return 'PK';
        if (phone.startsWith('+91')) return 'IN';
        if (phone.startsWith('+86')) return 'CN';
        if (phone.startsWith('+81')) return 'JP';
        if (phone.startsWith('+49')) return 'DE';
        if (phone.startsWith('+44')) return 'GB';
        if (phone.startsWith('+39')) return 'IT';
        if (phone.startsWith('+34')) return 'ES';
        if (phone.startsWith('+33')) return 'FR';
        if (phone.startsWith('+61')) return 'AU';
        if (phone.startsWith('+55')) return 'BR';
        if (phone.startsWith('+27')) return 'ZA';
        if (phone.startsWith('+20')) return 'EG';
        if (phone.startsWith('+7')) return 'RU';
        if (phone.startsWith('+1')) return 'US';
        return 'PK';
      };
      const extractPhoneNumber = (phone: string): string => {
        if (!phone.startsWith('+')) return phone;
        const patterns = [
          /^\+971/, /^\+966/, /^\+974/, /^\+965/, /^\+973/, /^\+968/, /^\+961/, /^\+962/,
          /^\+92/, /^\+91/, /^\+86/, /^\+81/, /^\+49/, /^\+44/, /^\+39/, /^\+34/, /^\+33/,
          /^\+61/, /^\+55/, /^\+27/, /^\+20/, /^\+1/, /^\+7/,
        ];
        for (const pattern of patterns) {
          if (pattern.test(phone)) {
            return phone.replace(pattern, '').trim();
          }
        }
        const match = phone.match(/^\+\d{1,4}(.*)/);
        return match ? match[1].trim() : phone;
      };
      const countryCode = getCountryCodeFromPhone(phone);
      setSelectedCountry(getCountryByCca2(countryCode) || getCountryByCca2('US'));
      setPhoneNumber(extractPhoneNumber(phone));
    }
    setIsEditingProfile(false);
  };

  const handleUpdateCompany = async () => {
    if (!companyName.trim() || !country.trim()) {
      showToast('Company name and country are required', 'error');
      return;
    }

    if (supportEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supportEmail.trim())) {
        showToast('Please enter a valid support email address', 'error');
        return;
      }
    }

    if (!session?.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setCompanyLoading(true);

    try {
      // Check if company exists
      const { data: existingCompany, error: checkError } = await supabase
        .from('company')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      const companyData = {
        user_id: session.user.id,
        company_name: companyName.trim(),
        country: country.trim(),
        ...(state.trim() && { state: state.trim() }),
        ...(legalName.trim() && { legal_name: legalName.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(supportEmail.trim() && { support_email: supportEmail.trim() }),
        ...(address.trim() && { address: address.trim() }),
        ...(timezone.trim() && { timezone: timezone.trim() }),
        ...(units && { units: units }),
      };

      if (existingCompany) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('company')
          .update(companyData)
          .eq('id', existingCompany.id);

        if (updateError) {
          throw new Error(updateError.message || 'Failed to update company');
        }
        showToast('Company updated successfully!', 'success', 2000);
      } else {
        // Create new company
        const { error: insertError } = await supabase
          .from('company')
          .insert([companyData]);

        if (insertError) {
          throw new Error(insertError.message || 'Failed to create company');
        }
        showToast('Company created successfully!', 'success', 2000);
      }

      setIsEditingCompany(false);
    } catch (error: any) {
      console.error('Update company error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleCancelEditCompany = () => {
    // Reload company data from database
    const fetchCompanyData = async () => {
      if (!session?.user?.id) return;

      try {
        const { data: companyData, error } = await supabase
          .from('company')
          .select('company_name, country, state, legal_name, phone, support_email, address, timezone, units')
          .eq('user_id', session.user.id)
          .single();

        if (!error && companyData) {
          setCompanyName(companyData.company_name || '');
          setCountry(companyData.country || '');
          setState(companyData.state || '');
          setLegalName(companyData.legal_name || '');
          setPhone(companyData.phone || '');
          setSupportEmail(companyData.support_email || '');
          setAddress(companyData.address || '');
          setTimezone(companyData.timezone || '');
          setUnits(companyData.units || 'imperial');
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };

    fetchCompanyData();
    setIsEditingCompany(false);
  };

  const renderProfileTab = () => {
    const formFields = [
      {
        id: 'firstName',
        label: 'First Name',
        type: 'text',
        value: firstName,
        onChangeText: setFirstName,
        placeholder: 'First Name',
        editable: isEditingProfile,
      },
      {
        id: 'lastName',
        label: 'Last Name',
        type: 'text',
        value: lastName,
        onChangeText: setLastName,
        placeholder: 'Last Name',
        editable: isEditingProfile,
      },
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        value: email,
        onChangeText: setEmail,
        placeholder: 'Email',
        editable: isEditingProfile,
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      },
      {
        id: 'phone',
        label: 'Phone Number',
        type: 'phone',
        value: phoneNumber,
      },
    ];

    const renderFormField = ({ item }: { item: typeof formFields[0] }) => {
      if (item.type === 'phone') {
        return (
          <View style={[styles.formSection, styles.inputContainer]}>
            <PhoneInput
              value={phoneNumber}
              onChangePhoneNumber={setPhoneNumber}
              selectedCountry={selectedCountry}
              onChangeSelectedCountry={setSelectedCountry}
              disabled={!isEditingProfile}
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
        );
      }

      return (
        <View style={[styles.formSection, styles.inputContainer]}>
          <Text style={styles.label}>{item.label}</Text>
          <Input
            placeholder={item.placeholder}
            value={item.value}
            onChangeText={item.onChangeText}
            editable={item.editable}
            keyboardType={item.keyboardType as any}
            autoCapitalize={item.autoCapitalize as any}
            style={styles.input}
          />
        </View>
      );
    };

    const renderHeader = () => (
      <>
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
          <Text style={styles.profileRole}>Administrator</Text>
        </View>

        {/* Edit Button */}
        {!isEditingProfile && (
          <View style={styles.editButtonContainer}>
            <Button
              variant="gradient"
              title="Edit Profile"
              onPress={() => setIsEditingProfile(true)}
              style={styles.editButton}
            />
          </View>
        )}
      </>
    );

    const renderFooter = () => (
      <>
        {/* Save/Cancel Buttons */}
        {isEditingProfile && (
          <View style={[styles.formSection, styles.buttonGroup]}>
            <TouchableOpacity
              onPress={handleCancelEditProfile}
              style={styles.cancelButton}
              disabled={profileLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.saveButtonContainer}>
              <Button
                variant="gradient"
                title={profileLoading ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdateProfile}
                style={styles.saveButton}
                disabled={profileLoading}
              />
            </View>
          </View>
        )}
      </>
    );

    return (
      <FlatList
        data={formFields}
        renderItem={renderFormField}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        style={styles.tabContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  const renderCompanyTab = () => {
    if (loadingCompanyData) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingBar variant="bar" />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyTitle}>Company Information</Text>
          <Text style={styles.companySubtitle}>
            Manage your company details and settings
          </Text>
        </View>

        {/* Edit Button */}
        {!isEditingCompany && (
          <View style={styles.editButtonContainer}>
            <Button
              variant="gradient"
              title="Edit Company"
              onPress={() => setIsEditingCompany(true)}
              style={styles.editButton}
            />
          </View>
        )}

        {/* Company Form */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Company Name *</Text>
            <Input
              placeholder="Enter company name"
              value={companyName}
              onChangeText={setCompanyName}
              editable={isEditingCompany}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country *</Text>
            <Input
              placeholder="Enter country"
              value={country}
              onChangeText={setCountry}
              editable={isEditingCompany}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>State (Optional)</Text>
            <Input
              placeholder="Enter state or province"
              value={state}
              onChangeText={setState}
              editable={isEditingCompany}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Legal Name (Optional)</Text>
            <Input
              placeholder="Enter legal company name"
              value={legalName}
              onChangeText={setLegalName}
              editable={isEditingCompany}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone (Optional)</Text>
            <Input
              placeholder="Enter company phone number"
              value={phone}
              onChangeText={setPhone}
              editable={isEditingCompany}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Support Email (Optional)</Text>
            <Input
              placeholder="Enter support email address"
              value={supportEmail}
              onChangeText={setSupportEmail}
              editable={isEditingCompany}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address (Optional)</Text>
            <Input
              placeholder="Enter company address"
              value={address}
              onChangeText={setAddress}
              editable={isEditingCompany}
              autoCapitalize="words"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Timezone (Optional)</Text>
            <Input
              placeholder="Enter timezone (e.g., America/New_York)"
              value={timezone}
              onChangeText={setTimezone}
              editable={isEditingCompany}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Units *</Text>
            <View style={styles.unitsContainer}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  units === 'imperial' && styles.unitButtonActive,
                  !isEditingCompany && styles.unitButtonDisabled,
                ]}
                onPress={() => isEditingCompany && setUnits('imperial')}
                disabled={!isEditingCompany}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    units === 'imperial' && styles.unitButtonTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  units === 'metric' && styles.unitButtonActive,
                  !isEditingCompany && styles.unitButtonDisabled,
                ]}
                onPress={() => isEditingCompany && setUnits('metric')}
                disabled={!isEditingCompany}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    units === 'metric' && styles.unitButtonTextActive,
                  ]}
                >
                  Metric
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save/Cancel Buttons */}
          {isEditingCompany && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={handleCancelEditCompany}
                style={styles.cancelButton}
                disabled={companyLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.saveButtonContainer}>
                <Button
                  variant="gradient"
                  title={companyLoading ? 'Saving...' : 'Save Changes'}
                  onPress={handleUpdateCompany}
                  style={styles.saveButton}
                  disabled={companyLoading}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return <SettingsSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <TopBar
        title="Setting"
        showBack={false}
        showHamburger={true}
        onHamburgerPress={() => setSidebarVisible(true)}
      />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'profile' && styles.activeTabText,
              ]}
            >
              Admin Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'company' && styles.activeTab]}
            onPress={() => setActiveTab('company')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'company' && styles.activeTabText,
              ]}
            >
              Company
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'profile' ? renderProfileTab() : renderCompanyTab()}
      </KeyboardAvoidingView>
      <BottomNavBar />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
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
  tabsContainer: {
    flexDirection: 'row',
    // paddingHorizontal: 20,
    // paddingTop: 8,
    // paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomColor: TEAL_GREEN,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: TEAL_GREEN,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
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
  companyHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  companyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  companySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  unitsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonActive: {
    borderColor: TEAL_GREEN,
    backgroundColor: TEAL_GREEN,
  },
  unitButtonDisabled: {
    opacity: 0.6,
  },
  unitButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

