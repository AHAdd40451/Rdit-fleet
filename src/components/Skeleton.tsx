import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.card, style]}>
    <Skeleton width="60%" height={20} borderRadius={4} />
    <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
    <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
  </View>
);

// List Item Skeleton
export const ListItemSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.listItem, style]}>
    <Skeleton width={48} height={48} borderRadius={24} />
    <View style={skeletonStyles.listItemContent}>
      <Skeleton width="60%" height={16} borderRadius={4} />
      <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  </View>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <View style={skeletonStyles.tableRow}>
    {Array.from({ length: columns }).map((_, index) => (
      <Skeleton
        key={index}
        width="80%"
        height={16}
        borderRadius={4}
        style={{ marginHorizontal: 4 }}
      />
    ))}
  </View>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.dashboardCard, style]}>
    <Skeleton width={48} height={48} borderRadius={24} />
    <Skeleton width="60%" height={24} borderRadius={4} style={{ marginTop: 12 }} />
    <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
  </View>
);

// Welcome Card Skeleton
export const WelcomeCardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.welcomeCard, style]}>
    <View style={skeletonStyles.welcomeContent}>
      <View>
        <Skeleton width={120} height={16} borderRadius={4} />
        <Skeleton width={180} height={28} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width={200} height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={80} height={80} borderRadius={40} />
    </View>
  </View>
);

// Stat Card Skeleton
export const StatCardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.statCard, style]}>
    <Skeleton width={48} height={48} borderRadius={24} />
    <Skeleton width={40} height={28} borderRadius={4} style={{ marginTop: 12 }} />
    <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
  </View>
);

// Notification Card Skeleton
export const NotificationCardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.notificationCard, style]}>
    <Skeleton width={20} height={20} borderRadius={10} />
    <View style={skeletonStyles.notificationContent}>
      <Skeleton width="90%" height={16} borderRadius={4} />
      <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  </View>
);

// Asset Card Skeleton
export const AssetCardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.assetCard, style]}>
    <Skeleton width="70%" height={18} borderRadius={4} />
    <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
    <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
  </View>
);

// Form Field Skeleton
export const FormFieldSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.formField, style]}>
    <Skeleton width={80} height={14} borderRadius={4} />
    <Skeleton width="100%" height={48} borderRadius={8} style={{ marginTop: 8 }} />
  </View>
);

// Profile Avatar Skeleton
export const ProfileAvatarSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[skeletonStyles.profileAvatar, style]}>
    <Skeleton width={100} height={100} borderRadius={50} />
    <Skeleton width={30} height={30} borderRadius={15} style={skeletonStyles.cameraIcon} />
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dashboardCard: {
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
  welcomeCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  assetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  formField: {
    marginBottom: 20,
  },
  profileAvatar: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
});
