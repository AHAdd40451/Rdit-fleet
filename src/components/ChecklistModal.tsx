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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from './Input';
import { supabase } from '../../lib/supabase';

interface ReminderData {
  [key: string]: {
    lastUpdate: string;
  };
}

interface ChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminders: string) => Promise<void>;
  asset: {
    id?: string;
    asset_name: string;
    reminders?: string | null;
  } | null;
  loading?: boolean;
}

const reminderTypeLabels: { [key: string]: string } = {
  oil_change: 'Oil Change',
  tire_rotation: 'Tire Rotation',
  tire_replacement: 'Tire Replacement',
  general_inspection: 'General Inspection',
  fluids: 'Fluids',
  belts: 'Belts',
  lights: 'Lights',
  battery: 'Battery',
  brake_inspection: 'Brake Inspection',
  compliance_inspection: 'Compliance Inspection',
  custom_maintenance: 'Custom Maintenance',
};

// Reverse map: display name -> key
const reminderTypeKeys: { [key: string]: string } = {
  'Oil Change': 'oil_change',
  'Tire Rotation': 'tire_rotation',
  'Tire Replacement': 'tire_replacement',
  'General Inspection': 'general_inspection',
  'Fluids': 'fluids',
  'Belts': 'belts',
  'Lights': 'lights',
  'Battery': 'battery',
  'Brake Inspection': 'brake_inspection',
  'Compliance Inspection': 'compliance_inspection',
  'Custom Maintenance': 'custom_maintenance',
};

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  visible,
  onClose,
  onSave,
  asset,
  loading = false,
}) => {
  const [reminders, setReminders] = useState<ReminderData>({});
  const [editingType, setEditingType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableReminderTypes, setAvailableReminderTypes] = useState<string[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [selectedPillType, setSelectedPillType] = useState<string | null>(null);
  const [dateInputs, setDateInputs] = useState<{ [key: string]: string }>({});

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch reminders for the asset and extract reminder types
  useEffect(() => {
    const fetchReminderTypes = async () => {
      if (!visible || !asset?.id) {
        setAvailableReminderTypes([]);
        setReminders({});
        return;
      }

      try {
        setLoadingReminders(true);
        setSelectedPillType(null);
        
        // Fetch reminders for this asset
        const { data: remindersData, error } = await supabase
          .from('reminders')
          .select('reminder_type')
          .eq('asset_id', asset.id);

        if (error) {
          console.error('Error fetching reminders:', error);
          setAvailableReminderTypes([]);
          setReminders({});
          return;
        }

        // Extract unique reminder type names from all reminders
        const typeNames = new Set<string>();
        if (remindersData && remindersData.length > 0) {
          remindersData.forEach((reminder: any) => {
            if (reminder.reminder_type && Array.isArray(reminder.reminder_type)) {
              reminder.reminder_type.forEach((typeObj: any) => {
                if (typeObj && typeObj.name && typeObj.active) {
                  typeNames.add(typeObj.name);
                }
              });
            }
          });
        }

        // Map display names to keys
        const availableKeys = Array.from(typeNames)
          .map(name => reminderTypeKeys[name])
          .filter(key => key !== undefined) as string[];

        setAvailableReminderTypes(availableKeys);

        // Parse existing reminders JSON if available
        if (asset.reminders) {
          try {
            const parsed = typeof asset.reminders === 'string' 
              ? JSON.parse(asset.reminders) 
              : asset.reminders;
            setReminders(parsed || {});
            
            // Initialize date inputs from existing reminders
            const inputs: { [key: string]: string } = {};
            Object.keys(parsed || {}).forEach((key) => {
              if (parsed[key]?.lastUpdate) {
                const date = new Date(parsed[key].lastUpdate);
                inputs[key] = formatDateForInput(date);
              }
            });
            setDateInputs(inputs);
          } catch (error) {
            console.error('Error parsing reminders:', error);
            setReminders({});
            setDateInputs({});
          }
        } else {
          setReminders({});
          setDateInputs({});
        }
      } catch (error) {
        console.error('Error in fetchReminderTypes:', error);
        setAvailableReminderTypes([]);
        setReminders({});
      } finally {
        setLoadingReminders(false);
      }
    };

    fetchReminderTypes();
  }, [visible, asset]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Not set';
    }
  };

  const handlePillClick = (type: string) => {
    if (loading) return;
    setSelectedPillType(selectedPillType === type ? null : type);
    
    // Initialize date input if not already set
    if (!dateInputs[type] && reminders[type]?.lastUpdate) {
      const date = new Date(reminders[type].lastUpdate);
      setDateInputs({
        ...dateInputs,
        [type]: formatDateForInput(date),
      });
    } else if (!dateInputs[type]) {
      setDateInputs({
        ...dateInputs,
        [type]: '',
      });
    }
  };

  const handleDateInputChange = (type: string, value: string) => {
    setDateInputs({
      ...dateInputs,
      [type]: value,
    });
    
    // Update reminders when date is entered
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const updatedReminders = {
            ...reminders,
            [type]: {
              lastUpdate: date.toISOString(),
            },
          };
          setReminders(updatedReminders);
        }
      } catch (error) {
        console.error('Error parsing date input:', error);
      }
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') {
        setEditingType(null);
        return;
      }
    }

    if (date && editingType) {
      const updatedReminders = {
        ...reminders,
        [editingType]: {
          lastUpdate: date.toISOString(),
        },
      };
      setReminders(updatedReminders);
      
      // Update date input as well
      setDateInputs({
        ...dateInputs,
        [editingType]: formatDateForInput(date),
      });
      
      setEditingType(null);
    }
  };

  const openDatePicker = (type: string) => {
    if (loading) return;
    
    const currentDate = reminders[type]?.lastUpdate
      ? new Date(reminders[type].lastUpdate)
      : new Date();
    
    setSelectedDate(currentDate);
    setEditingType(type);
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    if (!asset?.id) return;

    try {
      const remindersJson = JSON.stringify(reminders);
      await onSave(remindersJson);
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  // Only show reminder types that have been created for this asset
  const reminderTypes = availableReminderTypes.length > 0 
    ? availableReminderTypes 
    : [];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Maintenance Checklist</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  disabled={loading}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalBody} 
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                nestedScrollEnabled={true}
                bounces={false}
              >
                {asset && (
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetInfoLabel}>Asset:</Text>
                    <Text style={styles.assetInfoText}>{asset.asset_name}</Text>
                  </View>
                )}

                {loadingReminders ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#14AB98" />
                    <Text style={styles.loadingText}>Loading reminders...</Text>
                  </View>
                ) : reminderTypes.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="information-circle-outline" size={48} color="#999" />
                    <Text style={styles.emptyText}>
                      No reminders have been scheduled for this asset yet.
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Schedule a reminder first to track maintenance.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.checklistContainer}>
                    {/* Display reminder types as pills */}
                    <View style={styles.pillsContainer}>
                      <Text style={styles.pillsLabel}>Reminder Types:</Text>
                      <View style={styles.pillsRow}>
                        {reminderTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.typePill,
                              selectedPillType === type && styles.typePillSelected,
                            ]}
                            onPress={() => handlePillClick(type)}
                            disabled={loading}
                          >
                            <Text
                              style={[
                                styles.typePillText,
                                selectedPillType === type && styles.typePillTextSelected,
                              ]}
                            >
                              {reminderTypeLabels[type] || type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Display input field for selected pill */}
                    {selectedPillType && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                          Last Update Date for {reminderTypeLabels[selectedPillType] || selectedPillType}
                        </Text>
                        <Input
                          placeholder="YYYY-MM-DD"
                          value={dateInputs[selectedPillType] || ''}
                          onChangeText={(text) => handleDateInputChange(selectedPillType, text)}
                          keyboardType="default"
                          editable={!loading}
                        />
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => openDatePicker(selectedPillType)}
                          disabled={loading}
                        >
                          <Text style={styles.datePickerButtonText}>
                            Or select from calendar
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color="#14AB98" />
                        </TouchableOpacity>
                        {reminders[selectedPillType]?.lastUpdate && (
                          <Text style={styles.currentDateText}>
                            Current: {formatDate(reminders[selectedPillType].lastUpdate)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                  />
                  {Platform.OS === 'ios' && (
                    <View style={styles.iosDatePickerContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setEditingType(null);
                        }}
                        style={styles.iosDatePickerDoneButton}
                      >
                        <Text style={styles.iosDatePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  assetInfo: {
    marginBottom: 20,
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
  checklistContainer: {
    gap: 16,
  },
  checklistItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  checklistItemHeader: {
    marginBottom: 8,
  },
  checklistItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalFooter: {
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
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  iosDatePicker: {
    height: 200,
  },
  iosDatePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingBottom: 20,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  pillsContainer: {
    marginBottom: 20,
  },
  pillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typePillSelected: {
    backgroundColor: '#14AB98',
    borderColor: '#14AB98',
  },
  typePillText: {
    fontSize: 12,
    color: '#666',
  },
  typePillTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#14AB98',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#14AB98',
    marginRight: 8,
    fontWeight: '600',
  },
  currentDateText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  allRemindersContainer: {
    marginTop: 20,
  },
  allRemindersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
});
