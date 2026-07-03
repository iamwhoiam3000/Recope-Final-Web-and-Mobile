import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const WEB_URL = "https://recope-final-web-and-mobile.vercel.app";

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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  if (isSignUp) {
    const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/email-verified`,
  },
});

    if (error) {
      setError(error.message);
    } else {
      setError("Email Verification Sent! Please check your inbox.");
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
  setError(error.message);
} else if (isSignUp) {
  setError("Email Verification Sent! Please check your inbox.");
} else {
  setError("");
}
  }

  setLoading(false);
};

  const handleForgotPassword = async () => {
  if (!email) {
    setError("Please enter your email address first.");
    return;
  }

  setLoading(true);
  setError("");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});

if (error) {
  if (error.message.toLowerCase().includes("email rate limit")) {
    setError(
      "Too many password reset requests. Please wait a few minutes before trying again."
    );
  } else {
    setError(error.message);
  }
} else {
  setError("Password reset email sent. Please check your inbox.");
}

  setLoading(false);
};

  return (
    <div
  style={{
  display: "flex",
  height: "100vh",
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
            width: 380,
            backgroundColor: "#fff",
            padding: 40,
            borderRadius: 16,
            border: `1px solid ${GREEN.mid}`,
          }}
        >
          {/* Logo */}
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: GREEN.primary,
              textAlign: "center",
              marginBottom: 5,
            }}
          >
            RéCope
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#999",
              marginBottom: 25,
              fontSize: 14,
            }}
          >
            Reduce food waste, one recipe at a time
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 5 }}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <p style={{ color: "#777", marginBottom: 20, fontSize: 14 }}>
            {isSignUp
              ? "Sign up to start generating recipes"
              : "Sign in to continue"}
          </p>

          {error && (
            <div
              style={{
                background: "#ffe5e5",
                color: "#d32f2f",
                padding: 10,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />

            <div
  style={{
    position: "relative",
    width: "100%",
    marginBottom: 12,
  }}
>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    style={{
      ...inputStyle,
      marginBottom: 0,
      paddingRight: 45,
    }}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
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
    {showPassword ? FaEyeSlash({ size: 18 }) : FaEye({ size: 18 })}
  </button>
</div>

<button
  type="button"
  onClick={handleForgotPassword}
  style={{
    background: "none",
    border: "none",
    color: GREEN.primary,
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 10,
    padding: 0,
    textAlign: "left",
  }}
>
  Forgot password?
</button>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 14,
                backgroundColor: GREEN.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 600,
                marginTop: 10,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 14,
              color: "#999",
            }}
          >

            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                marginLeft: 6,
                background: "none",
                border: "none",
                color: GREEN.primary,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          height: "100%",
          backgroundColor: GREEN.primary,
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <h1 style={{ fontSize: 32, marginBottom: 30 }}>
          Smart Recipe Recommendations
        </h1>
        <ul style={{ lineHeight: "2", fontSize: 16 }}>
          <li>✔ Match recipes with available ingredients</li>
          <li>✔ Reduce food waste</li>
          <li>✔ Discover new dishes</li>
          <li>✔ Plan meals efficiently</li>
        </ul>
      </div>
    </div>
  );
}
