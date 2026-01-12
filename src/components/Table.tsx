import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingBar } from './LoadingBar';
import { tableStyles } from '../../app/styles/table.styles';

export interface TableColumn<T = any> {
  /** Header label for the column */
  header: string;
  /** Key to access data from row object, or function to get the value */
  dataKey: keyof T | ((row: T) => any);
  /** Width of the column (default: flex: 1) */
  width?: number;
  /** Text alignment for header and cells */
  textAlign?: 'left' | 'center' | 'right';
  /** Custom render function for cell content */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Custom style for header cell */
  headerStyle?: ViewStyle | TextStyle;
  /** Custom style for data cells */
  cellStyle?: ViewStyle | TextStyle;
}

export interface TableProps<T = any> {
  /** Array of column definitions */
  columns: TableColumn<T>[];
  /** Array of data objects */
  data: T[];
  /** Unique key extractor for rows (default: 'id') */
  keyExtractor?: (row: T, index: number) => string | number;
  /** Callback when a row is clicked */
  onRowPress?: (row: T, index: number) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback to retry when error occurs */
  onRetry?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Minimum width for the table (for horizontal scrolling) */
  minWidth?: number;
  /** Maximum height for vertical scrolling */
  maxHeight?: number;
  /** Show horizontal scroll indicator */
  showsHorizontalScrollIndicator?: boolean;
  /** Show vertical scroll indicator */
  showsVerticalScrollIndicator?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom header row style */
  headerRowStyle?: ViewStyle;
  /** Custom row style */
  rowStyle?: ViewStyle;
  /** Custom empty container style */
  emptyContainerStyle?: ViewStyle;
  /** Custom loading container style */
  loadingContainerStyle?: ViewStyle;
  /** Custom error container style */
  errorContainerStyle?: ViewStyle;
}

export function Table<T = any>({
  columns,
  data,
  keyExtractor = (row: any, index: number) => row?.id ?? index,
  onRowPress,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No data available',
  minWidth = 600,
  maxHeight = 400,
  showsHorizontalScrollIndicator = true,
  showsVerticalScrollIndicator = true,
  containerStyle,
  headerRowStyle,
  rowStyle,
  emptyContainerStyle,
  loadingContainerStyle,
  errorContainerStyle,
}: TableProps<T>) {
  // Get cell value from row
  const getCellValue = (column: TableColumn<T>, row: T): any => {
    if (typeof column.dataKey === 'function') {
      return column.dataKey(row);
    }
    return row[column.dataKey as keyof T];
  };

  // Skeleton row component
  const SkeletonRow = ({ columns: skeletonColumns }: { columns: TableColumn<T>[] }) => {
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
      <View style={[tableStyles.row]}>
        {skeletonColumns.map((column, colIndex) => (
          <View
            key={`skeleton-cell-${colIndex}`}
            style={[
              tableStyles.cell,
              column.width ? { width: column.width } : { flex: 1 },
              { alignItems: column.textAlign === 'center' ? 'center' : 'flex-start' },
            ]}
          >
            <View style={tableStyles.skeletonCell}>
              <Animated.View
                style={[
                  tableStyles.skeletonShimmer,
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
          </View>
        ))}
      </View>
    );
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <View style={[tableStyles.container, containerStyle]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
          contentContainerStyle={tableStyles.horizontalScrollContent}
        >
          <View style={[tableStyles.tableWrapper, { minWidth }]}>
            {/* Header Row */}
            <View style={[tableStyles.headerRow, headerRowStyle]}>
              {columns.map((column, index) => (
                <View
                  key={`header-${index}`}
                  style={[
                    tableStyles.headerCell,
                    column.width ? { width: column.width } : { flex: 1 },
                    column.headerStyle,
                  ]}
                >
                  <Text
                    style={[
                      tableStyles.headerText,
                      { textAlign: column.textAlign || 'left' },
                    ]}
                  >
                    {column.header}
                  </Text>
                </View>
              ))}
            </View>

            {/* Skeleton Rows */}
            <ScrollView
              style={[tableStyles.scrollView, { maxHeight }]}
              showsVerticalScrollIndicator={showsVerticalScrollIndicator}
              nestedScrollEnabled={true}
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <SkeletonRow key={`skeleton-row-${index}`} columns={columns} />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[tableStyles.errorContainer, errorContainerStyle]}>
        <Text style={tableStyles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={tableStyles.retryButton}>
            <Text style={tableStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <View style={[tableStyles.emptyContainer, emptyContainerStyle]}>
        <Text style={tableStyles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  // Render cell content
  const renderCell = (column: TableColumn<T>, row: T, index: number) => {
    const value = getCellValue(column, row);

    if (column.render) {
      return column.render(value, row, index);
    }

    return (
      <Text
        style={[
          tableStyles.cellText,
          column.cellStyle,
          { textAlign: column.textAlign || 'left' },
        ]}
        numberOfLines={1}
      >
        {value ?? 'N/A'}
      </Text>
    );
  };

  const RowWrapper = onRowPress ? TouchableOpacity : View;

  return (
    <View style={[tableStyles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        contentContainerStyle={tableStyles.horizontalScrollContent}
      >
        <View style={[tableStyles.tableWrapper, { minWidth }]}>
          {/* Header Row */}
          <View style={[tableStyles.headerRow, headerRowStyle]}>
            {columns.map((column, index) => (
              <View
                key={`header-${index}`}
                style={[
                  tableStyles.headerCell,
                  column.width ? { width: column.width } : { flex: 1 },
                  column.headerStyle,
                ]}
              >
                <Text
                  style={[
                    tableStyles.headerText,
                    { textAlign: column.textAlign || 'left' },
                  ]}
                >
                  {column.header}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          <ScrollView
            style={[tableStyles.scrollView, { maxHeight }]}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            nestedScrollEnabled={true}
          >
            {data.map((row, rowIndex) => (
              <RowWrapper
                key={keyExtractor(row, rowIndex)}
                style={[tableStyles.row, rowStyle]}
                {...(onRowPress
                  ? {
                      onPress: () => onRowPress(row, rowIndex),
                      activeOpacity: 0.7,
                    }
                  : {})}
              >
                {columns.map((column, colIndex) => (
                  <View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={[
                      tableStyles.cell,
                      column.width ? { width: column.width } : { flex: 1 },
                      column.cellStyle,
                      { alignItems: column.textAlign === 'center' ? 'center' : 'flex-start' },
                    ]}
                  >
                    {renderCell(column, row, rowIndex)}
                  </View>
                ))}
              </RowWrapper>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}


