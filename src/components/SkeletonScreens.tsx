import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from './TopBar';
import {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  DashboardCardSkeleton,
  WelcomeCardSkeleton,
  StatCardSkeleton,
  NotificationCardSkeleton,
  AssetCardSkeleton,
  FormFieldSkeleton,
  ProfileAvatarSkeleton,
  TableRowSkeleton,
} from './Skeleton';

const TEAL_GREEN = '#14AB98';

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Dashboard" showHamburger={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <WelcomeCardSkeleton />
      <View style={skeletonScreenStyles.statsContainer}>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>
      <View style={skeletonScreenStyles.section}>
        <Skeleton width={120} height={20} borderRadius={4} />
        <View style={skeletonScreenStyles.quickActionsContainer}>
          <DashboardCardSkeleton style={{ flex: 1, marginRight: 6 }} />
          <DashboardCardSkeleton style={{ flex: 1, marginLeft: 6 }} />
        </View>
      </View>
      <View style={skeletonScreenStyles.section}>
        <Skeleton width={150} height={20} borderRadius={4} />
        {[1, 2, 3].map((i) => (
          <NotificationCardSkeleton key={i} />
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Assets Skeleton
export const AssetsSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Assets" showHamburger={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Fleet Health Section */}
      <View style={skeletonScreenStyles.fleetHealthSection}>
        <View style={skeletonScreenStyles.gaugeContainer}>
          <Skeleton width={120} height={120} borderRadius={60} />
        </View>
        <View style={skeletonScreenStyles.metricsGrid}>
          <DashboardCardSkeleton style={{ flex: 1, marginRight: 6 }} />
          <DashboardCardSkeleton style={{ flex: 1, marginLeft: 6 }} />
          <DashboardCardSkeleton style={{ flex: 1, marginRight: 6, marginTop: 12 }} />
          <DashboardCardSkeleton style={{ flex: 1, marginLeft: 6, marginTop: 12 }} />
        </View>
      </View>

      {/* Assets List */}
      <View style={skeletonScreenStyles.section}>
        <Skeleton width={100} height={20} borderRadius={4} />
        {[1, 2, 3, 4].map((i) => (
          <AssetCardSkeleton key={i} />
        ))}
      </View>

      {/* Table Skeleton */}
      <View style={skeletonScreenStyles.section}>
        <Skeleton width={120} height={20} borderRadius={4} />
        <View style={skeletonScreenStyles.tableContainer}>
          <View style={skeletonScreenStyles.tableHeader}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="18%" height={16} borderRadius={4} />
            ))}
          </View>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRowSkeleton key={i} columns={5} />
          ))}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

// User Assets Skeleton
export const UserAssetsSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Assets" showHamburger={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.greetingSection}>
        <Skeleton width={200} height={24} borderRadius={4} />
      </View>
      <View style={skeletonScreenStyles.assetsContainer}>
        <Skeleton width={180} height={16} borderRadius={4} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={skeletonScreenStyles.assetRow}>
            <ListItemSkeleton />
            <View style={skeletonScreenStyles.actionButtons}>
              <Skeleton width="48%" height={44} borderRadius={8} />
              <Skeleton width="48%" height={44} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Profile" showBack={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.profileSection}>
        <ProfileAvatarSkeleton />
        <Skeleton width={150} height={24} borderRadius={4} style={{ marginTop: 16 }} />
        <Skeleton width={100} height={16} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={skeletonScreenStyles.buttonContainer}>
        <Skeleton width={200} height={50} borderRadius={8} />
      </View>
      <View style={skeletonScreenStyles.formSection}>
        {[1, 2, 3, 4].map((i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Settings Skeleton
export const SettingsSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Settings" showHamburger={true} />
    <View style={skeletonScreenStyles.tabsContainer}>
      <Skeleton width="48%" height={44} borderRadius={0} />
      <Skeleton width="48%" height={44} borderRadius={0} />
    </View>
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.profileSection}>
        <ProfileAvatarSkeleton />
        <Skeleton width={150} height={24} borderRadius={4} style={{ marginTop: 16 }} />
        <Skeleton width={100} height={16} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={skeletonScreenStyles.formSection}>
        {[1, 2, 3, 4].map((i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Notifications Skeleton
export const NotificationsSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Notifications" showHamburger={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.welcomeSection}>
        <Skeleton width={80} height={28} borderRadius={12} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={16} borderRadius={4} />
      </View>
      <View style={skeletonScreenStyles.contentSection}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <NotificationCardSkeleton key={i} />
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Admin Dashboard Skeleton
export const AdminDashboardSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Admin Dashboard" showHamburger={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.welcomeSection}>
        <Skeleton width={200} height={28} borderRadius={4} />
        <Skeleton width="100%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={16} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={skeletonScreenStyles.section}>
        <View style={skeletonScreenStyles.sectionHeader}>
          <View>
            <Skeleton width={100} height={20} borderRadius={4} />
            <Skeleton width={200} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
          <Skeleton width={120} height={40} borderRadius={8} />
        </View>
        <View style={skeletonScreenStyles.tableContainer}>
          <View style={skeletonScreenStyles.tableHeader}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="18%" height={16} borderRadius={4} />
            ))}
          </View>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRowSkeleton key={i} columns={5} />
          ))}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Auth Skeleton (Login/Signup)
export const AuthSkeleton: React.FC = () => (
  <View style={skeletonScreenStyles.authContainer}>
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.authScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.authContent}>
        <Skeleton width={260} height={160} borderRadius={8} style={{ marginBottom: 24 }} />
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 32 }} />
        <Skeleton width="100%" height={44} borderRadius={8} style={{ marginBottom: 24 }} />
        {[1, 2, 3, 4].map((i) => (
          <FormFieldSkeleton key={i} style={{ marginBottom: 16 }} />
        ))}
        <Skeleton width="100%" height={50} borderRadius={8} style={{ marginTop: 24 }} />
      </View>
    </ScrollView>
  </View>
);

// Company Setup Skeleton
export const CompanySetupSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Company Setup" showBack={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.welcomeSection}>
        <Skeleton width={200} height={28} borderRadius={4} />
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
      <View style={skeletonScreenStyles.formSection}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <FormFieldSkeleton key={i} />
        ))}
        <View style={skeletonScreenStyles.unitsContainer}>
          <Skeleton width={80} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <View style={skeletonScreenStyles.unitsButtons}>
            <Skeleton width="48%" height={44} borderRadius={8} />
            <Skeleton width="48%" height={44} borderRadius={8} />
          </View>
        </View>
        <Skeleton width="100%" height={50} borderRadius={8} style={{ marginTop: 24 }} />
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Notification Detail Skeleton
export const NotificationDetailSkeleton: React.FC = () => (
  <SafeAreaView style={skeletonScreenStyles.container} edges={['top', 'bottom']}>
    <TopBar title="Notification Details" showBack={true} />
    <ScrollView
      contentContainerStyle={skeletonScreenStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={skeletonScreenStyles.notificationDetailCard}>
        <View style={skeletonScreenStyles.notificationDetailHeader}>
          <Skeleton width={64} height={64} borderRadius={32} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Skeleton width="60%" height={20} borderRadius={4} />
            <Skeleton width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>
        <View style={skeletonScreenStyles.notificationDetailMessage}>
          <Skeleton width={80} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={16} borderRadius={4} />
          <Skeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width="70%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
        <View style={skeletonScreenStyles.notificationDetailDate}>
          <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
          <Skeleton width="40%" height={16} borderRadius={4} />
        </View>
        <Skeleton width="100%" height={50} borderRadius={12} style={{ marginTop: 24 }} />
      </View>
    </ScrollView>
  </SafeAreaView>
);

const skeletonScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  fleetHealthSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  assetsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  assetRow: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  tableContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contentSection: {
    paddingHorizontal: 20,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  authScrollContent: {
    flexGrow: 1,
  },
  authContent: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  unitsContainer: {
    marginBottom: 20,
  },
  unitsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationDetailCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  notificationDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationDetailMessage: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  notificationDetailDate: {
    marginBottom: 24,
  },
});
