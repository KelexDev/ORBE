import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from './firebase';
import { RIDE_STATUS } from '../constants/vehicleTypes';

export const requestRideService = async (rideData) => {
  const rideRef = await firestore().collection(COLLECTIONS.RIDES).add({
    ...rideData,
    status: RIDE_STATUS.SEARCHING,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  const doc = await rideRef.get();
  return { id: doc.id, ...doc.data() };
};

export const cancelRideService = async (rideId) => {
  await firestore()
    .collection(COLLECTIONS.RIDES)
    .doc(rideId)
    .update({ status: RIDE_STATUS.CANCELLED });
};

export const updateRideStatusService = async (rideId, status) => {
  await firestore().collection(COLLECTIONS.RIDES).doc(rideId).update({ status });
};

export const completeRideService = async (rideId, paymentData) => {
  await firestore()
    .collection(COLLECTIONS.RIDES)
    .doc(rideId)
    .update({
      status: RIDE_STATUS.COMPLETED,
      payment: paymentData,
      completedAt: firestore.FieldValue.serverTimestamp(),
    });
};

export const listenToDriverLocation = (rideId, onUpdate) => {
  return firestore()
    .collection(COLLECTIONS.RIDES)
    .doc(rideId)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data.driverLocation) {
          onUpdate(data.driverLocation);
        }
      }
    });
};

export const listenToRideStatus = (rideId, onUpdate) => {
  return firestore()
    .collection(COLLECTIONS.RIDES)
    .doc(rideId)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        onUpdate(data.status);
      }
    });
};

export const savePaymentRecord = async (rideId, paymentData) => {
  await firestore()
    .collection(COLLECTIONS.RIDES)
    .doc(rideId)
    .update({
      payment: {
        ...paymentData,
        paidAt: firestore.FieldValue.serverTimestamp(),
      },
    });
};
