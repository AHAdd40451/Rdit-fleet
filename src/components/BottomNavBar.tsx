import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const THEME_COLOR = '#14AB98';

interface BottomNavBarProps {
  activeRoute?: string;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeRoute }) => {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const currentSegment = activeRoute || segments[0] || '';
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userProfile?.id) return;

      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userProfile.id)
          .eq('read', false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for notifications
    if (userProfile?.id) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userProfile.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile]);

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  const isActive = (route: string) => {
    const routeName = route.replace('/', '');
    // Check if current segment matches the route name
    return currentSegment === routeName || segments.some(seg => seg === routeName);
  };

  // Only show bottom nav for admin users
  if (userProfile?.role !== 'admin') {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navBar}>
        {/* Home Icon */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleNavigation('/home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isActive('/home') ? 'home' : 'home-outline'}
            size={24}
            color={isActive('/home') ? THEME_COLOR : '#666'}
          />
        </TouchableOpacity>

        {/* Truck Icon */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleNavigation('/assets')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="local-shipping"
            size={24}
            color={isActive('/assets') ? THEME_COLOR : '#666'}
          />
        </TouchableOpacity>

        {/* Central Plus Button */}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => handleNavigation('/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Notification Icon */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleNavigation('/notifications')}
          activeOpacity={0.7}
        >
          <View style={styles.notificationContainer}>
            <Ionicons
              name={isActive('/notifications') ? 'notifications' : 'notifications-outline'}
              size={24}
              color={isActive('/notifications') ? THEME_COLOR : '#666'}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Settings Icon */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleNavigation('/settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isActive('/settings') ? 'settings' : 'settings-outline'}
            size={24}
            color={isActive('/settings') ? THEME_COLOR : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    // paddingHorizontal: 20,
    paddingVertical: 0,
    // paddingBottom: 20,
    width: '100%',
    height: 50,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: -2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 5,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: THEME_COLOR,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
