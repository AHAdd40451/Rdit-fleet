import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmationModal } from '../contexts/ConfirmationModalContext';
import { supabase } from '../../lib/supabase';

const THEME_COLOR = '#14AB98';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const { showConfirmation } = useConfirmationModal();
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      // Reset to starting position before animating
      slideAnim.setValue(-SIDEBAR_WIDTH);
      // Animate to visible position
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      // Animate to hidden position
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('read', false);

      if (count !== null) setUnreadCount(count);
    };

    fetchUnread();
  }, [userProfile]);

  if (!userProfile) return null;

  const initials =
    `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}`.toUpperCase();

  const handleNav = (route: string) => {
    router.push(route as any);
    onClose();
  };

  const handleLogout = () => {
    onClose();
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

  const navItems = [
    { label: 'Home', icon: 'home-outline', route: '/home' },
    { label: 'Profile', icon: 'person-outline', route: '/profile' },
    // { label: 'History', icon: 'time-outline', route: '/history' },
    // { label: 'Author', icon: 'create-outline', route: '/author' },
    {
      label: 'Notifications',
      icon: 'notifications-outline',
      route: '/notifications',
      badge: unreadCount,
    },
    // { label: 'Help', icon: 'help-circle-outline', route: '/help' },
    { label: 'Setting', icon: 'settings-outline', route: '/settings' },
  ];

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} />
          </TouchableOpacity>

          {/* User */}
          <View style={styles.userHeader}>
            {userProfile.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.name}>
                {userProfile.first_name} {userProfile.last_name}
              </Text>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            {navItems.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNav(item.route)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon as any} size={22} color="#333" />
                  {item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logout} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#E53935" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    paddingTop: 30,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1,
    flex: 1,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hello: {
    fontSize: 13,
    color: '#888',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  menu: {
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 28,
  },
  menuText: {
    marginLeft: 16,
    fontSize: 15,
    color: '#222',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#E53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  logout: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 15,
    color: '#E53935',
    fontWeight: '600',
  },
});
