import { GOOGLE_MAPS_API_KEY } from '@env';
import { VEHICLE_CONFIG } from '../constants/vehicleTypes';

export const getDirections = async (originCoords, destinationCoords) => {
  const origin = `${originCoords.latitude},${originCoords.longitude}`;
  const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.routes.length) {
    throw new Error('Unable to fetch route. Please try again.');
  }

  const route = data.routes[0];
  const leg = route.legs[0];
  const encodedPolyline = route.overview_polyline.points;

  return {
    coordinates: decodePolyline(encodedPolyline),
    distanceMeters: leg.distance.value,
    durationSeconds: leg.duration.value,
    distanceText: leg.distance.text,
    durationText: leg.duration.text,
    startAddress: leg.start_address,
    endAddress: leg.end_address,
  };
};

export const getDistanceMatrix = async (originCoords, destinationCoords) => {
  const origins = `${originCoords.latitude},${originCoords.longitude}`;
  const destinations = `${destinationCoords.latitude},${destinationCoords.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error('Unable to calculate distance.');
  }

  const element = data.rows[0].elements[0];
  if (element.status !== 'OK') {
    throw new Error('Route between locations not found.');
  }

  return {
    distanceMeters: element.distance.value,
    durationSeconds: element.duration.value,
    distanceText: element.distance.text,
    durationText: element.duration.text,
  };
};

export const estimateFare = (distanceMeters, durationSeconds, vehicleTypeId) => {
  const vehicle = VEHICLE_CONFIG.find((v) => v.id === vehicleTypeId);
  if (!vehicle) throw new Error('Unknown vehicle type.');

  const distanceKm = distanceMeters / 1000;
  const durationMin = durationSeconds / 60;
  const fare = vehicle.baseFare + distanceKm * vehicle.perKmRate + durationMin * vehicle.perMinRate;

  return Math.max(fare, vehicle.baseFare);
};

export const estimateAllFares = (distanceMeters, durationSeconds) => {
  return VEHICLE_CONFIG.map((vehicle) => ({
    vehicleId: vehicle.id,
    fare: estimateFare(distanceMeters, durationSeconds, vehicle.id),
  }));
};

const decodePolyline = (encoded) => {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;
    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
};
