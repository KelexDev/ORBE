import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useSelector } from 'react-redux';
import { GOOGLE_MAPS_API_KEY } from '@env';
import RideMap from '../../components/map/RideMap';
import VehicleCard from '../../components/ride/VehicleCard';
import FareEstimate from '../../components/ride/FareEstimate';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useLocation from '../../hooks/useLocation';
import useRide from '../../hooks/useRide';
import { VEHICLE_CONFIG } from '../../constants/vehicleTypes';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const RideRequestScreen = ({ navigation }) => {
  const { location, loading: locationLoading } = useLocation();
  const {
    origin,
    destination,
    selectedVehicle,
    fareEstimate,
    distanceMeters,
    durationSeconds,
    routeCoordinates,
    loading,
    selectOrigin,
    selectDestination,
    selectVehicle,
    fetchRoute,
    submitRideRequest,
  } = useRide();

  const [showVehicles, setShowVehicles] = useState(false);

  useEffect(() => {
    if (location && !origin) {
      selectOrigin(location);
    }
  }, [location, origin, selectOrigin]);

  useEffect(() => {
    if (origin && destination) {
      fetchRoute().then(() => setShowVehicles(true));
    }
  }, [origin, destination]);

  const handleDestinationSelect = useCallback(
    (data, details) => {
      if (!details?.geometry?.location) return;
      selectDestination({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        address: data.description,
      });
    },
    [selectDestination],
  );

  const handleRequestRide = useCallback(async () => {
    if (!selectedVehicle) {
      Alert.alert('Select Vehicle', 'Please select a vehicle type before requesting a ride.');
      return;
    }
    await submitRideRequest();
    navigation.navigate('Tracking');
  }, [selectedVehicle, submitRideRequest, navigation]);

  const selectedVehicleData = VEHICLE_CONFIG.find((v) => v.id === selectedVehicle);
  const selectedFare = fareEstimate?.find((f) => f.vehicleId === selectedVehicle);

  if (locationLoading) {
    return <LoadingSpinner fullScreen message="Getting your location..." />;
  }

  return (
    <View style={styles.container}>
      <RideMap
        origin={origin}
        destination={destination}
        routeCoordinates={routeCoordinates}
        style={styles.map}
      />

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Where to?</Text>

        <GooglePlacesAutocomplete
          placeholder="Search destination"
          onPress={handleDestinationSelect}
          fetchDetails
          query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
          styles={{
            container: styles.autocompleteContainer,
            textInput: styles.autocompleteInput,
            listView: styles.autocompleteList,
          }}
          debounce={300}
          enablePoweredByContainer={false}
        />

        {loading ? (
          <LoadingSpinner message="Calculating route..." size="small" />
        ) : null}

        {showVehicles && fareEstimate ? (
          <ScrollView
            style={styles.vehicleScroll}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Choose vehicle</Text>
            {VEHICLE_CONFIG.map((vehicle) => {
              const fareItem = fareEstimate.find((f) => f.vehicleId === vehicle.id);
              return (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  fare={fareItem?.fare}
                  isSelected={selectedVehicle === vehicle.id}
                  onSelect={selectVehicle}
                />
              );
            })}

            {selectedVehicle ? (
              <FareEstimate
                fare={selectedFare?.fare}
                distanceMeters={distanceMeters}
                durationSeconds={durationSeconds}
                vehicleLabel={selectedVehicleData?.label}
              />
            ) : null}

            <Button
              title="Request Ride"
              onPress={handleRequestRide}
              disabled={!selectedVehicle}
              loading={loading}
              style={styles.requestBtn}
            />
          </ScrollView>
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
    height: '45%',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    marginTop: -theme.borderRadius.xl,
    ...theme.shadow.lg,
  },
  panelTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    marginBottom: theme.spacing.md,
  },
  autocompleteContainer: {
    flex: 0,
    zIndex: 10,
  },
  autocompleteInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.md,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  autocompleteList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  vehicleScroll: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: colors.text,
    marginBottom: theme.spacing.sm,
  },
  requestBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
});

export default RideRequestScreen;
