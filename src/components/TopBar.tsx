import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#14AB98';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  showHamburger?: boolean;
  onHamburgerPress?: () => void;
  onBackPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack = false,
  showHamburger = false,
  onHamburgerPress,
  onBackPress,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleHamburger = () => {
    if (onHamburgerPress) {
      onHamburgerPress();
    }
  };

  return (
    <View style={styles.container}>
      {/* Left side - Back button or Hamburger */}
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {showHamburger && (
          <TouchableOpacity
            onPress={handleHamburger}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center - Page heading */}
      <View style={styles.centerContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right side - Placeholder for balance */}
      <View style={styles.rightContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  rightContainer: {
    minWidth: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});




