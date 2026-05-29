import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { updateRideStatus, clearRide } from '../../store/slices/rideSlice';
import { updateRideStatusService } from '../../services/rideService';
import useDriverAnimation from '../../hooks/useDriverAnimation';
import { RIDE_STATUS } from '../../constants/vehicleTypes';
import { formatCurrency } from '../../utils/formatters';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 10.4806,
  longitude: -66.9036,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Ride progression timing
const RIDE_PROGRESSION = [
  { status: RIDE_STATUS.DRIVER_FOUND,       delay: 2000  },
  { status: RIDE_STATUS.DRIVER_APPROACHING,  delay: 8000  },
  { status: RIDE_STATUS.IN_PROGRESS,         delay: 14000 },
  { status: RIDE_STATUS.COMPLETED,           delay: 36000 },
];

// ── Driver car marker — white rounded square 40px ─────────────────────────────
const DriverMarker = React.memo(() => (
  <View style={driverMarkerStyles.outer}>
    <View style={driverMarkerStyles.iconWrap}>
      <Icon name="car" size={22} color={colors.primary} />
    </View>
  </View>
));

const driverMarkerStyles = StyleSheet.create({
  outer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  iconWrap: {
    transform: [{ rotate: '-90deg' }],
  },
});

// ── Pulsing dots for STATE 1 ──────────────────────────────────────────────────
const PulsingDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const makePulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ]),
      );

    const a1 = makePulse(dot1, 0);
    const a2 = makePulse(dot2, 200);
    const a3 = makePulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={dotStyles.row}>
      <Animated.View style={[dotStyles.dot, { opacity: dot1 }]} />
      <Animated.View style={[dotStyles.dot, { opacity: dot2 }]} />
      <Animated.View style={[dotStyles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
});

// ── Animated progress bar for STATE 3 ────────────────────────────────────────
const ProgressBar = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 22000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={progressStyles.track}>
      <Animated.View style={[progressStyles.fill, { width }]} />
    </View>
  );
};

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

// ── STATE 1: Finding driver ───────────────────────────────────────────────────
const StateFinding = ({ onCancel }) => (
  <View style={sheetStyles.stateContainer}>
    <PulsingDots />
    <Text style={sheetStyles.findingTitle}>Finding your driver...</Text>
    <Text style={sheetStyles.findingSubtitle}>
      We're matching you with a nearby driver
    </Text>
    <TouchableOpacity style={sheetStyles.cancelOutlineBtn} onPress={onCancel} activeOpacity={0.8}>
      <Text style={sheetStyles.cancelOutlineText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

// ── STATE 2: Driver found ─────────────────────────────────────────────────────
const StateDriverFound = ({ onCancel }) => (
  <View style={sheetStyles.stateContainer}>
    {/* Driver row */}
    <View style={sheetStyles.driverRow}>
      <View style={sheetStyles.driverPhotoCircle}>
        <Icon name="account" size={28} color={colors.gray400} />
      </View>
      <View style={sheetStyles.driverInfo}>
        <Text style={sheetStyles.driverName}>Carlos M.</Text>
        <Text style={sheetStyles.driverCar}>Toyota Corolla · ABC 123</Text>
      </View>
      <View style={sheetStyles.driverRating}>
        <Text style={sheetStyles.starIcon}>★</Text>
        <Text style={sheetStyles.ratingText}>4.92</Text>
      </View>
    </View>

    <Text style={sheetStyles.arrivingText}>Arriving in 4 min</Text>

    <View style={sheetStyles.divider} />

    {/* Action buttons */}
    <View style={sheetStyles.actionRow}>
      <TouchableOpacity style={sheetStyles.actionBtn} activeOpacity={0.8}>
        <Icon name="message-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={sheetStyles.actionBtn} activeOpacity={0.8}>
        <Icon name="phone-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={sheetStyles.actionBtn} activeOpacity={0.8}>
        <Icon name="share-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>

    <TouchableOpacity onPress={onCancel} activeOpacity={0.8}>
      <Text style={sheetStyles.cancelRideText}>Cancel ride</Text>
    </TouchableOpacity>
  </View>
);

// ── STATE 3: On your way ──────────────────────────────────────────────────────
const StateOnWay = ({ destination }) => (
  <View style={sheetStyles.stateContainer}>
    <Text style={sheetStyles.destinationAddress} numberOfLines={2}>
      {destination?.address || 'Your destination'}
    </Text>
    <Text style={sheetStyles.arrivalTime}>Arriving at 3:42 PM · 12 min away</Text>
    <ProgressBar />
  </View>
);

// ── Shared bottom sheet styles ─────────────────────────────────────────────────
const sheetStyles = StyleSheet.create({
  stateContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  // State 1
  findingTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  findingSubtitle: {
    fontSize: theme.fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  cancelOutlineBtn: {
    height: 44,
    borderRadius: theme.borderRadius.btn,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  cancelOutlineText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: colors.gray500,
  },
  // State 2
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  driverPhotoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.primary,
  },
  driverCar: {
    fontSize: theme.fontSize.sm,
    color: colors.gray400,
    marginTop: 2,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: theme.fontSize.md,
    color: colors.primary,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    color: colors.gray400,
    fontWeight: theme.fontWeight.medium,
  },
  arrivingText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.primary,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRideText: {
    fontSize: theme.fontSize.sm,
    color: colors.accentRed,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
    paddingVertical: theme.spacing.xs,
  },
  // State 3
  destinationAddress: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.primary,
    marginBottom: theme.spacing.xs,
  },
  arrivalTime: {
    fontSize: theme.fontSize.sm,
    color: colors.gray400,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
const TrackingScreen = ({ navigation }) => {
  const mapRef    = useRef(null);
  const dispatch  = useDispatch();
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const currentRide  = useSelector((s) => s.ride.currentRide);
  const origin       = useSelector((s) => s.ride.origin);
  const destination  = useSelector((s) => s.ride.destination);
  const rideStatus   = useSelector((s) => s.ride.rideStatus);
  const routeCoords  = useSelector((s) => s.ride.routeCoordinates);

  const { driverPos, driverBearing } = useDriverAnimation(
    rideStatus,
    origin,
    destination,
    routeCoords,
  );

  // Determine which state we're in for the 3-state sheet
  const sheetState = useMemo(() => {
    if (rideStatus === RIDE_STATUS.SEARCHING) return 1;
    if (
      rideStatus === RIDE_STATUS.DRIVER_FOUND ||
      rideStatus === RIDE_STATUS.DRIVER_APPROACHING
    )
      return 2;
    if (rideStatus === RIDE_STATUS.IN_PROGRESS) return 3;
    return 1;
  }, [rideStatus]);

  const sheetHeight = useMemo(() => {
    if (sheetState === 2) return 340;
    return 200;
  }, [sheetState]);

  // ── Simulate ride progression ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentRide?.id) return;
    const timers = RIDE_PROGRESSION.map(({ status, delay }) =>
      setTimeout(() => dispatch(updateRideStatus(status)), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [currentRide?.id, dispatch]);

  // ── On COMPLETED: persist + navigate ──────────────────────────────────────
  useEffect(() => {
    if (rideStatus !== RIDE_STATUS.COMPLETED) return;
    if (currentRide?.id) {
      updateRideStatusService(currentRide.id, RIDE_STATUS.COMPLETED).catch(() => {});
    }
    const t = setTimeout(() => navigation.navigate('Payment'), 1800);
    return () => clearTimeout(t);
  }, [rideStatus, navigation, currentRide?.id]);

  // ── Animate sheet height changes ───────────────────────────────────────────
  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue: sheetHeight,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [sheetHeight, sheetAnim]);

  // ── Fit map on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!origin || !destination || !mapRef.current) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates([origin, destination], {
        edgePadding: { top: 100, right: 60, bottom: 360, left: 60 },
        animated: true,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [origin, destination]);

  // ── Camera: follow driver in STATE 3 ──────────────────────────────────────
  useEffect(() => {
    if (!driverPos || !mapRef.current) return;
    if (rideStatus === RIDE_STATUS.IN_PROGRESS) {
      mapRef.current.animateCamera({ center: driverPos, zoom: 16 }, { duration: 300 });
    }
  }, [driverPos, rideStatus]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel ride', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: () => {
          dispatch(clearRide());
          navigation.navigate('Home');
        },
      },
    ]);
  }, [dispatch, navigation]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!currentRide) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyTitle}>No active ride</Text>
        <Text style={styles.emptySubtitle}>
          Request a ride from the Home tab.
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}>
          <Text style={styles.emptyBtnText}>Request a ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── FULL-SCREEN MAP ──────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={
          origin
            ? { ...origin, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : INITIAL_REGION
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled
        loadingIndicatorColor={colors.accentBlue}>

        {/* Origin marker */}
        {origin ? (
          <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.originDot} />
          </Marker>
        ) : null}

        {/* Destination pin */}
        {destination ? (
          <Marker coordinate={destination} pinColor={colors.primary} title="Destination" />
        ) : null}

        {/* Route polyline */}
        {routeCoords && routeCoords.length > 1 ? (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.accentBlue}
            strokeWidth={4}
          />
        ) : null}

        {/* Driver marker */}
        {driverPos ? (
          <Marker
            coordinate={driverPos}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={driverBearing}
            tracksViewChanges={true}>
            <DriverMarker />
          </Marker>
        ) : null}
      </MapView>

      {/* ── BOTTOM SHEET ────────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { height: sheetAnim }]}>
        <View style={styles.sheetHandle} />

        {sheetState === 1 && <StateFinding onCancel={handleCancel} />}
        {sheetState === 2 && <StateDriverFound onCancel={handleCancel} />}
        {sheetState === 3 && <StateOnWay destination={destination} />}
      </Animated.View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mapTint,
  },
  map: {
    width: W,
    height: H,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Origin dot: blue circle w/ white ring
  originDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.accentBlue,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    paddingBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    backgroundColor: colors.white,
  },
  emptyIcon: { fontSize: 56, marginBottom: theme.spacing.md },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: colors.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyBtn: {
    height: 56,
    borderRadius: theme.borderRadius.btn,
    backgroundColor: colors.primary,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.white,
  },
});

export default TrackingScreen;
