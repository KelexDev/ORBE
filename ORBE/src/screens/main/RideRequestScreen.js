import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOOGLE_MAPS_API_KEY } from '@env';
import useLocation from '../../hooks/useLocation';
import useRide from '../../hooks/useRide';
import { VEHICLE_CONFIG } from '../../constants/vehicleTypes';
import { formatCurrency } from '../../utils/formatters';

const { width: W, height: H } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 10.4806,
  longitude: -66.9036,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f2e8dc' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#716e5e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f2e8dc' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8dcc8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b2ccd6' }] },
  { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
];

const SAVED_PLACES = [
  { id: 'home', name: 'Home', address: 'Av. Principal 123', type: 'home' },
  { id: 'work', name: 'Work', address: 'Torre Empresarial, piso 8', type: 'work' },
];

const VEHICLE_LABELS = {
  economy: { name: 'UberX', badge: 'Most popular', seats: 4 },
  xl: { name: 'Uber XL', badge: null, seats: 6 },
  premium: { name: 'Uber Black', badge: 'Premium', seats: 4 },
};

// ── Vehicle row inside bottom sheet ──────────────────────────────────────────
const VehicleRow = ({ vehicle, fare, isSelected, onSelect, etaMinutes }) => {
  const meta = VEHICLE_LABELS[vehicle.id] || { name: vehicle.label, badge: null, seats: vehicle.capacity };
  return (
    <TouchableOpacity
      style={[styles.vehicleRow, isSelected && styles.vehicleRowSelected]}
      onPress={() => onSelect(vehicle.id)}
      activeOpacity={0.85}>
      {/* Car icon / emoji placeholder */}
      <View style={styles.vehicleImgWrap}>
        <Text style={styles.vehicleEmoji}>{vehicle.icon}</Text>
      </View>

      {/* Name + seats + ETA */}
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleNameRow}>
          <Text style={styles.vehicleName}>{meta.name}</Text>
          {meta.badge ? (
            <View style={styles.vehicleBadge}>
              <Text style={styles.vehicleBadgeText}>{meta.badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.vehicleMeta}>
          {meta.seats} seats · {etaMinutes ?? vehicle.estimatedWait}
        </Text>
      </View>

      {/* Price */}
      <Text style={styles.vehiclePrice}>{formatCurrency(fare)}</Text>
    </TouchableOpacity>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const RideRequestScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const insets = useSafeAreaInsets();

  const { location, loading: locationLoading } = useLocation();
  const {
    origin,
    destination,
    selectedVehicle,
    fareEstimate,
    distanceMeters,
    durationSeconds,
    routeCoordinates,
    loading: rideLoading,
    selectOrigin,
    selectDestination,
    selectVehicle,
    fetchRoute,
    submitRideRequest,
  } = useRide();

  const [routeLoading, setRouteLoading] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [destinationText, setDestinationText] = useState('');

  // Set origin when GPS ready
  useEffect(() => {
    if (!location) return;
    if (!origin) selectOrigin(location);
    mapRef.current?.animateToRegion(
      { ...location, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      800,
    );
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch route when destination set
  useEffect(() => {
    if (!origin || !destination) return;
    setRouteLoading(true);
    setShowVehicles(false);
    fetchRoute(origin, destination).finally(() => {
      setRouteLoading(false);
      setShowVehicles(true);
      mapRef.current?.fitToCoordinates([origin, destination], {
        edgePadding: { top: 180, right: 60, bottom: 420, left: 60 },
        animated: true,
      });
    });
  }, [destination?.latitude, destination?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDestinationSelect = useCallback(
    (data, details) => {
      if (!details?.geometry?.location) return;
      setDestinationText(data.description);
      selectDestination({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        address: data.description,
      });
    },
    [selectDestination],
  );

  const handleClearDestination = useCallback(() => {
    setDestinationText('');
    setShowVehicles(false);
    autocompleteRef.current?.clear();
  }, []);

  const handleConfirmRide = useCallback(async () => {
    if (!selectedVehicle) {
      Alert.alert('Select a ride', 'Please choose a vehicle type first.');
      return;
    }
    try {
      await submitRideRequest();
      navigation.navigate('Tracking');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to request ride. Please try again.');
    }
  }, [selectedVehicle, submitRideRequest, navigation]);

  const selectedMeta = VEHICLE_LABELS[selectedVehicle];
  const selectedFare = fareEstimate?.find((f) => f.vehicleId === selectedVehicle);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen map behind everything */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled>
        {origin ? (
          <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.originDot} />
          </Marker>
        ) : null}
        {destination ? (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
            <Icon name="map-marker" size={32} color="#000000" />
          </Marker>
        ) : null}
        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#276EF1"
            strokeWidth={4}
          />
        ) : null}
      </MapView>

      {/* ── DESTINATION SEARCH — dark top zone ─────────────────── */}
      <View style={[styles.searchZone, { paddingTop: insets.top + 8 }]}>
        {/* Back arrow */}
        <TouchableOpacity
          style={styles.searchBackBtn}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Pickup + destination rows */}
        <View style={styles.searchFields}>
          {/* Pickup row */}
          <View style={styles.searchRow}>
            <View style={styles.pickupDot} />
            <Text style={styles.pickupText} numberOfLines={1}>
              {locationLoading ? 'Getting location...' : 'Current location'}
            </Text>
          </View>

          {/* Dashed connector */}
          <View style={styles.dashedConnector}>
            <View style={styles.dashedLine} />
          </View>

          {/* Destination row — autocomplete */}
          <View style={styles.searchRow}>
            <View style={styles.destDot} />
            <GooglePlacesAutocomplete
              ref={autocompleteRef}
              placeholder="Where to?"
              onPress={handleDestinationSelect}
              fetchDetails
              query={{ key: GOOGLE_MAPS_API_KEY, language: 'es' }}
              styles={placesStyles}
              debounce={300}
              minLength={2}
              enablePoweredByContainer={false}
              keyboardShouldPersistTaps="always"
              keepResultsAfterBlur
              listViewDisplayed="auto"
            />
            {destinationText ? (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearDestination}>
                <Icon name="close-circle" size={18} color="#999999" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Saved places section (shown when no destination) */}
      {!showVehicles && !routeLoading ? (
        <View style={styles.savedSection}>
          <Text style={styles.savedHeader}>SAVED PLACES</Text>
          {SAVED_PLACES.map((place, idx) => (
            <View key={place.id}>
              <TouchableOpacity
                style={styles.savedRow}
                onPress={() => {
                  /* In production: selectDestination with saved coords */
                }}>
                <Icon
                  name={place.type === 'home' ? 'heart' : 'briefcase'}
                  size={18}
                  color="#000000"
                  style={styles.savedIcon}
                />
                <View style={styles.savedTexts}>
                  <Text style={styles.savedName}>{place.name}</Text>
                  <Text style={styles.savedAddress}>{place.address}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#999999" />
              </TouchableOpacity>
              {idx < SAVED_PLACES.length - 1 && <View style={styles.savedSep} />}
            </View>
          ))}
        </View>
      ) : null}

      {/* Route loading indicator */}
      {routeLoading ? (
        <View style={styles.routeLoadingCard}>
          <ActivityIndicator size="small" color="#000000" />
          <Text style={styles.routeLoadingText}>Finding best route...</Text>
        </View>
      ) : null}

      {/* ── VEHICLE SELECT — bottom sheet ──────────────────────── */}
      {showVehicles && fareEstimate?.length ? (
        <View style={[styles.vehicleSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.sheetHandle} />

          {/* Header row */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose a ride</Text>
            <View style={styles.pickupPill}>
              <Text style={styles.pickupPillText}>Pickup in 3 min</Text>
            </View>
          </View>

          {/* Vehicle list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {VEHICLE_CONFIG.map((v) => {
              const fareItem = fareEstimate.find((f) => f.vehicleId === v.id);
              return (
                <VehicleRow
                  key={v.id}
                  vehicle={v}
                  fare={fareItem?.fare ?? 0}
                  isSelected={selectedVehicle === v.id}
                  onSelect={selectVehicle}
                />
              );
            })}

            {/* Separator */}
            <View style={styles.sheetSep} />

            {/* Payment row */}
            <TouchableOpacity style={styles.paymentRow}>
              <Icon name="credit-card-outline" size={20} color="#000000" />
              <Text style={styles.paymentText}>•••• 4242</Text>
              <Icon name="chevron-right" size={18} color="#545454" />
            </TouchableOpacity>
          </ScrollView>

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.confirmBtn, !selectedVehicle && styles.confirmBtnDisabled]}
            onPress={handleConfirmRide}
            disabled={rideLoading || !selectedVehicle}
            activeOpacity={0.9}>
            <Text style={styles.confirmBtnText}>
              {rideLoading
                ? 'Requesting...'
                : selectedMeta
                ? `Confirm ${selectedMeta.name}`
                : 'Select a ride'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

// Google Places autocomplete styles
const placesStyles = {
  container: { flex: 1, overflow: 'visible' },
  textInputContainer: { backgroundColor: 'transparent' },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    marginBottom: 0,
    marginLeft: 0,
    height: 36,
  },
  listView: {
    position: 'absolute',
    top: 40,
    left: -32,
    right: -16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  description: { fontSize: 13, color: '#000000', flex: 1 },
  separator: { height: 1, backgroundColor: '#EEEEEE' },
  poweredContainer: { height: 0, opacity: 0 },
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8E0D8',
  },
  map: {
    width: W,
    height: H,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Origin dot on map
  originDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#276EF1',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  // ── Search zone (dark top) ────────────────────────────────────
  searchZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 100,
    overflow: 'visible',
  },
  searchBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  searchFields: {
    paddingLeft: 8,
    overflow: 'visible',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    overflow: 'visible',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#999999',
    marginRight: 12,
    flexShrink: 0,
  },
  pickupText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  dashedConnector: {
    paddingLeft: 4,
    paddingVertical: 4,
  },
  dashedLine: {
    width: 2,
    height: 16,
    borderWidth: 1,
    borderColor: '#545454',
    borderStyle: 'dashed',
    marginLeft: 0,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    flexShrink: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  // ── Saved places (below search zone) ─────────────────────────
  savedSection: {
    position: 'absolute',
    top: 0, // will be pushed down by searchZone
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    marginTop: 160,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  savedHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    letterSpacing: 0.8,
    paddingVertical: 8,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 8,
  },
  savedIcon: {
    marginRight: 12,
  },
  savedTexts: {
    flex: 1,
  },
  savedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  savedAddress: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  savedSep: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  // Route loading card
  routeLoadingCard: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  routeLoadingText: {
    fontSize: 13,
    color: '#545454',
  },
  // ── Vehicle bottom sheet ──────────────────────────────────────
  vehicleSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: H * 0.65,
    paddingHorizontal: 16,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EEEEEE',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  pickupPill: {
    backgroundColor: '#000000',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pickupPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Vehicle row
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  vehicleRowSelected: {
    borderColor: '#000000',
    backgroundColor: '#F6F6F6',
  },
  vehicleImgWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleEmoji: {
    fontSize: 32,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  vehicleBadge: {
    backgroundColor: '#000000',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vehicleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vehicleMeta: {
    fontSize: 13,
    color: '#999999',
  },
  vehiclePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  sheetSep: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
  // Payment row
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  // Confirm button
  confirmBtn: {
    height: 56,
    borderRadius: 4,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#EEEEEE',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RideRequestScreen;
