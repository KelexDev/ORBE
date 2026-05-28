import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RideRequestScreen from '../screens/main/RideRequestScreen';
import TrackingScreen from '../screens/main/TrackingScreen';
import PaymentScreen from '../screens/main/PaymentScreen';
import RideHistoryScreen from '../screens/main/RideHistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import colors from '../constants/colors';
import theme from '../constants/theme';

const Tab = createBottomTabNavigator();

const tabIcon = (icon) =>
  function TabIcon({ color, size }) {
    return <Text style={{ fontSize: size, color }}>{icon}</Text>;
  };

const MainNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Ride"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium,
        },
      }}>
      <Tab.Screen
        name="Ride"
        component={RideRequestScreen}
        options={{
          tabBarLabel: 'Ride',
          tabBarIcon: tabIcon('🗺️'),
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{
          tabBarLabel: 'Track',
          tabBarIcon: tabIcon('📍'),
        }}
      />
      <Tab.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          tabBarLabel: 'Payment',
          tabBarIcon: tabIcon('💳'),
        }}
      />
      <Tab.Screen
        name="History"
        component={RideHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: tabIcon('📋'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: tabIcon('👤'),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
