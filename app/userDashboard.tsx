import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { Sidebar } from '../src/components/Sidebar';
import { TopBar } from '../src/components/TopBar';
import { LoadingBar } from '../src/components/LoadingBar';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function UserDashboardScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalAssets, setTotalAssets] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get the userId (admin who created this user)
      let filterUserId: string | undefined;
      
      if (userProfile.userId) {
        filterUserId = userProfile.userId;
      } else if (userProfile.id) {
        const { data: fullUserProfile } = await supabase
          .from('users')
          .select('userId')
          .eq('id', userProfile.id)
          .single();
        
        if (fullUserProfile?.userId) {
          filterUserId = fullUserProfile.userId;
        }
      }

      // Fetch total assets
      if (filterUserId) {
        const { count: assetsCount } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', filterUserId);
        
        setTotalAssets(assetsCount || 0);
      }

      // Fetch unread notifications count
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('read', false);
      
      setUnreadNotifications(unreadCount || 0);

      // Fetch recent notifications (last 3)
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, message, read, created_at')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setRecentNotifications(notifications || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar
          title="User Dashboard"
          showHamburger={true}
          onHamburgerPress={() => setSidebarVisible(true)}
        />
        <View style={styles.loadingContainer}>
          <LoadingBar variant="bar" />
        </View>
        <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <TopBar
        title="Dashboard"
        showHamburger={true}
        onHamburgerPress={() => setSidebarVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card with Gradient */}
        <LinearGradient
          colors={[TEAL_GREEN, BRIGHT_GREEN]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeGreeting}>Welcome back,</Text>
              <Text style={styles.welcomeName}>
                {userProfile?.first_name || 'User'}!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Manage your fleet and stay on top of your tasks
              </Text>
            </View>
            <View style={styles.welcomeIconContainer}>
              <Ionicons name="car-sport" size={48} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/userAssets')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${TEAL_GREEN}15` }]}>
              <Ionicons name="car-outline" size={24} color={TEAL_GREEN} />
            </View>
            <Text style={styles.statValue}>{totalAssets}</Text>
            <Text style={styles.statLabel}>Total Assets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${BRIGHT_GREEN}15` }]}>
              <Ionicons name="notifications-outline" size={24} color={BRIGHT_GREEN} />
            </View>
            <Text style={styles.statValue}>{unreadNotifications}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/userAssets')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[TEAL_GREEN, `${TEAL_GREEN}DD`]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="car" size={28} color="#fff" />
                <Text style={styles.quickActionText}>View Assets</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[BRIGHT_GREEN, `${BRIGHT_GREEN}DD`]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="notifications" size={28} color="#fff" />
                <Text style={styles.quickActionText}>Notifications</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadNotificationCard,
                ]}
                onPress={() => router.push(`/notifications/${notification.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationIconContainer}>
                    <Ionicons
                      name={notification.read ? 'checkmark-circle-outline' : 'ellipse'}
                      size={20}
                      color={notification.read ? '#999' : TEAL_GREEN}
                    />
                  </View>
                  <View style={styles.notificationTextContainer}>
                    <Text
                      style={[
                        styles.notificationMessage,
                        !notification.read && styles.unreadNotificationMessage,
                      ]}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.created_at)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State for Notifications */}
        {recentNotifications.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll see important updates here
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNavBar />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  welcomeGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: TEAL_GREEN,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotificationCard: {
    borderLeftWidth: 4,
    borderLeftColor: TEAL_GREEN,
    backgroundColor: '#F0FDFA',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadNotificationMessage: {
    color: '#000',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

