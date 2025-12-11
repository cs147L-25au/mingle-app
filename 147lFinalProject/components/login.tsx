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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import supabase from "../supabase";

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
      <StatusBar style="light" />
      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            styles.segmentButtonLeft,
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
            styles.segmentButtonRight,
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
      <View style={styles.splash}>
        <MaterialCommunityIcons size={64} name="bee-flower" color={"red"} />
        <Text style={styles.splashText}>Fizz</Text>
      </View>
      <TextInput
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="email@address.com"
        placeholderTextColor={"gray"}
        autoCapitalize={"none"}
        style={styles.input}
      />
      <TextInput
        onChangeText={(text) => setPassword(text)}
        value={password}
        placeholder="Password"
        placeholderTextColor="gray"
        secureTextEntry={true}
        autoCapitalize={"none"}
        textContentType={mode === "signin" ? "password" : "newPassword"}
        autoComplete={mode === "signin" ? "password" : "password-new"}
        style={styles.input}
      />
      {mode === "signup" && (
        <>
          <TextInput
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (passwordError) setPasswordError("");
            }}
            value={confirmPassword}
            placeholder="Confirm Password"
            placeholderTextColor="gray"
            secureTextEntry={true}
            autoCapitalize={"none"}
            textContentType="newPassword"
            autoComplete="password-new"
            style={[
              styles.input,
              passwordError ? styles.inputError : undefined,
            ]}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() =>
            mode === "signin" ? signInWithEmail() : signUpWithEmail()
          }
          disabled={isButtonDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text
              style={[
                styles.button,
                isButtonDisabled ? styles.buttonDisabled : undefined,
              ]}
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    padding: 12,
    backgroundColor: "white",
    flex: 1,
  },
  splash: {
    alignItems: "center",
    marginBottom: 12,
  },
  splashText: {
    fontWeight: "bold",
    color: "black",
    fontSize: 60,
  },
  buttonContainer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  verticallySpaced: {
    marginVertical: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    color: "black",
    backgroundColor: "white",
    width: "100%",
    padding: 16,
  },
  button: {
    color: "purple",
    fontSize: 18,
    fontWeight: "normal",
    padding: 8,
  },
  buttonDisabled: {
    color: "gray",
  },
  segmentedControl: {
    flexDirection: "row",
    marginBottom: 24,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    overflow: "hidden",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  segmentButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#007AFF",
  },
  segmentButtonActive: {
    backgroundColor: "#007AFF",
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  segmentTextActive: {
    color: "#fff",
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
});
