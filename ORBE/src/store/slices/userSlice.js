import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (uid, { rejectWithValue }) => {
    try {
      const doc = await firestore().collection('users').doc(uid).get();
      if (!doc.exists) throw new Error('Profile not found.');
      return { uid, ...doc.data() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ uid, profileData }, { rejectWithValue }) => {
    try {
      await firestore().collection('users').doc(uid).update({
        ...profileData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      return profileData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchRideHistory = createAsyncThunk(
  'user/fetchRideHistory',
  async (uid, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection('rides')
        .where('userId', '==', uid)
        .where('status', '==', 'completed')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    rideHistory: [],
    loading: false,
    historyLoading: false,
    error: null,
  },
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRideHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(fetchRideHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.rideHistory = action.payload;
      })
      .addCase(fetchRideHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
