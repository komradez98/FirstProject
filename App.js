import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/context/ThemeContext';
import { useAuth } from './src/store';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import UserProfile from './src/screens/UserProfile';
import CustomerOrderScreen from './src/screens/CustomerOrderScreen';
import StaffOrderScreen from './src/screens/StaffOrderScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import CreateOrderScreen from './src/screens/CreateOrderScreen';
import HomeScreen from './src/screens/HomeScreen';
import RemoteScreen from './src/screens/RemoteScreen';
import MusicPlayerScreen from './src/screens/MusicPlayerScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Home" : "Login"}
      screenOptions={{
        headerShown: false,  // This hides headers on all screens
        headerStyle: {
          backgroundColor: '#436b88', // Use your app's primary color
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
      />
      <Stack.Screen
        name="CustomerOrders"
        component={CustomerOrderScreen}
      />
      <Stack.Screen
        name="StaffOrders"
        component={StaffOrderScreen}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
      />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
      />
      <Stack.Screen
        name="Remote"
        component={RemoteScreen}
      />
      <Stack.Screen
        name="MusicPlayer"
        component={MusicPlayerScreen}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
