import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from './Input';

// Optional haptics import
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface Asset {
  id?: string;
  asset_name: string;
}

interface ReminderBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminderData: {
    reminder_type: Array<{
      name: string;
      active: boolean;
      schedule_date: string;
      time: string;
      interval: number;
    }>;
    reminder_date: string;
    asset_id: string;
    assigned_id: string | null;
    interval_days: number;
  }) => Promise<void>;
  asset: Asset | null;
  loading?: boolean;
}

const maintenanceTypes = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'tire_replacement', label: 'Tire Replacement' },
  { value: 'general_inspection', label: 'General Inspection' },
  { value: 'brake_inspection', label: 'Brake Inspection' },
  { value: 'battery', label: 'Battery' },
  { value: 'fluids', label: 'Fluids' },
  { value: 'belts', label: 'Belts' },
  { value: 'lights', label: 'Lights' },
  { value: 'compliance_inspection', label: 'Compliance Inspection' },
  { value: 'custom_maintenance', label: 'Custom Maintenance' },
];

export const ReminderBottomSheet: React.FC<ReminderBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  asset,
  loading = false,
}) => {
  const slideAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const badgeAnimations = useRef<{ [key: string]: Animated.Value }>({});
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [intervalDays, setIntervalDays] = useState('0');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [errors, setErrors] = useState<{
    reminder_type?: string;
    reminder_date?: string;
    interval_days?: string;
  }>({});

  // Initialize badge animations
  useEffect(() => {
    maintenanceTypes.forEach((type) => {
      if (!badgeAnimations.current[type.value]) {
        badgeAnimations.current[type.value] = new Animated.Value(1);
      }
    });
  }, []);

  useEffect(() => {
    if (visible) {
      // Animate overlay fade in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate bottom sheet slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Animate overlay fade out
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate bottom sheet slide down
      Animated.spring(slideAnim, {
        toValue: BOTTOM_SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSelectedType('');
      setReminderDate('');
      setReminderTime('');
      setIntervalDays('0');
      setSelectedDate(new Date());
      setShowDatePicker(false);
      setErrors({});
      // Reset form animations
      formOpacity.setValue(0);
      formTranslateY.setValue(20);
    }
  }, [visible]);

  // Animate form appearance when type is selected
  useEffect(() => {
    if (selectedType) {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } else {
      formOpacity.setValue(0);
      formTranslateY.setValue(20);
    }
  }, [selectedType]);

  const handleTypeSelect = (type: string) => {
    // Haptic feedback (if available)
    if (Platform.OS === 'ios' && Haptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics not available
      }
    }

    // Animate badge press
    const badgeAnim = badgeAnimations.current[type];
    if (badgeAnim) {
      Animated.sequence([
        Animated.timing(badgeAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(badgeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setSelectedType(type);
    setErrors({ ...errors, reminder_type: undefined });
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = formatDateForInput(date);
      setReminderDate(formattedDate);
      setErrors({ ...errors, reminder_date: undefined });
    }
  };

  const openDatePicker = () => {
    if (!loading) {
      setShowDatePicker(true);
    }
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    if (!selectedType) {
      newErrors.reminder_type = 'Please select a maintenance type';
    }

    if (!reminderDate.trim()) {
      newErrors.reminder_date = 'Reminder date is required';
    }

    if (!intervalDays.trim() || isNaN(Number(intervalDays)) || Number(intervalDays) < 0) {
      newErrors.interval_days = 'Interval days must be a valid number (0 or greater)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!asset?.id) {
      Alert.alert('Error', 'Asset ID is required');
      return;
    }

    // Combine date and time
    let reminderDateTime = reminderDate;
    if (reminderTime) {
      reminderDateTime = `${reminderDate}T${reminderTime}:00`;
    } else {
      reminderDateTime = `${reminderDate}T00:00:00`;
    }

    try {
      // Get the display name for the selected maintenance type
      const selectedTypeName = maintenanceTypes.find(t => t.value === selectedType)?.label || selectedType;
      
      // Format reminder_date as ISO string with timezone
      const scheduleDate = new Date(reminderDateTime).toISOString();
      
      // Format time as HH:MM:SS or use default
      const formattedTime = reminderTime ? (reminderTime.includes(':') ? reminderTime : `${reminderTime}:00`) : '00:00:00';
      
      // Create reminder in new format
      const reminderTypeObject = {
        name: selectedTypeName,
        active: true,
        schedule_date: scheduleDate,
        time: formattedTime,
        interval: Number(intervalDays),
      };

      const reminderData = {
        reminder_type: [reminderTypeObject],
        reminder_date: scheduleDate,
        asset_id: asset.id,
        assigned_id: null,
        interval_days: Number(intervalDays),
      };

      await onSave(reminderData);
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
              >
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  nestedScrollEnabled={true}
                  scrollEnabled={true}
                  bounces={false}
                  alwaysBounceVertical={false}
                >
                  {/* Handle bar */}
                  <View style={styles.handleBar} />

                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.title}>Schedule Reminder</Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      disabled={loading}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {asset && (
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetInfoLabel}>Asset:</Text>
                      <Text style={styles.assetInfoText}>{asset.asset_name}</Text>
                    </View>
                  )}

                  {/* Maintenance Type Selection */}
                  <View style={styles.section}>
                    <Text style={styles.label}>Select Maintenance Type *</Text>
                    <View style={styles.badgeContainer}>
                      {maintenanceTypes.map((type) => {
                        const badgeAnim = badgeAnimations.current[type.value] || new Animated.Value(1);
                        return (
                          <Animated.View
                            key={type.value}
                            style={{
                              transform: [{ scale: badgeAnim }],
                              opacity: badgeAnim,
                            }}
                          >
                            <TouchableOpacity
                              style={[
                                styles.badge,
                                selectedType === type.value && styles.badgeSelected,
                              ]}
                              onPress={() => handleTypeSelect(type.value)}
                              disabled={loading}
                              activeOpacity={0.7}
                              delayPressIn={50}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  selectedType === type.value && styles.badgeTextSelected,
                                ]}
                              >
                                {type.label}
                              </Text>
                              {selectedType === type.value && (
                                <Animated.View
                                  style={{
                                    opacity: formOpacity,
                                  }}
                                >
                                  <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkmark} />
                                </Animated.View>
                              )}
                            </TouchableOpacity>
                          </Animated.View>
                        );
                      })}
                    </View>
                    {errors.reminder_type && (
                      <Animated.View style={{ opacity: formOpacity }}>
                        <Text style={styles.errorText}>{errors.reminder_type}</Text>
                      </Animated.View>
                    )}
                  </View>

                  {/* Form Fields - Only show when type is selected */}
                  {selectedType && (
                    <Animated.View
                      style={[
                        styles.formContainer,
                        {
                          opacity: formOpacity,
                          transform: [{ translateY: formTranslateY }],
                        },
                      ]}
                    >
                      {/* Reminder Date */}
                      <View style={styles.section}>
                        <Text style={styles.label}>Reminder Date *</Text>
                        <TouchableOpacity
                          onPress={openDatePicker}
                          disabled={loading}
                          activeOpacity={0.7}
                          delayPressIn={50}
                          style={[
                            styles.datePickerButton,
                            errors.reminder_date && styles.inputError,
                          ]}
                        >
                          <Text style={[
                            styles.datePickerText,
                            !reminderDate && styles.datePickerPlaceholder
                          ]}>
                            {reminderDate || 'Select Date (YYYY-MM-DD)'}
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color="#666" />
                        </TouchableOpacity>
                        {errors.reminder_date && (
                          <Text style={styles.errorText}>{errors.reminder_date}</Text>
                        )}
                        {showDatePicker && (
                          <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                            style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                          />
                        )}
                        {Platform.OS === 'ios' && showDatePicker && (
                          <View style={styles.iosDatePickerContainer}>
                            <TouchableOpacity
                              onPress={() => setShowDatePicker(false)}
                              style={styles.iosDatePickerDoneButton}
                            >
                              <Text style={styles.iosDatePickerDoneText}>Done</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Reminder Time */}
                      <View style={styles.section}>
                        <Text style={styles.label}>Reminder Time (Optional)</Text>
                        <Input
                          placeholder="HH:MM (24-hour format)"
                          value={reminderTime}
                          onChangeText={(text) => {
                            setReminderTime(text);
                          }}
                          keyboardType="default"
                          editable={!loading}
                        />
                      </View>

                      {/* Interval Days */}
                      <View style={styles.section}>
                        <Text style={styles.label}>Interval Days *</Text>
                        <Input
                          placeholder="0 for one-time, or number of days for recurring"
                          value={intervalDays}
                          onChangeText={(text) => {
                            setIntervalDays(text);
                            setErrors({ ...errors, interval_days: undefined });
                          }}
                          keyboardType="numeric"
                          style={errors.interval_days ? styles.inputError : undefined}
                          editable={!loading}
                        />
                        <Text style={styles.helperText}>
                          Enter 0 for a one-time reminder, or the number of days between recurring reminders
                        </Text>
                        {errors.interval_days && (
                          <Text style={styles.errorText}>{errors.interval_days}</Text>
                        )}
                      </View>
                    </Animated.View>
                  )}

                  {/* Footer */}
                  <View style={styles.footer}>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.cancelButton}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      style={[styles.saveButton, (!selectedType || loading) && styles.saveButtonDisabled]}
                      disabled={!selectedType || loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>Schedule</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  assetInfo: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  assetInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  assetInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeSelected: {
    backgroundColor: '#14AB98',
    borderColor: '#14AB98',
  },
  badgeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  badgeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 2,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  datePickerPlaceholder: {
    color: '#999',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  iosDatePicker: {
    height: 200,
  },
  iosDatePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  iosDatePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iosDatePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14AB98',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#14AB98',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14AB98',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
