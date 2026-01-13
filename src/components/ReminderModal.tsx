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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './Input';
import { supabase } from '../../lib/supabase';

interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_no?: string;
  userId?: string; // UUID of the admin who created this user
}

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminderData: {
    reminder_type: string;
    reminder_date: string;
    asset_id: string;
    assigned_id: string;
    interval_days: number;
  }) => Promise<void>;
  assetId?: string;
  assetName?: string;
  defaultReminderType?: string;
  loading?: boolean;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  onClose,
  onSave,
  assetId,
  assetName,
  defaultReminderType = '',
  loading = false,
}) => {
  const [reminderType, setReminderType] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [assignedId, setAssignedId] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState<{
    reminder_type?: string;
    reminder_date?: string;
    assigned_id?: string;
    interval_days?: string;
  }>({});

  const reminderTypes = [
    'Oil Change',
    'Tire Rotation / Replacement',
    'General Inspection',
    'Fluids',
    'Belts',
    'Lights',
    'Battery',
    'Brake Inspection',
    'Compliance Inspection (DOT, State, CDL-related)',
    'Custom (Admin-created)',
  ];

  // Fetch users for assignment
  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  // Set default values when modal opens
  useEffect(() => {
    if (visible) {
      setReminderType(defaultReminderType || '');
      setReminderDate('');
      setReminderTime('');
      setAssignedId('');
      setIntervalDays('0');
      setErrors({});
    }
  }, [visible, defaultReminderType]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        return;
      }

      // Fetch users created by this admin
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone_no, userId')
        .eq('userId', session.user.id)
        .eq('role', 'user')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSave = async () => {
    // Validate form
    const newErrors: typeof errors = {};

    if (!reminderType.trim()) {
      newErrors.reminder_type = 'Reminder type is required';
    }

    if (!reminderDate.trim()) {
      newErrors.reminder_date = 'Reminder date is required';
    }

    if (!assignedId) {
      newErrors.assigned_id = 'Please assign to a user';
    }

    if (!intervalDays.trim() || isNaN(Number(intervalDays)) || Number(intervalDays) < 0) {
      newErrors.interval_days = 'Interval days must be a valid number (0 or greater)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Combine date and time
    let reminderDateTime = reminderDate;
    if (reminderTime) {
      reminderDateTime = `${reminderDate}T${reminderTime}:00`;
    } else {
      reminderDateTime = `${reminderDate}T00:00:00`;
    }

    // Get the assigned user's UUID (userId field)
    const selectedUser = users.find(u => u.id.toString() === assignedId);
    if (!selectedUser?.userId) {
      Alert.alert('Error', 'Selected user does not have a valid UUID');
      return;
    }

    if (!assetId) {
      Alert.alert('Error', 'Asset ID is required');
      return;
    }

    try {
      await onSave({
        reminder_type: reminderType,
        reminder_date: reminderDateTime,
        asset_id: assetId,
        assigned_id: selectedUser.userId,
        interval_days: Number(intervalDays),
      });
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

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
                <Text style={styles.modalTitle}>Schedule Reminder</Text>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.closeButton}
                  disabled={loading}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {assetName && (
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetInfoLabel}>Asset:</Text>
                    <Text style={styles.assetInfoText}>{assetName}</Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Reminder Type *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.typeScrollView}
                  >
                    <View style={styles.typeContainer}>
                      {reminderTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typeChip,
                            reminderType === type && styles.typeChipSelected,
                          ]}
                          onPress={() => {
                            if (!loading) {
                              setReminderType(type);
                              setErrors({ ...errors, reminder_type: undefined });
                            }
                          }}
                          disabled={loading}
                        >
                          <Text
                            style={[
                              styles.typeChipText,
                              reminderType === type && styles.typeChipTextSelected,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {errors.reminder_type && (
                    <Text style={styles.errorText}>{errors.reminder_type}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Reminder Date *</Text>
                  <Input
                    placeholder="YYYY-MM-DD"
                    value={reminderDate}
                    onChangeText={(text) => {
                      setReminderDate(text);
                      setErrors({ ...errors, reminder_date: undefined });
                    }}
                    keyboardType="default"
                    style={errors.reminder_date ? styles.inputError : undefined}
                    editable={!loading}
                  />
                  {errors.reminder_date && (
                    <Text style={styles.errorText}>{errors.reminder_date}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
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

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Assign To *</Text>
                  {loadingUsers ? (
                    <Text style={styles.loadingText}>Loading users...</Text>
                  ) : users.length === 0 ? (
                    <Text style={styles.errorText}>No users available. Please create users first.</Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.userScrollView}
                    >
                      <View style={styles.userContainer}>
                        {users.map((user) => (
                          <TouchableOpacity
                            key={user.id}
                            style={[
                              styles.userChip,
                              assignedId === user.id.toString() && styles.userChipSelected,
                            ]}
                            onPress={() => {
                              if (!loading) {
                                setAssignedId(user.id.toString());
                                setErrors({ ...errors, assigned_id: undefined });
                              }
                            }}
                            disabled={loading}
                          >
                            <Text
                              style={[
                                styles.userChipText,
                                assignedId === user.id.toString() && styles.userChipTextSelected,
                              ]}
                            >
                              {user.first_name} {user.last_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                  {errors.assigned_id && (
                    <Text style={styles.errorText}>{errors.assigned_id}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
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
                    <Text style={styles.saveButtonText}>Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeScrollView: {
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeChipSelected: {
    backgroundColor: '#14AB98',
    borderColor: '#14AB98',
  },
  typeChipText: {
    fontSize: 12,
    color: '#666',
  },
  typeChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  userScrollView: {
    marginBottom: 8,
  },
  userContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  userChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userChipSelected: {
    backgroundColor: '#14AB98',
    borderColor: '#14AB98',
  },
  userChipText: {
    fontSize: 12,
    color: '#666',
  },
  userChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
});
