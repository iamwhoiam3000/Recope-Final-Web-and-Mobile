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
          background: "#fff",
          padding: 40,
          borderRadius: 16,
          boxShadow: "0 5px 20px rgba(0,0,0,.08)",
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <h1 style={{ color: GREEN.primary }}>
          ✅ Email Verification Successful!
        </h1>

        <p style={{ marginTop: 15 }}>
          Your email has been verified successfully.
        </p>

        <p>
          You may now close this window and sign in to ReCope.
        </p>
      </div>
    </div>
  );
}