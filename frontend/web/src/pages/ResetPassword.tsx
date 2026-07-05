import { useState } from "react";
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
      setMessage("success");
    }

    setLoading(false);
  };

  if (message === "success") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: GREEN.light, fontFamily: "sans-serif" }}>
        <div style={{ background: "#fff", padding: "50px 60px", borderRadius: 18, boxShadow: "0 8px 25px rgba(0,0,0,0.08)", textAlign: "center", maxWidth: 500 }}>
          <h1 style={{ color: GREEN.primary, fontSize: 36, fontWeight: 800, marginBottom: 30 }}>ReCopé</h1>
          <h2 style={{ color: GREEN.primary, marginBottom: 15 }}>Password Updated Successfully!</h2>
          <p style={{ color: "#666", fontSize: 15 }}>You can now sign in with your new password.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: GREEN.light }}>
      <form onSubmit={handleReset} style={{ width: 360, background: "#fff", padding: 32, borderRadius: 16, border: `1px solid ${GREEN.mid}` }}>
        <h1 style={{ color: GREEN.primary, fontSize: 36, fontWeight: 800, marginBottom: 30, textAlign: "center" }}>ReCopé</h1>
        <h2 style={{ color: GREEN.primary, textAlign: "center", marginBottom: 20 }}>Reset Password</h2>

        {message && <p style={{ marginBottom: 12, color: "#d32f2f", textAlign: "center" }}>{message}</p>}

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
            marginBottom: 16,
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
          }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}