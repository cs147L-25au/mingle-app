// Citation: `components/Login.tsx` provided code from A3
// TODO
import { useState } from "react";
import {
  Text,
  Alert,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import supabase from "../supabase";

// Mingle Brand Colors
const COLORS = {
  background: '#FAF8FC',
  brandPurple: '#8174A0',
  brandPink: '#C599B6',
  textPrimary: '#2D2438',
  textSecondary: '#6B6078',
  textTertiary: '#9B8FA8',
  inputBorder: '#E0D8E8',
  buttonText: '#FFFFFF',
  white: '#FFFFFF',
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const signInWithEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
        // shouldCreateUser is only for OTP/magic link authentication.
        // options: {
        //   shouldCreateUser: false,
        // },
      });

      if (error) {
        Alert.alert(error.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const signUpWithEmail = async () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        Alert.alert("Sign Up Error", error.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        "Success!",
        "Account created successfully. You can now sign in.",
        [{ text: "OK" }]
      );

      setLoading(false);
    } catch (err) {
      console.error("Sign up error:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const isButtonDisabled =
    mode === "signin"
      ? loading || email.length === 0 || password.length === 0
      : loading ||
        email.length === 0 ||
        password.length === 0 ||
        confirmPassword.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Mingle</Text>
        <Text style={styles.tagline}>Connect through activities</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            mode === "signin" && styles.segmentButtonActive,
          ]}
          onPress={() => {
            setMode("signin");
            setConfirmPassword("");
            setPasswordError("");
          }}
        >
          <Text
            style={[
              styles.segmentText,
              mode === "signin" && styles.segmentTextActive,
            ]}
          >
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            mode === "signup" && styles.segmentButtonActive,
          ]}
          onPress={() => {
            setMode("signup");
            setPasswordError("");
          }}
        >
          <Text
            style={[
              styles.segmentText,
              mode === "signup" && styles.segmentTextActive,
            ]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="email@address.com"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            style={styles.input}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <TextInput
            onChangeText={(text) => setPassword(text)}
            value={password}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textTertiary}
            secureTextEntry={true}
            autoCapitalize="none"
            textContentType={mode === "signin" ? "password" : "newPassword"}
            autoComplete={mode === "signin" ? "password" : "password-new"}
            style={styles.input}
          />
        </View>

        {/* Confirm Password Input (Sign Up Only) */}
        {mode === "signup" && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (passwordError) setPasswordError("");
                }}
                value={confirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={true}
                autoCapitalize="none"
                textContentType="newPassword"
                autoComplete="password-new"
                style={[
                  styles.input,
                  passwordError ? styles.inputError : undefined,
                ]}
              />
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() =>
          mode === "signin" ? signInWithEmail() : signUpWithEmail()
        }
        disabled={isButtonDisabled}
        style={[
          styles.button,
          isButtonDisabled && styles.buttonDisabled,
        ]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Footer Toggle */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {mode === "signin"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Text
            style={styles.footerLink}
            onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setConfirmPassword("");
              setPasswordError("");
            }}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 24,
  },

  // Header
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 16,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    letterSpacing: -1,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.brandPurple,
    textAlign: 'center',
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.brandPurple,
    overflow: 'hidden',
    marginBottom: 32,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.brandPurple,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.brandPurple,
  },
  segmentTextActive: {
    color: COLORS.white,
  },

  // Form
  formSection: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.inputBorder,
  },
  inputError: {
    borderBottomColor: '#D14343',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#D14343',
    marginTop: -16,
    marginBottom: 16,
  },

  // Button
  button: {
    backgroundColor: COLORS.brandPurple,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#E0D8E8',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.5,
    fontWeight: '500',
    color: COLORS.buttonText,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: COLORS.brandPurple,
  },
});
