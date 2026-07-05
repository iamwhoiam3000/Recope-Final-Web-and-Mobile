import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View, Text, Image } from "react-native";
import { colors } from "../theme";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailsScreen";
import CreateRecipeScreen from "../screens/CreateRecipeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PantryScreen from "../screens/PantryScreen";
import RecipeChat from "../screens/RecipeChat";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: {
          color: colors.primary,
          fontWeight: "800",
          fontSize: 22,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "ReCopé",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Pantry"
        component={PantryScreen}
        options={{
          title: "My Pantry",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🛒</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={HomeTabs} />
              <Stack.Screen
                name="RecipeDetail"
                component={RecipeDetailScreen}
                options={{
                  headerShown: true,
                  title: "Recipe",
                  headerTintColor: colors.primary,
                }}
              />
              <Stack.Screen
                name="CreateRecipe"
                component={CreateRecipeScreen}
                options={{
                  headerShown: true,
                  title: "Create Recipe",
                  headerTintColor: colors.primary,
                }}
              />
              <Stack.Screen
                name="EditRecipe"
                component={CreateRecipeScreen}
                options={{
                  headerShown: true,
                  title: "Edit Recipe",
                  headerTintColor: colors.primary,
                }}
              />
            </>
          )}
        </Stack.Navigator>
        {user && <RecipeChat />}
      </View>
    </NavigationContainer>
  );
}
