import { Dimensions, StyleSheet } from "react-native";

export const TEAL_GREEN = '#14AB98';
export const BRIGHT_GREEN = '#B0E56D';
export const SCREEN_WIDTH = Dimensions.get('window').width;

export const assetStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    loadingFullContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    fleetHealthSection: {
      padding: 16,
      backgroundColor: '#F9F9F9',
    },
    fleetHealthGauge: {
      alignItems: 'center',
      marginBottom: 20,
    },
    gaugeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    gaugeOuter: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    gaugeInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 8,
      zIndex: 2,
    },
    gaugeValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#333',
    },
    gaugeLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    gaugeProgress: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: '100%',
      opacity: 0.2,
      zIndex: 1,
    },
    riskAlertButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 20,
      backgroundColor: '#FFA500',
      borderRadius: 20,
    },
    riskAlertText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: (SCREEN_WIDTH - 48) / 2 - 6,
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    metricValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
    },
    section: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: TEAL_GREEN,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      gap: 6,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    riskItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    riskContent: {
      flex: 1,
    },
    riskText: {
      fontSize: 14,
      color: '#333',
    },
    scheduleButton: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      backgroundColor: TEAL_GREEN,
      borderRadius: 6,
    },
    scheduleButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    tabsContainer: {
      flexDirection: 'row',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: TEAL_GREEN,
    },
    tabText: {
      fontSize: 12,
      color: '#666',
      fontWeight: '500',
    },
    activeTabText: {
      color: TEAL_GREEN,
      fontWeight: '600',
    },
    assetsTableScroll: {
      marginBottom: 12,
    },
    tableContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      overflow: 'hidden',
      marginBottom: 12,
      minWidth: 800,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#F9F9F9',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    tableHeaderText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    tableCell: {
      flex: 1,
      fontSize: 11,
      color: '#666',
      textAlign: 'center',
    },
    statusCell: {
      textTransform: 'capitalize',
      fontWeight: '500',
    },
    // Asset table specific column widths
    assetNameHeader: {
      width: 120,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetNameCell: {
      width: 120,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetVinHeader: {
      width: 150,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetVinCell: {
      width: 150,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetMakeHeader: {
      width: 100,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetMakeCell: {
      width: 100,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetModelHeader: {
      width: 120,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetModelCell: {
      width: 120,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetYearHeader: {
      width: 70,
      textAlign: 'center',
    },
    assetYearCell: {
      width: 70,
      textAlign: 'center',
    },
    assetColorHeader: {
      width: 100,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetColorCell: {
      width: 100,
      textAlign: 'left',
      paddingLeft: 8,
    },
    assetMileageHeader: {
      width: 100,
      textAlign: 'center',
    },
    assetMileageCell: {
      width: 100,
      textAlign: 'center',
    },
    assetActionsHeader: {
      width: 80,
      textAlign: 'center',
    },
    assetActionsCell: {
      width: 80,
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    editAssetButton: {
      padding: 6,
      borderRadius: 4,
      backgroundColor: '#F0F0F0',
    },
    emptyTable: {
      padding: 40,
      alignItems: 'center',
    },
    emptyTableText: {
      fontSize: 14,
      color: '#999',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: '#F0F0F0',
      borderRadius: 6,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 12,
      color: '#333',
      fontWeight: '500',
    },
    bottomPanels: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
    },
    panel: {
      flex: 1,
      backgroundColor: '#F9F9F9',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      minHeight: 120,
      justifyContent: 'center',
    },
    panelText: {
      marginTop: 8,
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
    },
    panelTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 12,
      alignSelf: 'flex-start',
    },
    activityItem: {
      width: '100%',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    activityText: {
      fontSize: 12,
      color: '#333',
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 10,
      color: '#999',
    },
  });