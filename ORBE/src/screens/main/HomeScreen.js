import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import useLocation from '../../hooks/useLocation';

const { width: W, height: H } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 10.4806,
  longitude: -66.9036,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Uber warm beige map style
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f2e8dc' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#716e5e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f2e8dc' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f0e8d8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8dcc8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b2ccd6' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d8e8d0' }] },
  { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
];

const RECENT_PLACES = [
  { id: '1', name: 'Home', address: 'Av. Principal 123', type: 'home' },
  { id: '2', name: 'Work', address: 'Torre Empresarial, piso 8', type: 'work' },
  { id: '3', name: 'El Hatillo', address: 'Caracas, Miranda', type: 'clock' },
];

const HomeScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const { user } = useSelector((s) => s.auth);

  const initial = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  useEffect(() => {
    if (location) {
      mapRef.current?.animateToRegion(
        { ...location, latitudeDelta: 0.012, longitudeDelta: 0.012 },
        800,
      );
    }
  }, [location]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Full-screen map with warm Uber tint */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled>
        {location ? (
          <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.locationMarker}>
              <View style={styles.locationMarkerInner} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      {/* Top semi-transparent pill overlay */}
      <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8}>
          <Icon name="menu" size={22} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.8}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom card floating over map */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 8 }]}>

        {/* "Where to?" row — black pill left + calendar/clock circles right */}
        <View style={styles.whereToRow}>
          <TouchableOpacity
            style={styles.whereToBtn}
            onPress={() => navigation.navigate('Ride')}
            activeOpacity={0.9}>
            <Icon name="magnify" size={20} color="#FFFFFF" style={styles.searchIcon} />
            <Text style={styles.whereToText}>Where to?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.8}>
            <Icon name="calendar-month-outline" size={18} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.8}>
            <Icon name="clock-outline" size={18} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Quick chips: Home / Work / +Add */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => navigation.navigate('Ride')}
            activeOpacity={0.8}>
            <Icon name="home-outline" size={15} color="#000000" />
            <Text style={styles.chipText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => navigation.navigate('Ride')}
            activeOpacity={0.8}>
            <Icon name="briefcase-outline" size={15} color="#000000" />
            <Text style={styles.chipText}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} activeOpacity={0.8}>
            <Icon name="plus" size={15} color="#000000" />
            <Text style={styles.chipText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal recent places scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentScroll}>
          {RECENT_PLACES.map((place, idx) => (
            <View key={place.id} style={styles.recentItemWrap}>
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => navigation.navigate('Ride')}
                activeOpacity={0.8}>
                <View style={styles.recentIconCircle}>
                  <Icon
                    name={
                      place.type === 'home'
                        ? 'home'
                        : place.type === 'work'
                        ? 'briefcase'
                        : 'clock-outline'
                    }
                    size={15}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.recentTexts}>
                  <Text style={styles.recentName} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.recentAddress} numberOfLines={1}>{place.address}</Text>
                </View>
                <Icon name="chevron-right" size={15} color="#999999" />
              </TouchableOpacity>
              {idx < RECENT_PLACES.length - 1 && <View style={styles.recentSep} />}
            </View>
          ))}
        </ScrollView>

        {/* Promo banner */}
        <TouchableOpacity style={styles.promoBanner} activeOpacity={0.9}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Save on your next ride</Text>
            <Text style={styles.promoSub}>Use promo code UBER20 · 20% off</Text>
          </View>
          <Icon name="chevron-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>

      </View>
    </View>
  );
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
  // Custom location dot: 14px blue circle, 3px white ring, shadow
  locationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#276EF1',
  },
  // Top overlay pill
  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {},
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Bottom floating card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  // Where to row
  whereToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  whereToBtn: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchIcon: {},
  whereToText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  iconCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chips row
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  // Recent places horizontal scroll
  recentScroll: {
    paddingRight: 16,
  },
  recentItemWrap: {
    width: 200,
    marginRight: 0,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  recentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentTexts: {
    flex: 1,
  },
  recentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  recentAddress: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },
  recentSep: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginLeft: 46,
  },
  // Promo banner
  promoBanner: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promoSub: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
});

export default HomeScreen;
