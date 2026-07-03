const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
};

export default function EmailUpdated() {
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
          padding: "50px 60px",
          borderRadius: 18,
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          textAlign: "center",
          maxWidth: 500,
        }}
      >
        <h1 style={{ color: GREEN.primary, fontSize: 36, fontWeight: 800, marginBottom: 30 }}>
          ReCope
        </h1>

        <h2 style={{ color: GREEN.primary, marginBottom: 15 }}>
          Email Updated Successfully!
        </h2>

        <p style={{ color: "#666", fontSize: 15 }}>
          Your email has been updated successfully.
        </p>
      </div>
    </div>
  );
}