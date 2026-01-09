import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingBar } from '../src/components/LoadingBar';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/components/Toast';
import { supabase } from '../lib/supabase';
import { BottomNavBar } from '../src/components/BottomNavBar';
import { AssetModal } from '../src/components/AssetModal';
import { AssetBottomSheet } from '../src/components/AssetBottomSheet';
import { Sidebar } from '../src/components/Sidebar';
import { TopBar } from '../src/components/TopBar';
import { generateUUIDFromString } from '../src/utils/generateUUID';
import { callRapidFunction } from '../src/utils/callRapidFunction';
import { assetStyles } from './styles/asset.styles';
import { fetchAssets } from '../src/lib/getAllFunction';
import { Table, TableColumn } from '../src/components/Table';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';
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
  photo?: string | null;
  photos?: string[] | null;
  state?: string | null;
}

interface RiskForecast {
  id: string;
  asset: string;
  issue: string;
  days: number;
}

interface ActionItem {
  id: string;
  asset: string;
  task: string;
  dueDate: string;
  assignedTo: string;
  status: 'pending' | 'overdue' | 'due_soon' | 'completed';
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  asset: string;
  timestamp: string;
}

export default function AssetsScreen() {
  const router = useRouter();
  const { userProfile, user, session } = useAuth();
  const { showToast } = useToast();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overdue' | 'due_soon' | 'completed' | 'all_assets'>('all_assets');

  // Fetch assets
  useEffect(() => {
    if (!checkingCompany) {
      fetchAssets(session, userProfile, setLoading, setAssets, showToast);
    }
  }, [session, userProfile, checkingCompany]);


  // Check if company exists for admin user
  useEffect(() => {
    const checkCompany = async () => {
      if (!session?.user?.id || userProfile?.role !== 'admin') {
        setCheckingCompany(false);
        return;
      }

      try {
        const { data: companyData, error } = await supabase
          .from('company')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (error || !companyData) {
          router.replace('/company');
          return;
        }

        setCheckingCompany(false);
      } catch (error) {
        console.error('Error checking company:', error);
        setCheckingCompany(false);
      }
    };

    checkCompany();
  }, [session, userProfile, router]);

  // Redirect non-admin users
  useEffect(() => {
    if (userProfile?.role === 'user' && !checkingCompany) {
      router.replace('/userAssets');
    }
  }, [userProfile, checkingCompany, router]);

  // Calculate metrics
  const totalAssets = assets.length;
  const atRiskAssets = assets.filter(a => {
    // Consider assets at risk if mileage > 100000 or year < 2010
    return (a.mileage && a.mileage > 100000) || (a.year && a.year < 2010);
  }).length;
  const maintenanceDue = assets.filter(a => {
    // Consider maintenance due if mileage > 50000 or odometer > 50000
    return (a.mileage && a.mileage > 50000) || (a.odometer && a.odometer > 50000);
  }).length;
  const complianceIssues = assets.filter(a => !a.vin || !a.state).length;

  // Calculate fleet health (0-100)
  const fleetHealth = totalAssets > 0 
    ? Math.round(100 - ((atRiskAssets + maintenanceDue + complianceIssues) / totalAssets) * 30)
    : 100;
  const fleetHealthPercentage = Math.max(0, Math.min(100, fleetHealth));

  // Mock risk forecast data (in real app, this would come from database)
  const riskForecasts: RiskForecast[] = [
    { id: '1', asset: 'Truck #14', issue: 'Brake Wear', days: 18 },
    { id: '2', asset: 'Tractor #7', issue: 'Battery Warning', days: 0 },
    { id: '3', asset: 'Trailer #22', issue: 'Tire Replacement Soon', days: 0 },
  ];

  // Mock action items (in real app, this would come from database)
  const actionItems: ActionItem[] = [
    { id: '1', asset: 'Truck #12', task: 'Oil Change', dueDate: '2024-05-30', assignedTo: 'John', status: 'pending' },
    { id: '2', asset: 'Trailer #8', task: 'DOT Inspection', dueDate: '2024-05-20', assignedTo: 'Sarah', status: 'overdue' },
    { id: '3', asset: 'Truck #19', task: 'Check-In', dueDate: '2024-05-25', assignedTo: 'Mike', status: 'due_soon' },
  ];

  // Mock recent activity (in real app, this would come from asset_logs)
  const recentActivities: RecentActivity[] = [
    { id: '1', user: 'John', action: 'Uploaded Oil Change', asset: 'Truck #12', timestamp: '2 hours ago' },
    { id: '2', user: 'System', action: 'DOT Inspection Done', asset: 'Trailer #8', timestamp: '5 hours ago' },
    { id: '3', user: 'System', action: 'Missed Check-In', asset: 'Truck #19', timestamp: '1 day ago' },
  ];

  const filteredActionItems = actionItems.filter(item => {
    if (activeTab === 'overdue') return item.status === 'overdue';
    if (activeTab === 'due_soon') return item.status === 'due_soon';
    if (activeTab === 'completed') return item.status === 'completed';
    return false;
  });


  const handleAddAsset = () => {
    setEditingAsset(null);
    setShowAssetModal(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAssetModal(true);
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowBottomSheet(true);
  };

  const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'user_id' | 'photo'>) => {
    try {
      let currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        currentUserId = currentSession?.user?.id;
      }
      
      if (!currentUserId && userProfile) {
        if (!userProfile.email) {
          const identifier = userProfile.phone_no || `user_${userProfile.id}`;
          currentUserId = generateUUIDFromString(identifier);
        } else {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.email === userProfile.email) {
              currentUserId = authUser.id;
            }
          } catch (getUserError) {
            console.log('User not signed in');
          }
        }
      }
      
      if (!currentUserId) {
        throw new Error('Unable to identify current user. Please log in again.');
      }

      if (editingAsset) {
        // Update existing asset
        const { data: currentAsset, error: fetchError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', editingAsset.id)
          .single();

        if (fetchError) {
          throw new Error('Failed to fetch current asset data.');
        }

        const { error: updateError } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingAsset.id);

        if (updateError) {
          throw new Error(updateError.message || 'Failed to update asset.');
        }

        // Create log entry
        try {
          const oldValues: any = {};
          const newValues: any = {};
          const changes: any = {};

          Object.keys(assetData).forEach((key) => {
            const typedKey = key as keyof typeof assetData;
            const oldValue = currentAsset?.[typedKey];
            const newValue = assetData[typedKey];

            if (oldValue !== newValue) {
              oldValues[key] = oldValue;
              newValues[key] = newValue;
              changes[key] = { from: oldValue, to: newValue };
            }
          });

          if (Object.keys(changes).length > 0) {
            const logEntry = {
              asset_id: editingAsset.id,
              user_id: currentUserId,
              action: 'updated',
              user_role: 'admin',
              changes: changes,
              old_values: oldValues,
              new_values: newValues,
              description: `Admin updated asset "${assetData.asset_name || editingAsset.asset_name}"`,
            };

            await supabase.from('asset_logs').insert([logEntry]);
          }
        } catch (logErr) {
          console.error('Error in log creation:', logErr);
        }

        // Call rapid-function if mileage > 5000
        if (assetData.mileage && assetData.mileage > 5000) {
          try {
            await callRapidFunction({
              asset_id: editingAsset.id,
              asset_name: assetData.asset_name || editingAsset.asset_name,
              mileage: assetData.mileage,
              user_id: currentUserId,
              user_email: userProfile?.email,
            });
          } catch (rapidFunctionError) {
            console.error('Error calling rapid-function:', rapidFunctionError);
          }
        }

        showToast('Asset updated successfully!', 'success', 2000);
      } else {
        // Create new asset
        const newAssetData = {
          ...assetData,
          user_id: currentUserId,
        };

        const { data: insertedAsset, error: insertError } = await supabase
          .from('assets')
          .insert([newAssetData])
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message || 'Failed to create asset.');
        }

        // Create log entry
        try {
          const logEntry = {
            asset_id: insertedAsset.id,
            user_id: currentUserId,
            action: 'created',
            user_role: 'admin',
            changes: null,
            old_values: null,
            new_values: newAssetData,
            description: `Admin created new asset "${assetData.asset_name}"`,
          };

          await supabase.from('asset_logs').insert([logEntry]);
        } catch (logErr) {
          console.error('Error in log creation:', logErr);
        }

        // Create notifications for linked users
        if (insertedAsset && userProfile?.role === 'admin') {
          try {
            const { data: linkedUsers, error: usersError } = await supabase
              .from('users')
              .select('id')
              .eq('userId', currentUserId)
              .eq('role', 'user');

            if (!usersError && linkedUsers && linkedUsers.length > 0) {
              const notifications = linkedUsers.map(user => ({
                user_id: user.id,
                message: `New asset "${assetData.asset_name}" has been created by your admin.`,
                type: 'asset_created',
                asset_id: insertedAsset.id,
                read: false,
                created_at: new Date().toISOString(),
              }));

              await supabase.from('notifications').insert(notifications);
            }
          } catch (notificationErr) {
            console.error('Error in notification creation:', notificationErr);
          }
        }

        // Call rapid-function if mileage > 5000
        if (assetData.mileage && assetData.mileage > 5000) {
          try {
            await callRapidFunction({
              asset_id: insertedAsset.id,
              asset_name: assetData.asset_name,
              mileage: assetData.mileage,
              user_id: currentUserId,
              user_email: userProfile?.email || user?.email,
            });
          } catch (rapidFunctionError) {
            console.error('Error calling rapid-function:', rapidFunctionError);
          }
        }

        showToast('Asset created successfully!', 'success', 2000);
      }

      // Refresh assets list
      let filterUserId = session?.user?.id;
      if (!filterUserId && userProfile) {
        const identifier = userProfile.phone_no || `user_${userProfile.id}`;
        filterUserId = generateUUIDFromString(identifier);
      }
      
      if (filterUserId) {
        const { data, error: fetchError } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', filterUserId)
          .order('created_at', { ascending: false });

        if (!fetchError && data) {
          setAssets(data);
        }
      }

      setShowAssetModal(false);
      setEditingAsset(null);
    } catch (error: any) {
      console.error('Save asset error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
    }
  };

  const handleCloseModal = () => {
    setShowAssetModal(false);
    setEditingAsset(null);
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedAsset(null);
  };

  // Fleet Health Gauge Component
  const FleetHealthGauge = ({ percentage }: { percentage: number }) => {
    const getColor = () => {
      if (percentage >= 80) return TEAL_GREEN;
      if (percentage >= 60) return BRIGHT_GREEN;
      if (percentage >= 40) return '#FFA500';
      return '#F44336';
    };

    return (
      <View style={assetStyles.gaugeContainer}>
        <View style={assetStyles.gaugeOuter}>
          <View style={[assetStyles.gaugeInner, { borderColor: getColor() }]}>
            <Text style={assetStyles.gaugeValue}>{percentage}</Text>
            <Text style={assetStyles.gaugeLabel}>Fleet Health</Text>
          </View>
          {/* Progress indicator using a simple visual representation */}
          <View style={[assetStyles.gaugeProgress, { 
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }]} />
        </View>
      </View>
    );
  };

  if (checkingCompany) {
    return (
      <SafeAreaView style={assetStyles.container}>
        <View style={assetStyles.loadingFullContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <SafeAreaView style={assetStyles.container}>
        <View style={assetStyles.loadingFullContainer}>
          <LoadingBar variant="bar" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={assetStyles.container} edges={['top', 'bottom']}>
      <TopBar
        title="Assets"
        showHamburger={true}
        onHamburgerPress={() => setSidebarVisible(true)}
      />

      <ScrollView
        contentContainerStyle={assetStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fleet Health Section */}
        <View style={assetStyles.fleetHealthSection}>
          <View style={assetStyles.fleetHealthGauge}>
            <FleetHealthGauge percentage={fleetHealthPercentage} />
            <TouchableOpacity style={assetStyles.riskAlertButton}>
              <Text style={assetStyles.riskAlertText}>Risk Alert</Text>
            </TouchableOpacity>
          </View>

          <View style={assetStyles.metricsGrid}>
            <View style={assetStyles.metricCard}>
              <Text style={assetStyles.metricValue}>{totalAssets}</Text>
              <Text style={assetStyles.metricLabel}>Total Assets</Text>
            </View>
            <View style={assetStyles.metricCard}>
              <Text style={assetStyles.metricValue}>{atRiskAssets}</Text>
              <Text style={assetStyles.metricLabel}>At-Risk Assets</Text>
            </View>
            <View style={assetStyles.metricCard}>
              <Text style={assetStyles.metricValue}>{maintenanceDue}</Text>
              <Text style={assetStyles.metricLabel}>Maintenance Due</Text>
            </View>
            <View style={assetStyles.metricCard}>
              <Text style={assetStyles.metricValue}>{complianceIssues}</Text>
              <Text style={assetStyles.metricLabel}>Compliance Issues</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Risk Forecast */}
        <View style={assetStyles.section}>
          <Text style={assetStyles.sectionTitle}>Upcoming Risk Forecast</Text>
          {riskForecasts.map((risk) => (
            <View key={risk.id} style={assetStyles.riskItem}>
              <View style={assetStyles.riskContent}>
                <Text style={assetStyles.riskText}>
                  {risk.asset} {risk.issue}{risk.days > 0 ? ` in ~${risk.days} days` : ''}
                </Text>
              </View>
              <TouchableOpacity style={assetStyles.scheduleButton}>
                <Text style={assetStyles.scheduleButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Action Required Table */}
        <View style={assetStyles.section}>
          <View style={assetStyles.sectionHeaderRow}>
            <Text style={assetStyles.sectionTitle}>Action Required</Text>
            <TouchableOpacity onPress={handleAddAsset} style={assetStyles.addButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={assetStyles.addButtonText}>Add Asset</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={assetStyles.tabsContainer}>
            <TouchableOpacity
              style={[assetStyles.tab, activeTab === 'overdue' && assetStyles.activeTab]}
              onPress={() => setActiveTab('overdue')}
            >
              <Text style={[assetStyles.tabText, activeTab === 'overdue' && assetStyles.activeTabText]}>
                Overdue
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[assetStyles.tab, activeTab === 'due_soon' && assetStyles.activeTab]}
              onPress={() => setActiveTab('due_soon')}
            >
              <Text style={[assetStyles.tabText, activeTab === 'due_soon' && assetStyles.activeTabText]}>
                Due Soon
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[assetStyles.tab, activeTab === 'completed' && assetStyles.activeTab]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[assetStyles.tabText, activeTab === 'completed' && assetStyles.activeTabText]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[assetStyles.tab, activeTab === 'all_assets' && assetStyles.activeTab]}
              onPress={() => setActiveTab('all_assets')}
            >
              <Text style={[assetStyles.tabText, activeTab === 'all_assets' && assetStyles.activeTabText]}>
                All Assets
              </Text>
            </TouchableOpacity>
          </View>

          {/* Table */}
          {activeTab === 'all_assets' ? (
            // All Assets Table
            <Table
              columns={[
                {
                  header: 'Asset Name',
                  dataKey: 'asset_name',
                  width: 120,
                  textAlign: 'left',
                },
                {
                  header: 'VIN',
                  dataKey: 'vin',
                  width: 150,
                  textAlign: 'left',
                },
                {
                  header: 'Make',
                  dataKey: 'make',
                  width: 100,
                  textAlign: 'left',
                },
                {
                  header: 'Model',
                  dataKey: 'model',
                  width: 120,
                  textAlign: 'left',
                },
                {
                  header: 'Year',
                  dataKey: 'year',
                  width: 70,
                  textAlign: 'center',
                },
                {
                  header: 'Color',
                  dataKey: 'color',
                  width: 100,
                  textAlign: 'left',
                },
                {
                  header: 'Mileage',
                  dataKey: 'mileage',
                  width: 100,
                  textAlign: 'center',
                  render: (value) => (
                    <Text style={{ textAlign: 'center' }}>
                      {value ? value.toLocaleString() : 'N/A'}
                    </Text>
                  ),
                },
                {
                  header: 'Actions',
                  dataKey: 'id',
                  width: 80,
                  textAlign: 'center',
                  render: (_, row) => (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditAsset(row);
                      }}
                      style={assetStyles.editAssetButton}
                    >
                      <Ionicons name="create-outline" size={16} color={TEAL_GREEN} />
                    </TouchableOpacity>
                  ),
                },
              ]}
              data={assets}
              onRowPress={handleAssetClick}
              emptyMessage="No assets found"
              minWidth={800}
              maxHeight={400}
            />
          ) : (
            // Action Items Table
            <Table
              columns={[
                {
                  header: 'Asset',
                  dataKey: 'asset',
                  textAlign: 'center',
                },
                {
                  header: 'Task',
                  dataKey: 'task',
                  textAlign: 'center',
                },
                {
                  header: 'Due Date',
                  dataKey: 'dueDate',
                  textAlign: 'center',
                },
                {
                  header: 'Assigned To',
                  dataKey: 'assignedTo',
                  textAlign: 'center',
                },
                {
                  header: 'Status',
                  dataKey: 'status',
                  textAlign: 'center',
                  cellStyle: assetStyles.statusCell,
                },
              ]}
              data={filteredActionItems}
              emptyMessage="No items in this category"
              minWidth={600}
              maxHeight={400}
            />
          )}

          {/* Action Buttons - Only show for action item tabs */}
          {activeTab !== 'all_assets' && (
            <View style={assetStyles.actionButtonsRow}>
              <TouchableOpacity style={assetStyles.actionButton}>
                <Text style={assetStyles.actionButtonText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={assetStyles.actionButton}>
                <Text style={assetStyles.actionButtonText}>Snooze</Text>
              </TouchableOpacity>
              <TouchableOpacity style={assetStyles.actionButton}>
                <Text style={assetStyles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Panels */}
        <View style={assetStyles.bottomPanels}>
          <View style={assetStyles.panel}>
            <Ionicons name="map-outline" size={32} color="#999" />
            <Text style={assetStyles.panelText}>Location (Coming Soon)</Text>
          </View>

          <View style={assetStyles.panel}>
            <Text style={assetStyles.panelTitle}>Recent Activity</Text>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={assetStyles.activityItem}>
                <Text style={assetStyles.activityText}>
                  {activity.user}: {activity.action} - {activity.asset}
                </Text>
                <Text style={assetStyles.activityTime}>{activity.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavBar />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <AssetModal
        visible={showAssetModal}
        onClose={handleCloseModal}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
        loading={false}
      />
      <AssetBottomSheet
        visible={showBottomSheet}
        asset={selectedAsset}
        onClose={handleCloseBottomSheet}
        onEdit={handleEditAsset}
      />
    </SafeAreaView>
  );
}
