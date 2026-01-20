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
  tire_rotation: 'Tire Rotation / Replacement',
  general_inspection: 'General Inspection',
  fluids: 'Fluids',
  belts: 'Belts',
  lights: 'Lights',
  battery: 'Battery',
  brake_inspection: 'Brake Inspection',
  compliance_inspection: 'Compliance Inspection (DOT, State, CDL-related)',
  custom: 'Custom (Admin-created)',
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

  // Parse reminders JSON when asset changes
  useEffect(() => {
    if (visible && asset?.reminders) {
      try {
        const parsed = typeof asset.reminders === 'string' 
          ? JSON.parse(asset.reminders) 
          : asset.reminders;
        setReminders(parsed || {});
      } catch (error) {
        console.error('Error parsing reminders:', error);
        setReminders({});
      }
    } else if (visible) {
      setReminders({});
    }
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

  const reminderTypes = Object.keys(reminderTypeLabels);

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

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {asset && (
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetInfoLabel}>Asset:</Text>
                    <Text style={styles.assetInfoText}>{asset.asset_name}</Text>
                  </View>
                )}

                <View style={styles.checklistContainer}>
                  {reminderTypes.map((type) => (
                    <View key={type} style={styles.checklistItem}>
                      <View style={styles.checklistItemHeader}>
                        <Text style={styles.checklistItemLabel}>
                          {reminderTypeLabels[type] || type}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => openDatePicker(type)}
                        disabled={loading}
                      >
                        <Text style={styles.dateButtonText}>
                          {reminders[type]?.lastUpdate
                            ? formatDate(reminders[type].lastUpdate)
                            : 'Not set'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#14AB98" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
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
});
