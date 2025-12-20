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

  const vehicleName = asset.asset_name || 'N/A';
  const vehicleInfo = `${asset.year || ''} ${asset.make || ''} ${asset.model || ''}`.trim() || 'N/A';

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
                <View style={styles.headerTextContainer}>
                  <Text style={styles.vehicleName}>{vehicleName}</Text>
                  <Text style={styles.vehicleInfo}>{vehicleInfo}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Top Row - Mileage and Odometer */}
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="speedometer-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.mileage ? `${asset.mileage.toLocaleString()} mi` : 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Mileage</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="analytics-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.odometer ? `${asset.odometer.toLocaleString()} mi` : 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Odometer</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Second Row - VIN and Color */}
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="barcode-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue} numberOfLines={1}>
                        {asset.vin || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>VIN Number</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="color-palette-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.color || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Color</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Third Row - Make and Model */}
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="car-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.make || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Make</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Ionicons name="car-sport-outline" size={24} color="#666" style={styles.cardIcon} />
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardValue}>
                        {asset.model || 'N/A'}
                      </Text>
                      <Text style={styles.cardLabel}>Model</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Maintenance Card */}
              <View style={styles.fullWidthCard}>
                <View style={styles.cardContent}>
                  <Ionicons name="construct-outline" size={24} color="#666" style={styles.cardIcon} />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardValue}>Maintenance</Text>
                    <Text style={[styles.cardLabel, styles.statusText]}>No Issues Reported</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </View>
              </View>

              {/* Inspection Card */}
              <View style={styles.fullWidthCard}>
                <View style={styles.cardContent}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.cardIcon} />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardValue}>Inspection</Text>
                    <Text style={[styles.cardLabel, styles.statusText]}>Completed</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </View>
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
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fullWidthCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  statusText: {
    color: '#4CAF50',
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
