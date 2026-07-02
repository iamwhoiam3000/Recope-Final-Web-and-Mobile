import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../themes";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Please fill in all fields");
    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) Alert.alert("Error", error.message);
    setLoading(false);
  };

  const handleForgotPassword = async () => {
  if (!email) {
    Alert.alert("Email required", "Please enter your email address first.");
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(email);

if (error) {
  if (error.message.toLowerCase().includes("email rate limit")) {
    Alert.alert(
      "Please wait",
      "You've requested password resets too many times. Please wait a few minutes before trying again."
    );
  } else {
    Alert.alert("Error", error.message);
  }
} else {
  Alert.alert(
    "Password reset sent",
    "Please check your email for the reset password link."
  );
}

  setLoading(false);
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Recope</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    placeholder="Password"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    autoCapitalize="none"
  />

  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={styles.eyeButton}
  >
    <Ionicons
      name={showPassword ? "eye-off" : "eye"}
      size={22}
      color="#666"
    />
  </TouchableOpacity>
</View>

<TouchableOpacity
  onPress={handleForgotPassword}
  disabled={loading}
  style={styles.forgotPasswordContainer}
>
  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
</TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "Create account" : "Sign in"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={styles.switchLink}>
              {isSignUp ? "Sign in" : "Sign up"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 10,
  backgroundColor: colors.background,
  marginBottom: 12,
},

passwordInput: {
  flex: 1,
  padding: 12,
  color: colors.textPrimary,
  fontSize: 15,
},

eyeButton: {
  paddingHorizontal: 12,
},

forgotPasswordContainer: {
  width: "100%",
  alignItems: "flex-start",
  marginBottom: 16,
},

  forgotPasswordText: {
    color: colors.primary,
    fontSize: 13,
    textAlign: "right",
    marginBottom: 14,
    fontWeight: "600",
  },
  
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  switchText: { textAlign: "center", fontSize: 14, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: "600" },
});
