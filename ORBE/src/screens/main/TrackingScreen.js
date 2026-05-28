import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateDriverLocation, updateRideStatus, clearRide } from '../../store/slices/rideSlice';
import { listenToDriverLocation, listenToRideStatus } from '../../services/rideService';
import RideMap from '../../components/map/RideMap';
import Button from '../../components/common/Button';
import { RIDE_STATUS } from '../../constants/vehicleTypes';
import { formatCurrency } from '../../utils/formatters';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const STATUS_LABELS = {
  [RIDE_STATUS.SEARCHING]: 'Finding your driver...',
  [RIDE_STATUS.DRIVER_FOUND]: 'Driver assigned!',
  [RIDE_STATUS.DRIVER_APPROACHING]: 'Driver is on the way',
  [RIDE_STATUS.IN_PROGRESS]: 'Ride in progress',
  [RIDE_STATUS.COMPLETED]: 'Ride completed!',
  [RIDE_STATUS.CANCELLED]: 'Ride cancelled',
};

const TrackingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentRide, origin, destination, driverLocation, rideStatus, routeCoordinates } =
    useSelector((state) => state.ride);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const driverUnsubRef = useRef(null);
  const statusUnsubRef = useRef(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (!currentRide?.id) return;

    driverUnsubRef.current = listenToDriverLocation(currentRide.id, (coords) => {
      dispatch(updateDriverLocation(coords));
    });

    statusUnsubRef.current = listenToRideStatus(currentRide.id, (status) => {
      dispatch(updateRideStatus(status));
    });

    return () => {
      driverUnsubRef.current?.();
      statusUnsubRef.current?.();
    };
  }, [dispatch, currentRide?.id]);

  useEffect(() => {
    if (rideStatus === RIDE_STATUS.COMPLETED) {
      navigation.navigate('Payment');
    }
  }, [rideStatus, navigation]);

  const handleCancelRide = useCallback(() => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            dispatch(clearRide());
            navigation.navigate('Ride');
          },
        },
      ],
    );
  }, [dispatch, navigation]);

  const isSearching = rideStatus === RIDE_STATUS.SEARCHING;
  const canCancel = [RIDE_STATUS.SEARCHING, RIDE_STATUS.DRIVER_FOUND, RIDE_STATUS.DRIVER_APPROACHING].includes(rideStatus);

  return (
    <View style={styles.container}>
      <RideMap
        origin={origin}
        destination={destination}
        driverLocation={driverLocation}
        routeCoordinates={routeCoordinates}
        style={styles.map}
      />

      <View style={styles.infoPanel}>
        <View style={styles.statusRow}>
          {isSearching ? (
            <Animated.View
              style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]}
            />
          ) : (
            <View style={styles.activeDot} />
          )}
          <Text style={styles.statusText}>
            {STATUS_LABELS[rideStatus] || 'Connecting...'}
          </Text>
        </View>

        {currentRide ? (
          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{currentRide.vehicleType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Fare</Text>
              <Text style={styles.detailValue}>{formatCurrency(currentRide.fare)}</Text>
            </View>
          </View>
        ) : null}

        {driverLocation ? (
          <View style={styles.driverTag}>
            <Text style={styles.driverTagText}>🚗 Driver nearby</Text>
          </View>
        ) : null}

        {canCancel ? (
          <TouchableOpacity onPress={handleCancelRide} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel Ride</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadow.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.warning,
    marginRight: theme.spacing.sm,
  },
  activeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
  },
  rideDetails: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
  },
  driverTag: {
    backgroundColor: '#E8F5E9',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  driverTagText: {
    fontSize: theme.fontSize.sm,
    color: colors.success,
    fontWeight: theme.fontWeight.medium,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  cancelBtnText: {
    fontSize: theme.fontSize.sm,
    color: colors.error,
    fontWeight: theme.fontWeight.medium,
  },
});

export default TrackingScreen;
