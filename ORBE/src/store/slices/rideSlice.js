import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { requestRideService, cancelRideService } from '../../services/rideService';
import { RIDE_STATUS } from '../../constants/vehicleTypes';

export const requestRide = createAsyncThunk(
  'ride/requestRide',
  async (rideData, { rejectWithValue }) => {
    try {
      const ride = await requestRideService(rideData);
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const cancelRide = createAsyncThunk(
  'ride/cancelRide',
  async (rideId, { rejectWithValue }) => {
    try {
      await cancelRideService(rideId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const rideSlice = createSlice({
  name: 'ride',
  initialState: {
    currentRide: null,
    origin: null,
    destination: null,
    selectedVehicle: null,
    fareEstimate: null,
    routeCoordinates: [],
    distanceMeters: 0,
    durationSeconds: 0,
    driverLocation: null,
    rideStatus: RIDE_STATUS.IDLE,
    loading: false,
    error: null,
  },
  reducers: {
    setOrigin(state, action) {
      state.origin = action.payload;
    },
    setDestination(state, action) {
      state.destination = action.payload;
    },
    setSelectedVehicle(state, action) {
      state.selectedVehicle = action.payload;
    },
    setFareEstimate(state, action) {
      state.fareEstimate = action.payload;
    },
    setRouteData(state, action) {
      const { coordinates, distanceMeters, durationSeconds } = action.payload;
      state.routeCoordinates = coordinates;
      state.distanceMeters = distanceMeters;
      state.durationSeconds = durationSeconds;
    },
    updateDriverLocation(state, action) {
      state.driverLocation = action.payload;
    },
    updateRideStatus(state, action) {
      state.rideStatus = action.payload;
    },
    clearRide(state) {
      state.currentRide = null;
      state.origin = null;
      state.destination = null;
      state.selectedVehicle = null;
      state.fareEstimate = null;
      state.routeCoordinates = [];
      state.distanceMeters = 0;
      state.durationSeconds = 0;
      state.driverLocation = null;
      state.rideStatus = RIDE_STATUS.IDLE;
      state.error = null;
    },
    clearRideError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestRide.pending, (state) => {
        state.loading = true;
        state.rideStatus = RIDE_STATUS.SEARCHING;
        state.error = null;
      })
      .addCase(requestRide.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRide = action.payload;
        state.rideStatus = RIDE_STATUS.DRIVER_FOUND;
      })
      .addCase(requestRide.rejected, (state, action) => {
        state.loading = false;
        state.rideStatus = RIDE_STATUS.IDLE;
        state.error = action.payload;
      })
      .addCase(cancelRide.fulfilled, (state) => {
        state.rideStatus = RIDE_STATUS.CANCELLED;
        state.currentRide = null;
      });
  },
});

export const {
  setOrigin,
  setDestination,
  setSelectedVehicle,
  setFareEstimate,
  setRouteData,
  updateDriverLocation,
  updateRideStatus,
  clearRide,
  clearRideError,
} = rideSlice.actions;

export default rideSlice.reducer;
