import { useNavigate } from "react-router-dom";

export default function AIDataProcessing() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f9f7",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#fff",
          padding: 36,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          lineHeight: 1.7,
          color: "#333",
        }}
      >
        <button
          onClick={() => navigate("/login")}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          ← Return to Login
        </button>

        <h1>AI Data Processing Notice</h1>

        <p style={{ color: "#666" }}>
          Last updated: July 2026
        </p>

        <hr />

        <h2>Purpose</h2>

        <p>
          ReCopé uses Artificial Intelligence (AI) to help users discover,
          generate, and improve recipes based on their available ingredients,
          cooking preferences, and recipe requests.
        </p>

        <h2>Information Processed</h2>

        <ul>
          <li>Pantry ingredients you enter.</li>
          <li>Recipe requests.</li>
          <li>Messages you send to the AI assistant.</li>
          <li>Cooking preferences related to your request.</li>
        </ul>

        <h2>How the Information is Used</h2>

        <p>
          Your information is processed only to generate recipe
          recommendations, answer cooking questions, and improve your
          experience while using ReCopé.
        </p>

        <h2>Information You Should NOT Enter</h2>

        <ul>
          <li>Passwords</li>
          <li>Credit card information</li>
          <li>Government-issued IDs</li>
          <li>Medical records</li>
          <li>Highly sensitive personal information</li>
        </ul>

        <h2>Limitations of AI</h2>

        <p>
          AI-generated recipes may occasionally contain inaccurate,
          incomplete, or unsuitable information. Always review recipes before
          cooking and consider allergies, dietary restrictions, and food
          safety.
        </p>

        <h2>Your Consent</h2>

        <p>
          By checking the AI Data Processing consent box during registration,
          you acknowledge that you have read this notice and agree to the
          processing of your recipe-related information for AI-assisted
          features.
        </p>
      </div>
    </div>
  );
}