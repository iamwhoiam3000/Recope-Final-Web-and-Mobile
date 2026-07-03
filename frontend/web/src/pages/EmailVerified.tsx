import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
};

export default function EmailVerified() {
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
      <div
        style={{
          textAlign: "center",
          background: "#fff",
          padding: "50px 60px",
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
            color: GREEN.primary,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          Email Verification Successful!
        </h2>
      </div>
    </div>
  );
}