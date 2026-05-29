import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setOrigin,
  setDestination,
  setSelectedVehicle,
  setFareEstimate,
  setRouteData,
  requestRide,
  cancelRide,
  clearRide,
} from '../store/slices/rideSlice';
import { getDirections, estimateAllFares } from '../services/googleMapsService';

const useRide = () => {
  const dispatch = useDispatch();

  const origin = useSelector((state) => state.ride.origin);
  const destination = useSelector((state) => state.ride.destination);
  const selectedVehicle = useSelector((state) => state.ride.selectedVehicle);
  const fareEstimate = useSelector((state) => state.ride.fareEstimate);
  const routeCoordinates = useSelector((state) => state.ride.routeCoordinates);
  const distanceMeters = useSelector((state) => state.ride.distanceMeters);
  const durationSeconds = useSelector((state) => state.ride.durationSeconds);
  const currentRide = useSelector((state) => state.ride.currentRide);
  const rideStatus = useSelector((state) => state.ride.rideStatus);
  const driverLocation = useSelector((state) => state.ride.driverLocation);
  const loading = useSelector((state) => state.ride.loading);
  const error = useSelector((state) => state.ride.error);
  const userId = useSelector((state) => state.auth.user?.uid);

  const selectOrigin = useCallback(
    (coords) => dispatch(setOrigin(coords)),
    [dispatch],
  );

  const selectDestination = useCallback(
    (coords) => dispatch(setDestination(coords)),
    [dispatch],
  );

  const selectVehicle = useCallback(
    (vehicleId) => dispatch(setSelectedVehicle(vehicleId)),
    [dispatch],
  );

  // Receives origin and destination as params to avoid stale closure / infinite loop
  const fetchRoute = useCallback(
    async (originCoords, destinationCoords) => {
      if (!originCoords || !destinationCoords) return;
      try {
        const routeData = await getDirections(originCoords, destinationCoords);
        dispatch(
          setRouteData({
            coordinates: routeData.coordinates,
            distanceMeters: routeData.distanceMeters,
            durationSeconds: routeData.durationSeconds,
          }),
        );
        const fares = estimateAllFares(routeData.distanceMeters, routeData.durationSeconds);
        dispatch(setFareEstimate(fares));
      } catch (err) {
        console.error('Route fetch failed:', err.message);
      }
    },
    [dispatch],
  );

  const submitRideRequest = useCallback(async () => {
    const selectedFare = fareEstimate?.find((f) => f.vehicleId === selectedVehicle);
    const result = await dispatch(
      requestRide({
        userId,
        origin,
        destination,
        vehicleType: selectedVehicle,
        fare: selectedFare?.fare ?? 0,
        distanceMeters,
        durationSeconds,
      }),
    );
    if (requestRide.rejected.match(result)) {
      throw new Error(result.payload || 'Failed to request ride.');
    }
  }, [dispatch, userId, origin, destination, selectedVehicle, fareEstimate, distanceMeters, durationSeconds]);

  const cancelCurrentRide = useCallback(async () => {
    if (currentRide?.id) {
      await dispatch(cancelRide(currentRide.id));
    }
  }, [dispatch, currentRide?.id]);

  const resetRide = useCallback(() => dispatch(clearRide()), [dispatch]);

  return {
    origin,
    destination,
    selectedVehicle,
    fareEstimate,
    routeCoordinates,
    distanceMeters,
    durationSeconds,
    currentRide,
    rideStatus,
    driverLocation,
    loading,
    error,
    selectOrigin,
    selectDestination,
    selectVehicle,
    fetchRoute,
    submitRideRequest,
    cancelCurrentRide,
    resetRide,
  };
};

export default useRide;
