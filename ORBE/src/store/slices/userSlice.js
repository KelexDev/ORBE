import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseFirestore, COLLECTIONS } from '../../services/firebase';

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (uid, { rejectWithValue }) => {
    try {
      const profileRef = doc(firebaseFirestore, COLLECTIONS.USERS, uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) throw new Error('Profile not found.');
      return { uid, ...profileSnap.data() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ uid, profileData }, { rejectWithValue }) => {
    try {
      const profileRef = doc(firebaseFirestore, COLLECTIONS.USERS, uid);
      await updateDoc(profileRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
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
      // Single where clause avoids needing a composite Firestore index.
      // Status filtering and sorting are done client-side.
      const ridesRef = collection(firebaseFirestore, COLLECTIONS.RIDES);
      const q = query(ridesRef, where('userId', '==', uid), limit(100));
      const snapshot = await getDocs(q);

      const rides = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.status === 'completed')
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt ?? 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt ?? 0);
          return dateB - dateA;
        });

      return rides;
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
