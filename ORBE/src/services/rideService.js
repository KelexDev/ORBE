import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseFirestore, COLLECTIONS } from './firebase';
import { RIDE_STATUS } from '../constants/vehicleTypes';

export const requestRideService = async (rideData) => {
  const ridesRef = collection(firebaseFirestore, COLLECTIONS.RIDES);
  const rideRef = await addDoc(ridesRef, {
    ...rideData,
    status: RIDE_STATUS.SEARCHING,
    createdAt: serverTimestamp(),
  });
  return { id: rideRef.id, ...rideData, status: RIDE_STATUS.SEARCHING };
};

export const cancelRideService = async (rideId) => {
  const rideRef = doc(firebaseFirestore, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, { status: RIDE_STATUS.CANCELLED });
};

export const updateRideStatusService = async (rideId, status) => {
  const rideRef = doc(firebaseFirestore, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, { status });
};

export const completeRideService = async (rideId, paymentData) => {
  const rideRef = doc(firebaseFirestore, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    status: RIDE_STATUS.COMPLETED,
    payment: paymentData,
    completedAt: serverTimestamp(),
  });
};

export const listenToDriverLocation = (rideId, onUpdate) => {
  const rideRef = doc(firebaseFirestore, COLLECTIONS.RIDES, rideId);
  return onSnapshot(rideRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.driverLocation) {
        onUpdate(data.driverLocation);
      }
    }
  });
};

export const listenToRideStatus = (rideId, onUpdate) => {
  const rideRef = doc(firebaseFirestore, COLLECTIONS.RIDES, rideId);
  return onSnapshot(rideRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onUpdate(data.status);
    }
  });
};

export const savePaymentRecord = async (rideId, paymentData) => {
  const rideRef = doc(firebaseFirestore, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    payment: {
      ...paymentData,
      paidAt: serverTimestamp(),
    },
  });
};
