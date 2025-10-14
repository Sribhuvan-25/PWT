import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import SessionsScreen from '../screens/SessionsScreen';
import SessionDetailsScreen from '../screens/SessionDetailsScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { darkColors } from '../utils/theme';
import { useAuthStore } from '../stores/authStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const SessionsStack = createStackNavigator();

function SessionsNavigator() {
  return (
    <SessionsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: darkColors.card,
        },
        headerTintColor: darkColors.textPrimary,
      }}
    >
      <SessionsStack.Screen 
        name="SessionsList" 
        component={SessionsScreen}
        options={{ title: 'Sessions' }}
      />
      <SessionsStack.Screen 
        name="SessionDetails" 
        component={SessionDetailsScreen}
        options={{ title: 'Session Details' }}
      />
    </SessionsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Sessions') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: darkColors.accent,
        tabBarInactiveTintColor: darkColors.textMuted,
        tabBarStyle: {
          backgroundColor: darkColors.card,
          borderTopColor: darkColors.border,
        },
        headerStyle: {
          backgroundColor: darkColors.card,
        },
        headerTintColor: darkColors.textPrimary,
      })}
    >
      <Tab.Screen 
        name="Sessions" 
        component={SessionsNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user } = useAuthStore();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: darkColors.accent,
          background: darkColors.background,
          card: darkColors.card,
          text: darkColors.textPrimary,
          border: darkColors.border,
          notification: darkColors.accent,
        },
        fonts: {
          regular: {
            fontFamily: 'Inter_400Regular',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'Inter_500Medium',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'Inter_700Bold',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'Inter_700Bold',
            fontWeight: '700',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: darkColors.card,
          },
          headerTintColor: darkColors.textPrimary,
        }}
      >
        {/* TEMPORARY: Always show main app for testing */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        {/* Commented out login for now
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
