import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
  mid: "#d0e8dc",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${GREEN.mid}`,
  marginBottom: 12,
  fontSize: 14,
  backgroundColor: GREEN.light,
  outline: "none",
  boxSizing: "border-box",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [aiConsentAccepted, setAiConsentAccepted] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      if (isSignUp) {
  if (!termsAccepted || !privacyAccepted || !aiConsentAccepted) {
    setError(
      "Please accept the Terms and Conditions, Privacy Policy, and AI data-processing consent before creating an account."
    );
    return;
  }

  const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
  emailRedirectTo: `${window.location.origin}/email-verified`,
  data: {
    terms_accepted: true,
    privacy_accepted: true,
    ai_consent_accepted: true,
    consent_date: new Date().toISOString(),
  },
},
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setSuccess(
          "Email verification sent successfully. Please check your inbox."
        );
        return;
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      clearMessages();
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        if (
          resetError.message
            .toLowerCase()
            .includes("email rate limit")
        ) {
          setError(
            "Too many password reset requests. Please wait a few minutes before trying again."
          );
        } else {
          setError(resetError.message);
        }

        return;
      }

      setSuccess(
        "Password reset email sent successfully. Please check your inbox."
      );
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((current) => !current);
    setPassword("");
    setShowPassword(false);
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setAiConsentAccepted(false);
    clearMessages();
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          boxSizing: "border-box",
          backgroundColor: GREEN.light,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#fff",
            padding: 40,
            borderRadius: 16,
            border: `1px solid ${GREEN.mid}`,
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: GREEN.primary,
              textAlign: "center",
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            ReCopé
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#777",
              marginBottom: 25,
              fontSize: 14,
            }}
          >
            Recipe and Pantry Management System
          </p>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <p
            style={{
              color: "#777",
              marginBottom: 20,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {isSignUp
              ? "Create a ReCopé account to manage your pantry and discover recipes."
              : "Sign in to access your ReCopé account."}
          </p>

          {/* Actual errors only */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: "#ffe5e5",
                color: "#b42318",
                border: "1px solid #f5b7b1",
                padding: 10,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* Successful actions */}
          {success && (
            <div
              role="status"
              style={{
                backgroundColor: "#e7f6ec",
                color: "#25633f",
                border: "1px solid #b7dfc8",
                padding: 10,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#444",
              }}
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessages();
              }}
              autoComplete="email"
              required
              disabled={loading}
              style={inputStyle}
            />

            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#444",
              }}
            >
              Password
            </label>

            <div
              style={{
                position: "relative",
                width: "100%",
                marginBottom: 12,
              }}
            >
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearMessages();
                }}
                autoComplete={
                  isSignUp ? "new-password" : "current-password"
                }
                required
                disabled={loading}
                style={{
                  ...inputStyle,
                  marginBottom: 0,
                  paddingRight: 45,
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                {showPassword
  ? FaEyeSlash({ size: 18 })
  : FaEye({ size: 18 })}
              </button>
            </div>

            {isSignUp && (
  <div
    style={{
      marginTop: 16,
      marginBottom: 12,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13,
        color: "#555",
        lineHeight: 1.5,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={termsAccepted}
        onChange={(e) => {
          setTermsAccepted(e.target.checked);
          clearMessages();
        }}
        disabled={loading}
        style={{ marginTop: 3 }}
      />

      <span>
        I have read and agree to the{" "}
        <a
          href="/terms-and-conditions"
          target="_blank"
          rel="noreferrer"
          style={{
            color: GREEN.primary,
            fontWeight: 600,
          }}
        >
          Terms and Conditions
        </a>
        .
      </span>
    </label>

    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13,
        color: "#555",
        lineHeight: 1.5,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={privacyAccepted}
        onChange={(e) => {
          setPrivacyAccepted(e.target.checked);
          clearMessages();
        }}
        disabled={loading}
        style={{ marginTop: 3 }}
      />

      <span>
        I have read and understand the{" "}
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noreferrer"
          style={{
            color: GREEN.primary,
            fontWeight: 600,
          }}
        >
          Privacy Policy
        </a>
        .
      </span>
    </label>

    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13,
        color: "#555",
        lineHeight: 1.5,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={aiConsentAccepted}
        onChange={(e) => {
          setAiConsentAccepted(e.target.checked);
          clearMessages();
        }}
        disabled={loading}
        style={{ marginTop: 3 }}
      />

      <span>
        I agree that my pantry ingredients, recipe requests, and AI messages may
        be processed to provide recipe recommendations. I will not submit
        sensitive personal information.
      </span>
    </label>
  </div>
)}

            {!isSignUp && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: GREEN.primary,
                  fontSize: 13,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginBottom: 10,
                  padding: 0,
                  textAlign: "left",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Forgot password?
              </button>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (isSignUp &&
                  (!termsAccepted || !privacyAccepted || !aiConsentAccepted))
                }
              style={{
                width: "100%",
                padding: 14,
                backgroundColor: GREEN.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 600,
                marginTop: 10,
                cursor:
                loading ||
                (isSignUp &&
                  (!termsAccepted || !privacyAccepted || !aiConsentAccepted))
                  ? "not-allowed"
                  : "pointer",
                fontSize: 15,
                opacity:
                loading ||
                (isSignUp &&
                  (!termsAccepted || !privacyAccepted || !aiConsentAccepted))
                  ? 0.6
                  : 1,
              }}
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create ReCopé Account"
                  : "Sign In to ReCopé"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 14,
              color: "#777",
            }}
          >
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              style={{
                marginLeft: 6,
                background: "none",
                border: "none",
                color: GREEN.primary,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              marginBottom: 0,
              color: "#999",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            ReCopé only uses your account information to provide
            access to its recipe and pantry management features.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          backgroundColor: GREEN.primary,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 60,
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            marginTop: 0,
            marginBottom: 15,
          }}
        >
          Smart Recipe Recommendations
        </h1>

        <p
          style={{
            maxWidth: 500,
            marginTop: 0,
            marginBottom: 24,
            lineHeight: 1.6,
            opacity: 0.9,
          }}
        >
          ReCopé helps users manage pantry ingredients, discover
          appropriate recipes, and reduce avoidable food waste.
        </p>

        <ul
          style={{
            lineHeight: 2,
            fontSize: 16,
            paddingLeft: 20,
          }}
        >
          <li>Match recipes with available ingredients</li>
          <li>Manage pantry contents</li>
          <li>Reduce food waste</li>
          <li>Discover and create recipes</li>
          <li>Plan meals efficiently</li>
        </ul>
      </div>
    </div>
  );
}