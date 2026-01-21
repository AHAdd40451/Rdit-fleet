import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingBar } from '../../src/components/LoadingBar';
import { TopBar } from '../../src/components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import { NotificationDetailSkeleton } from '../../src/components/SkeletonScreens';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  asset_id?: string;
  read: boolean;
  created_at: string;
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && userProfile?.id) {
      fetchNotification();
    }
  }, [id, userProfile]);

  const fetchNotification = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!userProfile?.id || !id) {
        setError('Invalid notification or user');
        setLoading(false);
        return;
      }

      // Fetch the specific notification
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .eq('user_id', userProfile.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setError('Notification not found');
        setLoading(false);
        return;
      }

      setNotification(data);

      // Mark as read if not already read
      if (!data.read) {
        await markAsRead(id);
      }
    } catch (err: any) {
      console.error('Error fetching notification:', err);
      setError(err.message || 'Failed to fetch notification');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (updateError) {
        console.error('Error marking notification as read:', updateError);
        return;
      }

      // Update local state
      if (notification) {
        setNotification({ ...notification, read: true });
      }
    } catch (err) {
      console.error('Error in mark as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'asset_created':
        return 'car-outline';
      case 'asset_updated':
        return 'car-sport-outline';
      case 'maintenance_due':
        return 'construct-outline';
      case 'maintenance_completed':
        return 'checkmark-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'asset_created':
        return 'Asset Created';
      case 'asset_updated':
        return 'Asset Updated';
      case 'maintenance_due':
        return 'Maintenance Due';
      case 'maintenance_completed':
        return 'Maintenance Completed';
      default:
        return 'Notification';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  if (loading) {
    return <NotificationDetailSkeleton />;
  }

  if (error || !notification) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar
          title="Notification Details"
          showBack={true}
          showHamburger={false}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>
            {error || 'Notification not found'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { date, time } = formatDate(notification.created_at);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TopBar
        title="Notification Details"
        showBack={true}
        showHamburger={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Card */}
        <View style={styles.notificationCard}>
          {/* Icon and Type */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getNotificationIcon(notification.type)}
                size={48}
                color={TEAL_GREEN}
              />
              {!notification.read && <View style={styles.unreadBadge} />}
            </View>
            <View style={styles.typeContainer}>
              <Text style={styles.typeLabel}>
                {getNotificationTypeLabel(notification.type)}
              </Text>
              {!notification.read && (
                <View style={styles.unreadLabel}>
                  <Text style={styles.unreadLabelText}>Unread</Text>
                </View>
              )}
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageSection}>
            <Text style={styles.messageLabel}>Message</Text>
            <Text style={styles.messageText}>{notification.message}</Text>
          </View>

          {/* Date and Time */}
          <View style={styles.dateSection}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateText}>{date}</Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.timeText}>{time}</Text>
            </View>
          </View>

          {/* Asset ID (if available) */}
          {/* {notification.asset_id && (
            <View style={styles.assetSection}>
              <Text style={styles.assetLabel}>Related Asset ID</Text>
              <Text style={styles.assetId}>{notification.asset_id}</Text>
            </View>
          )} */}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {notification.asset_id && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Navigate to asset detail if asset_id exists
                router.push(`/assets`);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="car-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Asset</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: TEAL_GREEN,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  notificationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: TEAL_GREEN,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TEAL_GREEN,
    borderWidth: 2,
    borderColor: '#fff',
  },
  typeContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  unreadLabel: {
    alignSelf: 'flex-start',
    backgroundColor: TEAL_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  unreadLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
  },
  timeText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
  },
  assetSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  assetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assetId: {
    fontSize: 16,
    color: TEAL_GREEN,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionsSection: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_GREEN,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

