import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import { useDispatch, useSelector } from 'react-redux';
import { clearRide } from '../../store/slices/rideSlice';
import { savePaymentRecord, completeRideService } from '../../services/rideService';
import Button from '../../components/common/Button';
import { formatCurrency, formatDistance, formatDuration, formatShortAddress } from '../../utils/formatters';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const PaymentScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { confirmPayment } = useStripe();
  const { currentRide, destination, distanceMeters, durationSeconds } = useSelector(
    (state) => state.ride,
  );

  const [cardDetails, setCardDetails] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  const fare = currentRide?.fare || 0;

  const handlePayment = useCallback(async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Card Incomplete', 'Please enter your complete card details.');
      return;
    }

    setProcessing(true);

    try {
      const { paymentIntent, error } = await confirmPayment(
        STRIPE_PUBLISHABLE_KEY || '',
        { paymentMethodType: 'Card' },
      );

      if (error) {
        Alert.alert('Payment Failed', error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'Succeeded') {
        if (currentRide?.id) {
          await completeRideService(currentRide.id, {
            method: 'stripe',
            intentId: paymentIntent.id,
            amount: fare,
          });
          await savePaymentRecord(currentRide.id, {
            method: 'stripe',
            amount: fare,
            status: 'paid',
          });
        }
        setPaid(true);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcessing(false);
    }
  }, [cardDetails, confirmPayment, currentRide, fare]);

  const handleDone = useCallback(() => {
    dispatch(clearRide());
    navigation.navigate('History');
  }, [dispatch, navigation]);

  if (paid) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>
          {formatCurrency(fare)} was charged successfully.
        </Text>
        <Button title="View Ride History" onPress={handleDone} style={styles.doneBtn} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Payment</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ride Summary</Text>
        {destination?.address ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Destination</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {formatShortAddress(destination.address)}
            </Text>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Distance</Text>
          <Text style={styles.summaryValue}>{formatDistance(distanceMeters)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{formatDuration(durationSeconds)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(fare)}</Text>
        </View>
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>Card Details</Text>
        <CardField
          postalCodeEnabled={false}
          placeholder={{ number: '4242 4242 4242 4242' }}
          cardStyle={styles.stripeCard}
          style={styles.cardField}
          onCardChange={setCardDetails}
        />
      </View>

      <Button
        title={`Pay ${formatCurrency(fare)}`}
        onPress={handlePayment}
        loading={processing}
        style={styles.payBtn}
        size="lg"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.sm,
  },
  summaryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.fontSize.sm,
    color: colors.text,
    fontWeight: theme.fontWeight.medium,
    maxWidth: '55%',
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
  },
  totalAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.accent,
  },
  cardSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  stripeCard: {
    backgroundColor: colors.surface,
    textColor: colors.text,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
  },
  payBtn: {
    marginBottom: theme.spacing.xl,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    backgroundColor: colors.background,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  doneBtn: {
    width: '100%',
  },
});

export default PaymentScreen;
