import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { useAuth } from '../src/contexts/AuthContext';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { Sidebar } from '../src/components/Sidebar';
import { TopBar } from '../src/components/TopBar';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

export default function UserDashboardScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TopBar
          title="User Dashboard"
          showHamburger={true}
          onHamburgerPress={() => setSidebarVisible(true)}
        />

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>User Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome, {userProfile?.first_name || 'User'}! View your assigned tasks and fleet information.
          </Text>
        </View>

        {/* User-specific content can be added here */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Your Tasks</Text>
          <Text style={styles.sectionText}>
            This is the user dashboard. You can view your assigned vehicles, tasks, and maintenance schedules.
          </Text>
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
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

