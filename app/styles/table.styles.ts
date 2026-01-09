import { StyleSheet } from 'react-native';

export const tableStyles = StyleSheet.create({
    container: {
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
      flex: 1,
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
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    headerText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000',
    },
    scrollView: {
      flex: 1,
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
      paddingHorizontal: 8,
    },
    cellText: {
      fontSize: 14,
      color: '#333',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#14AB98',
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
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
      padding: 40,
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    emptyText: {
      fontSize: 14,
      color: '#666',
    },
  });