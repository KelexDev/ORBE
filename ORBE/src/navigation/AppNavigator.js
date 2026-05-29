import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore, COLLECTIONS } from '../services/firebase';
import { setUser } from '../store/slices/authSlice';
import { serializeFirestoreData } from '../utils/formatters';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  // Prevents the login screen from flashing before Firebase resolves the auth state
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileRef = doc(firebaseFirestore, COLLECTIONS.USERS, firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          const profile = profileSnap.exists()
            ? serializeFirestoreData(profileSnap.data())
            : {};
          dispatch(
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile }),
          );
        } catch {
          dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email }));
        }
      } else {
        dispatch(setUser(null));
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (initializing) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;