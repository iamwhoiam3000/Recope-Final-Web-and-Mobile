import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
  mid: "#d0e8dc",
};

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully. You can now sign in.");
    }

    setLoading(false);
  };

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: GREEN.light,
      fontFamily: "sans-serif",
    }}
  >
    <form
      onSubmit={handleReset}
      style={{
        width: 420,
        background: "#fff",
        padding: 40,
        borderRadius: 18,
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: "none",
        }}
      >
        <h1
  onClick={() => {
    window.location.href = "/";
  }}
  style={{
    color: GREEN.primary,
    fontSize: 36,
    fontWeight: 800,
    marginBottom: 30,
    cursor: "pointer",
  }}
>
  ReCope
</h1>
      </Link>

      <h2
        style={{
          textAlign: "center",
          color: GREEN.primary,
          marginBottom: 25,
        }}
      >
        Reset Password
      </h2>

      {message && (
        <p
          style={{
            textAlign: "center",
            marginBottom: 15,
            color: GREEN.primary,
          }}
        >
          {message}
        </p>
      )}

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: `1px solid ${GREEN.mid}`,
          marginBottom: 20,
        }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: GREEN.primary,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontWeight: 600,
        }}
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  </div>
);
}
