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

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "UserProfile" : "Login"}
      screenOptions={{
        headerShown: true,
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{ title: 'Profile', headerLeft: null }}
      />
      <Stack.Screen
        name="CustomerOrders"
        component={CustomerOrderScreen}
        options={{ title: 'My Orders' }}
      />
      <Stack.Screen
        name="StaffOrders"
        component={StaffOrderScreen}
        options={{ title: 'Manage Orders' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
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
