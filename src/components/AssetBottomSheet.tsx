import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

interface Asset {
  id?: string;
  asset_name: string;
  color: string;
  vin: string;
  make: string;
  model: string;
  year: number | null;
  odometer: number | null;
  mileage: number | null;
  user_id: string;
  created_at?: string;
  photo?: string | null;
}

interface AssetBottomSheetProps {
  visible: boolean;
  asset: Asset | null;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
}

export const AssetBottomSheet: React.FC<AssetBottomSheetProps> = ({
  visible,
  asset,
  onClose,
  onEdit,
}) => {
  const slideAnim = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: BOTTOM_SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!asset) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Asset Details</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.detailsContainer}>
                {/* Asset Name */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Asset Name</Text>
                  <Text style={styles.value}>{asset.asset_name || 'N/A'}</Text>
                </View>

                {/* VIN */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>VIN</Text>
                  <Text style={styles.value}>{asset.vin || 'N/A'}</Text>
                </View>

                {/* Make */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Make</Text>
                  <Text style={styles.value}>{asset.make || 'N/A'}</Text>
                </View>

                {/* Model */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Model</Text>
                  <Text style={styles.value}>{asset.model || 'N/A'}</Text>
                </View>

                {/* Year */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Year</Text>
                  <Text style={styles.value}>
                    {asset.year ? asset.year.toString() : 'N/A'}
                  </Text>
                </View>

                {/* Color */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Color</Text>
                  <Text style={styles.value}>{asset.color || 'N/A'}</Text>
                </View>

                {/* Odometer */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Odometer</Text>
                  <Text style={styles.value}>
                    {asset.odometer
                      ? asset.odometer.toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>

                {/* Mileage */}
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Mileage</Text>
                  <Text style={styles.value}>
                    {asset.mileage ? asset.mileage.toLocaleString() : 'N/A'}
                  </Text>
                </View>

                {/* Created At */}
                {asset.created_at && (
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Created At</Text>
                    <Text style={styles.value}>
                      {new Date(asset.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Actions */}
            {onEdit && (
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => {
                    onEdit(asset);
                    onClose();
                  }}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Edit Asset</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  detailsContainer: {
    gap: 24,
  },
  detailRow: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14AB98',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
