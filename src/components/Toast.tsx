import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';
const ERROR_RED = '#F44336';
const SUCCESS_GREEN = '#4CAF50';
const INFO_BLUE = '#2196F3';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Date.now().toString();
    setToast({ id, message, type, duration });

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast();
      }, duration);
    }
  }, [slideAnim, opacityAnim]);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [slideAnim, opacityAnim]);

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return [SUCCESS_GREEN, BRIGHT_GREEN];
      case 'error':
        return [ERROR_RED, '#FF6B6B'];
      case 'info':
      default:
        return [TEAL_GREEN, BRIGHT_GREEN];
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.toastContainer,
              {
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={hideToast}
              style={styles.toast}
            >
              <LinearGradient
                colors={getToastColors(toast.type)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <View style={styles.toastContent}>
                  <Text style={styles.icon}>{getIcon(toast.type)}</Text>
                  <Text style={styles.message}>{toast.message}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'flex-start',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toastContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    left: 20,
    right: 20,
    maxWidth: SCREEN_WIDTH - 40,
    zIndex: 10000,
  },
  toast: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
});

