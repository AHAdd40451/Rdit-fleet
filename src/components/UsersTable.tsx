import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { LoadingBar } from './LoadingBar';
import { useToast } from './Toast';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  email?: string;
  role: string;
}

interface UsersTableProps {
  onEditUser?: (user: User) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  onEditUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, first_name, last_name, phone_no, email, role')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingUserId(user.id);
              const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

              if (deleteError) {
                throw deleteError;
              }

              showToast('User deleted successfully!', 'success', 2000);
              await fetchUsers();
            } catch (err: any) {
              console.error('Error deleting user:', err);
              showToast(
                err.message || 'Failed to delete user. Please try again.',
                'error'
              );
            } finally {
              setDeletingUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (user: User) => {
    if (onEditUser) {
      onEditUser(user);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingBar variant="spinner" />
        <Text style={styles.loadingText}>Loading user</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchUsers} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No users found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <View style={styles.tableWrapper}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.nameHeader]}>Name</Text>
            <Text style={[styles.headerCell, styles.phoneHeader]}>Phone</Text>
            <Text style={[styles.headerCell, styles.roleHeader]}>Role</Text>
            <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {users.map((user) => (
              <View key={user.id} style={styles.row}>
                <View style={[styles.cell, styles.nameCell]}>
                  <Text style={styles.cellText}>
                    {user.first_name} {user.last_name}
                  </Text>
                </View>
                <View style={[styles.cell, styles.phoneCell]}>
                  <Text style={styles.cellText}>{user.phone_no || 'N/A'}</Text>
                </View>
                <View style={[styles.cell, styles.roleCell]}>
                  <View
                    style={[
                      styles.roleBadge,
                      user.role === 'admin' ? styles.adminBadge : styles.userBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        user.role === 'admin'
                          ? styles.adminText
                          : styles.userText,
                      ]}
                    >
                      {user.role?.toUpperCase() || 'USER'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.cell, styles.actionsCell]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleEdit(user)}
                      style={[styles.actionButton, styles.editButton]}
                      disabled={deletingUserId === user.id}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(user)}
                      style={[styles.actionButton, styles.deleteButton]}
                      disabled={deletingUserId === user.id}
                    >
                      <Text style={styles.deleteButtonText}>
                        {deletingUserId === user.id ? '...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  tableWrapper: {
    minWidth: 600,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  nameHeader: {
    width: 150,
  },
  phoneHeader: {
    width: 150,
  },
  roleHeader: {
    width: 100,
    textAlign: 'center',
  },
  actionsHeader: {
    width: 200,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
  },
  nameCell: {
    width: 150,
  },
  phoneCell: {
    width: 150,
  },
  roleCell: {
    width: 100,
    alignItems: 'center',
  },
  actionsCell: {
    width: 200,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 55,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#14AB98',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: '#FFE5E5',
  },
  userBadge: {
    backgroundColor: '#E5F5FF',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminText: {
    color: '#D32F2F',
  },
  userText: {
    color: '#1976D2',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#14AB98',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#14AB98',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});

