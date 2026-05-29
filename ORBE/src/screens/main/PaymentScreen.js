import React, { useState, useCallback, useMemo, useReducer } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearRide } from '../../store/slices/rideSlice';
import { completeRideService, savePaymentRecord } from '../../services/rideService';
import {
  tokenizeCard,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
} from '../../services/mercadoPagoService';
import Button from '../../components/common/Button';
import {
  formatCurrency,
  formatDistance,
  formatDuration,
  formatShortAddress,
} from '../../utils/formatters';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const METHODS = {
  STRIPE: 'stripe',
  MP: 'mercadopago',
};

// useReducer — manages MercadoPago card form fields as a single state object
const MP_FORM_INITIAL = { cardNumber: '', expiry: '', cvv: '', name: '' };

const mpFormReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return MP_FORM_INITIAL;
    default:
      return state;
  }
};

// ── Payment method selector tab ─────────────────────────────────────────────
const MethodTab = ({ label, logo, active, onPress }) => (
  <TouchableOpacity
    style={[styles.methodTab, active && styles.methodTabActive]}
    onPress={onPress}
    activeOpacity={0.8}>
    <Text style={styles.methodLogo}>{logo}</Text>
    <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ── MercadoPago card form ────────────────────────────────────────────────────
const MercadoPagoForm = ({ cardNumber, expiry, cvv, name, onChange }) => {
  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  return (
    <View style={styles.mpForm}>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Número de tarjeta</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            value={cardNumber}
            onChangeText={(t) => onChange('cardNumber', formatCardNumber(t))}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            maxLength={19}
          />
          {brand ? <Text style={styles.brandText}>{brand}</Text> : null}
        </View>
      </View>

      <View style={styles.fieldRowSplit}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Vencimiento</Text>
          <TextInput
            style={styles.fieldInput}
            value={expiry}
            onChangeText={(t) => onChange('expiry', formatExpiry(t))}
            placeholder="MM/AA"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
        <View style={styles.fieldSpacer} />
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>CVV</Text>
          <TextInput
            style={styles.fieldInput}
            value={cvv}
            onChangeText={(t) => onChange('cvv', t.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nombre en la tarjeta</Text>
        <TextInput
          style={styles.fieldInput}
          value={name}
          onChangeText={(t) => onChange('name', t)}
          placeholder="Como aparece en la tarjeta"
          placeholderTextColor={colors.textLight}
          autoCapitalize="characters"
        />
      </View>
    </View>
  );
};

// ── Main screen ─────────────────────────────────────────────────────────────
const PaymentScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { createPaymentMethod } = useStripe();

  const currentRide    = useSelector((s) => s.ride.currentRide);
  const destination    = useSelector((s) => s.ride.destination);
  const distanceMeters = useSelector((s) => s.ride.distanceMeters);
  const durationSeconds = useSelector((s) => s.ride.durationSeconds);

  const [method, setMethod]       = useState(METHODS.STRIPE);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid]           = useState(false);

  // Stripe state
  const [stripeCardComplete, setStripeCardComplete] = useState(false);

  // MercadoPago state — useReducer for multi-field form
  const [mpCard, mpDispatch] = useReducer(mpFormReducer, MP_FORM_INITIAL);

  const fare = currentRide?.fare ?? 0;

  const handleMpChange = useCallback((field, value) => {
    mpDispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // ── Stripe payment ─────────────────────────────────────────────────────────
  const payWithStripe = useCallback(async () => {
    if (!stripeCardComplete) {
      Alert.alert('Tarjeta incompleta', 'Completa los datos de la tarjeta.');
      return;
    }
    const { paymentMethod, error } = await createPaymentMethod({
      paymentMethodType: 'Card',
    });
    if (error) throw new Error(error.message);
    // In production: send paymentMethod.id to your backend to confirm the PaymentIntent
    return paymentMethod;
  }, [stripeCardComplete, createPaymentMethod]);

  // ── MercadoPago payment ────────────────────────────────────────────────────
  const payWithMercadoPago = useCallback(async () => {
    const { cardNumber, expiry, cvv, name } = mpCard;
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 13) {
      Alert.alert('Tarjeta incompleta', 'Ingresa un número de tarjeta válido.');
      return null;
    }
    const parts = expiry.split('/');
    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
      Alert.alert('Fecha inválida', 'Formato requerido: MM/AA');
      return null;
    }
    if (cvv.length < 3) {
      Alert.alert('CVV inválido', 'Ingresa el código de seguridad.');
      return null;
    }
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa el nombre del titular.');
      return null;
    }
    const token = await tokenizeCard({
      cardNumber: digits,
      expirationMonth: parts[0],
      expirationYear: parts[1],
      securityCode: cvv,
      cardholderName: name.trim(),
    });
    return token;
  }, [mpCard]);

  // ── Handle pay button ──────────────────────────────────────────────────────
  const handlePayment = useCallback(async () => {
    setProcessing(true);
    try {
      let tokenId = null;

      if (method === METHODS.STRIPE) {
        const pm = await payWithStripe();
        if (!pm) { setProcessing(false); return; }
        tokenId = pm.id;
      } else {
        const token = await payWithMercadoPago();
        if (!token) { setProcessing(false); return; }
        tokenId = token.id;
      }

      if (currentRide?.id) {
        await completeRideService(currentRide.id, { method, tokenId, amount: fare });
        await savePaymentRecord(currentRide.id, { method, tokenId, amount: fare, status: 'paid' });
      }

      mpDispatch({ type: 'RESET' });
      setPaid(true);
    } catch (err) {
      Alert.alert('Error de pago', err.message || 'No se pudo procesar el pago.');
    } finally {
      setProcessing(false);
    }
  }, [method, payWithStripe, payWithMercadoPago, currentRide, fare]);

  const handleDone = useCallback(() => {
    dispatch(clearRide());
    navigation.navigate('History');
  }, [dispatch, navigation]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!currentRide && !paid) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💳</Text>
        <Text style={styles.emptyTitle}>Sin pago pendiente</Text>
        <Text style={styles.emptySubtitle}>
          Los pagos aparecen aquí al completar un viaje.
        </Text>
        <Button
          title="Solicitar un viaje"
          onPress={() => navigation.navigate('Ride')}
          variant="outline"
          style={styles.emptyBtn}
        />
      </View>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (paid) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>¡Pago exitoso!</Text>
        <Text style={styles.successSubtitle}>
          {formatCurrency(fare)} cobrado correctamente.
        </Text>
        <Text style={styles.successProvider}>
          {method === METHODS.STRIPE ? '💳 Procesado por Stripe' : '💙 Procesado por MercadoPago'}
        </Text>
        <Button title="Ver historial de viajes" onPress={handleDone} style={styles.doneBtn} />
      </View>
    );
  }

  // ── Payment form ───────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Pago</Text>

      {/* Ride summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen del viaje</Text>
        {destination?.address ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Destino</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {formatShortAddress(destination.address)}
            </Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Distancia</Text>
          <Text style={styles.rowValue}>{formatDistance(distanceMeters)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Duración</Text>
          <Text style={styles.rowValue}>{formatDuration(durationSeconds)}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(fare)}</Text>
        </View>
      </View>

      {/* Payment method selector */}
      <Text style={styles.sectionTitle}>Método de pago</Text>
      <View style={styles.methodSelector}>
        <MethodTab
          label="Stripe"
          logo="💳"
          active={method === METHODS.STRIPE}
          onPress={() => setMethod(METHODS.STRIPE)}
        />
        <MethodTab
          label="MercadoPago"
          logo="💙"
          active={method === METHODS.MP}
          onPress={() => setMethod(METHODS.MP)}
        />
      </View>

      {/* Card form */}
      <View style={styles.cardSection}>
        {method === METHODS.STRIPE ? (
          <>
            <View style={styles.providerHeader}>
              <Text style={styles.sectionTitle}>Datos de tarjeta</Text>
              <View style={[styles.providerBadge, styles.stripeBadge]}>
                <Text style={styles.providerBadgeText}>Stripe</Text>
              </View>
            </View>
            <CardField
              postalCodeEnabled={false}
              placeholder={{ number: '4242 4242 4242 4242' }}
              cardStyle={styles.stripeCardStyle}
              style={styles.stripeCardField}
              onCardChange={(card) => setStripeCardComplete(card.complete)}
            />
          </>
        ) : (
          <>
            <View style={styles.providerHeader}>
              <Text style={styles.sectionTitle}>Datos de tarjeta</Text>
              <View style={[styles.providerBadge, styles.mpBadge]}>
                <Text style={styles.providerBadgeText}>MercadoPago</Text>
              </View>
            </View>
            <MercadoPagoForm
              cardNumber={mpCard.cardNumber}
              expiry={mpCard.expiry}
              cvv={mpCard.cvv}
              name={mpCard.name}
              onChange={handleMpChange}
            />
          </>
        )}
      </View>

      <Button
        title={`Pagar ${formatCurrency(fare)}`}
        onPress={handlePayment}
        loading={processing}
        size="lg"
        style={styles.payBtn}
      />
      <Text style={styles.secureNote}>🔒 Transacción segura y encriptada</Text>
    </ScrollView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    marginBottom: theme.spacing.xl,
  },
  // Summary
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.xs },
  rowLabel: { fontSize: theme.fontSize.sm, color: colors.textSecondary },
  rowValue: {
    fontSize: theme.fontSize.sm, color: colors.text,
    fontWeight: theme.fontWeight.medium, maxWidth: '55%', textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1, borderTopColor: colors.border,
    marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm,
  },
  totalLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: colors.text },
  totalAmount: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: colors.accent },
  // Method selector
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
    marginBottom: theme.spacing.sm,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodTabActive: {
    borderColor: colors.accent,
    backgroundColor: '#FFF5F7',
  },
  methodLogo: { fontSize: 20 },
  methodLabel: { fontSize: theme.fontSize.sm, color: colors.textSecondary, fontWeight: theme.fontWeight.medium },
  methodLabelActive: { color: colors.accent },
  // Card section
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  providerBadge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  stripeBadge: { backgroundColor: '#635BFF' },
  mpBadge: { backgroundColor: '#009EE3' },
  providerBadgeText: { fontSize: theme.fontSize.xs, color: colors.white, fontWeight: theme.fontWeight.semibold },
  // Stripe
  stripeCardField: { width: '100%', height: 50 },
  stripeCardStyle: {
    backgroundColor: colors.surfaceAlt,
    textColor: colors.text,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
  },
  // MercadoPago form
  mpForm: {},
  fieldGroup: { marginBottom: theme.spacing.md },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: colors.text,
    marginBottom: theme.spacing.xs,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
  },
  brandText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    minWidth: 72,
    textAlign: 'right',
  },
  fieldRowSplit: { flexDirection: 'row' },
  fieldSpacer: { width: theme.spacing.md },
  // Pay button
  payBtn: { marginBottom: theme.spacing.sm },
  secureNote: {
    fontSize: theme.fontSize.xs, color: colors.textSecondary,
    textAlign: 'center', marginBottom: theme.spacing.xl,
  },
  // Empty
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: theme.spacing.xxl, backgroundColor: colors.background,
  },
  emptyIcon: { fontSize: 56, marginBottom: theme.spacing.md },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.semibold, color: colors.text, marginBottom: theme.spacing.sm },
  emptySubtitle: { fontSize: theme.fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xl },
  emptyBtn: { width: '80%' },
  // Success
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: theme.spacing.xxl, backgroundColor: colors.background,
  },
  successIcon: { fontSize: 64, marginBottom: theme.spacing.lg },
  successTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: colors.text, marginBottom: theme.spacing.sm, textAlign: 'center' },
  successSubtitle: { fontSize: theme.fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.sm },
  successProvider: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, marginBottom: theme.spacing.xxl, color: colors.textSecondary },
  doneBtn: { width: '100%' },
});

export default PaymentScreen;
