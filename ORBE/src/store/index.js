import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ride: rideReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'auth/loginUser/fulfilled',
          'auth/registerUser/fulfilled',
          'user/fetchProfile/fulfilled',
          'user/fetchRideHistory/fulfilled',
        ],
        ignoredPaths: [
          'auth.user',
          'user.profile',
          'user.rideHistory',
          'ride.currentRide',
        ],
      },
    }),
});

export default store;
