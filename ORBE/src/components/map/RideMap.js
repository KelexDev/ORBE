import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import colors from '../../constants/colors';

const INITIAL_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

const RideMap = ({
  origin,
  destination,
  driverLocation,
  routeCoordinates = [],
  style,
  children,
}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      if (origin && destination) {
        mapRef.current.fitToCoordinates([origin, destination], {
          edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
          animated: true,
        });
      } else if (origin) {
        mapRef.current.animateToRegion({ ...origin, ...INITIAL_DELTA }, 600);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [origin, destination]);

  const initialRegion = origin
    ? { ...origin, ...INITIAL_DELTA }
    : { latitude: 10.4806, longitude: -66.9036, ...INITIAL_DELTA };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
        loadingIndicatorColor={colors.accent}
        loadingBackgroundColor={colors.mapFallback}>
        {origin ? (
          <Marker coordinate={origin} title="Pickup" pinColor={colors.success} />
        ) : null}
        {destination ? (
          <Marker coordinate={destination} title="Destination" pinColor={colors.accent} />
        ) : null}
        {driverLocation ? (
          <Marker coordinate={driverLocation} title="Driver" pinColor={colors.primary} />
        ) : null}
        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        ) : null}
      </MapView>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RideMap;
