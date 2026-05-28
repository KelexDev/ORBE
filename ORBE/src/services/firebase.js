import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const firebaseAuth = auth;
export const firebaseFirestore = firestore;

export const COLLECTIONS = {
  USERS: 'users',
  RIDES: 'rides',
  DRIVERS: 'drivers',
};
