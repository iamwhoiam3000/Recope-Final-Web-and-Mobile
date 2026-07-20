import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookieConsent");

    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 9999,
      }}
    >
      <h3 style={{ marginTop: 0 }}>🍪 Cookie Notice</h3>

      <p style={{ marginBottom: 16 }}>
        ReCopé uses cookies and browser storage to keep you signed in, remember
        your preferences, and improve your experience. By continuing to use
        ReCopé, you agree to our use of cookies as described in our Privacy
        Policy.
      </p>

      <button
        onClick={acceptCookies}
        style={{
          background: "#2E7D32",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Accept
      </button>
    </div>
  );
}