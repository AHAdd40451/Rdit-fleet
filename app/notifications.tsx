import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useConfirmationModal } from '../src/contexts/ConfirmationModalContext';
import { supabase } from '../lib/supabase';
import { LoadingBar } from '../src/components/LoadingBar';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { TopBar } from '../src/components/TopBar';
import { Sidebar } from '../src/components/Sidebar';
import { Ionicons } from '@expo/vector-icons';

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

export default function NotificationsScreen() {
  const router = useRouter();
  const { signOut, userProfile } = useAuth();
  const { showConfirmation } = useConfirmationModal();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const fetchNotifications = async () => {
    try {
      setError(null);

      if (!userProfile?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Fetch notifications for the current user
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userProfile]);

  const handleMarkAsRead = async (notificationId: string) => {
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
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error in mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userProfile?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userProfile.id)
        .eq('read', false);

      if (updateError) {
        console.error('Error marking all as read:', updateError);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Error in mark all as read:', err);
    }
  };

  const handleLogout = () => {
    showConfirmation({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await signOut();
        router.replace('/');
      },
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <TopBar
        title="Notifications"
        showBack={false}
        showHamburger={true}
        onHamburgerPress={() => setSidebarVisible(true)}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.titleRow}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount} unread</Text>
              </View>
            )}
          </View>
          <Text style={styles.welcomeSubtitle}>
            Stay updated with your fleet activities and important updates.
          </Text>
        </View>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <View style={styles.markAllContainer}>
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.contentSection}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={fetchNotifications}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                You'll see notifications here when your admin creates new assets
                or updates.
              </Text>
            </View>
          ) : (
            notifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                ]}
                onPress={() => router.push(`/notifications/${notification.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Ionicons
                      name={
                        notification.type === 'asset_created'
                          ? 'car-outline'
                          : 'information-circle-outline'
                      }
                      size={20}
                      color={notification.read ? '#666' : TEAL_GREEN}
                    />
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <View style={styles.notificationBody}>
                    <Text
                      style={[
                        styles.notificationMessage,
                        !notification.read && styles.unreadMessage,
                      ]}
                    >
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: TEAL_GREEN,
    borderRadius: 12,
    minWidth: 80,
    height: 28,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  markAllContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  markAllButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  markAllText: {
    fontSize: 14,
    color: TEAL_GREEN,
    fontWeight: '600',
  },
  contentSection: {
    paddingHorizontal: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: TEAL_GREEN,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: '#f0f9f7',
    borderLeftColor: TEAL_GREEN,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  notificationHeader: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEAL_GREEN,
    marginTop: 4,
  },
  notificationBody: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  unreadMessage: {
    color: '#000',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
});

