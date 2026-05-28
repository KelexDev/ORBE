import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setOrigin,
  setDestination,
  setSelectedVehicle,
  setFareEstimate,
  setRouteData,
  updateDriverLocation,
  updateRideStatus,
  requestRide,
  cancelRide,
  clearRide,
} from '../store/slices/rideSlice';
import { getDirections, estimateAllFares } from '../services/googleMapsService';
import { listenToDriverLocation, listenToRideStatus } from '../services/rideService';

const useRide = () => {
  const dispatch = useDispatch();
  const rideState = useSelector((state) => state.ride);
  const authState = useSelector((state) => state.auth);
  const driverUnsubscribeRef = useRef(null);
  const statusUnsubscribeRef = useRef(null);

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

  const fetchRoute = useCallback(async () => {
    const { origin, destination } = rideState;
    if (!origin || !destination) return;

    try {
      const routeData = await getDirections(origin, destination);
      dispatch(setRouteData({
        coordinates: routeData.coordinates,
        distanceMeters: routeData.distanceMeters,
        durationSeconds: routeData.durationSeconds,
      }));

      const fares = estimateAllFares(routeData.distanceMeters, routeData.durationSeconds);
      dispatch(setFareEstimate(fares));
    } catch (err) {
      console.error('Failed to fetch route:', err.message);
    }
  }, [dispatch, rideState]);

  const submitRideRequest = useCallback(async () => {
    const { origin, destination, selectedVehicle, fareEstimate, distanceMeters, durationSeconds } = rideState;
    const userId = authState.user?.uid;

    const selectedFare = fareEstimate?.find((f) => f.vehicleId === selectedVehicle);

    await dispatch(requestRide({
      userId,
      origin,
      destination,
      vehicleType: selectedVehicle,
      fare: selectedFare?.fare,
      distanceMeters,
      durationSeconds,
    }));
  }, [dispatch, rideState, authState]);

  const cancelCurrentRide = useCallback(async () => {
    const { currentRide } = rideState;
    if (currentRide?.id) {
      await dispatch(cancelRide(currentRide.id));
    }
  }, [dispatch, rideState]);

  const resetRide = useCallback(() => {
    dispatch(clearRide());
  }, [dispatch]);

  useEffect(() => {
    const { currentRide } = rideState;
    if (!currentRide?.id) return;

    driverUnsubscribeRef.current = listenToDriverLocation(currentRide.id, (coords) => {
      dispatch(updateDriverLocation(coords));
    });

    statusUnsubscribeRef.current = listenToRideStatus(currentRide.id, (status) => {
      dispatch(updateRideStatus(status));
    });

    return () => {
      driverUnsubscribeRef.current?.();
      statusUnsubscribeRef.current?.();
    };
  }, [dispatch, rideState.currentRide?.id]);

  return {
    ...rideState,
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
