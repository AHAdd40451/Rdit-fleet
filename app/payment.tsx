import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import { LoadingBar } from '../src/components/LoadingBar';
import { useToast } from '../src/components/Toast';
import { TopBar } from '../src/components/TopBar';
import { createPaymentIntent } from '../src/lib/createPaymentIntent';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';

const PLANS = [
  {
    id: 'heavyweight',
    name: 'Heavyweight',
    subtitle: 'Best for frequent fleet operations',
    centsPerDay: 400,
    badge: 'Most Popular',
  },
  {
    id: 'rookie',
    name: 'Rookie',
    subtitle: 'Great for getting started',
    centsPerDay: 200,
    badge: 'Starter',
  },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async (planId: string) => {
    const selectedPlan = PLANS.find((plan) => plan.id === planId);
    if (!selectedPlan) {
      showToast('Plan not found', 'error');
      return;
    }

    const cents = selectedPlan.centsPerDay;
    setSelectedPlanId(planId);
    setLoading(true);
    try {
      const result = await createPaymentIntent({
        amount: cents,
        currency: 'usd',
        metadata: {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          source: 'mobile-app',
        },
      });
      if (result.error) {
        showToast(result.error, 'error');
        setLoading(false);
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret!,
        merchantDisplayName: 'Redit Fleet',
      });

      if (initError) {
        showToast(initError.message || 'Failed to initialize payment', 'error');
        setLoading(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();
      setLoading(false);

      if (presentError) {
        if (presentError.code === 'Canceled') {
          showToast('Payment canceled', 'info');
        } else {
          showToast(presentError.message || 'Payment failed', 'error');
        }
        setSelectedPlanId(null);
        return;
      }

      showToast(`${selectedPlan.name} plan payment successful!`, 'success');
      setSelectedPlanId(null);
      router.back();
    } catch (e) {
      setLoading(false);
      const message = e instanceof Error ? e.message : 'Something went wrong';
      showToast(message, 'error');
      setSelectedPlanId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        title="Payment"
        showBack
        onBackPress={() => router.back()}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Product Plans</Text>
          <Text style={styles.subtitle}>
            Pick a plan for your fleet and complete payment securely with Stripe.
          </Text>

          {PLANS.map((plan) => {
            const isPlanLoading = loading && selectedPlanId === plan.id;
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.id === 'heavyweight' ? styles.planCardPrimary : styles.planCardSecondary,
                ]}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planIcon}>
                    <Ionicons name="cube-outline" size={20} color={TEAL_GREEN} />
                  </View>
                  <Text style={styles.planBadge}>{plan.badge}</Text>
                </View>

                <View style={styles.planBody}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceMain}>${(plan.centsPerDay / 100).toFixed(2)}</Text>
                    <Text style={styles.priceUnit}> USD / day</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.selectButton, loading ? styles.selectButtonDisabled : null]}
                  activeOpacity={0.85}
                  disabled={loading}
                  onPress={() => handlePay(plan.id)}
                >
                  {isPlanLoading ? (
                    <LoadingBar />
                  ) : (
                    <>
                      <Text style={styles.selectButtonText}>Choose {plan.name}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          <Text style={styles.countText}>{PLANS.length} plans available</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAF9',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 1,
    borderColor: `${TEAL_GREEN}30`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  planCardPrimary: {
    backgroundColor: `${TEAL_GREEN}12`,
  },
  planCardSecondary: {
    backgroundColor: `${BRIGHT_GREEN}20`,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${TEAL_GREEN}20`,
  },
  planBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: TEAL_GREEN,
    backgroundColor: `${BRIGHT_GREEN}60`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  planBody: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  planName: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  planSubtitle: {
    color: '#475569',
    fontSize: 14,
    marginTop: 4,
  },
  priceMain: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  priceUnit: {
    color: '#334155',
    fontSize: 14,
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: TEAL_GREEN,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectButtonDisabled: {
    opacity: 0.7,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  countText: {
    marginTop: 6,
    fontSize: 14,
    color: TEAL_GREEN,
    textAlign: 'center',
  },
});
