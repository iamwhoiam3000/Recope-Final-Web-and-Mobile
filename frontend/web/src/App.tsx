import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import api from "./lib/api";
import Login from "./pages/Login";
import Home from "./pages/Home";
import RecipeDetail from "./pages/RecipeDetails";
import CreateRecipe from "./pages/CreateRecipe";
import EditRecipe from "./pages/EditRecipe";
import Profile from "./pages/Profile";
import Pantry from "./pages/Pantry";
import RecipeChat from "./pages/RecipeChat";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";

function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
  const fetchProfile = async () => {
    const data = await api.get("/api/profile");
    if (!data.error) setProfile(data);
  };

  fetchProfile();

  window.addEventListener("profile-updated", fetchProfile);

  return () => {
    window.removeEventListener("profile-updated", fetchProfile);
  };
}, [user]);

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0];

  return (
    <nav
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #eee",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 64,
        }}
      >
        <h1
          onClick={() => navigate("/")}
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#2d6a4f",
            cursor: "pointer",
            letterSpacing: "-0.5px",
          }}
        >
          ReCope
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 14,
              color: "#666",
              cursor: "pointer",
            }}
          >
            Home
          </button>

          <button
            onClick={() => navigate("/pantry")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 14,
              color: "#666",
              cursor: "pointer",
            }}
          >
            🛒 Pantry
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              style={{
                background: "none",
                border: "1px solid #eee",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 14,
                color: "#666",
                cursor: "pointer",
              }}
            >
              📊 Admin
            </button>
          )}

          <button
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "1px solid #eee",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 14,
              color: "#444",
              cursor: "pointer",
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#eaf4ef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#2d6a4f",
                }}
              >
                {displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            {displayName}
          </button>

          <button
            onClick={() => navigate("/create")}
            style={{
              backgroundColor: "#2d6a4f",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Create
          </button>

          <button
            onClick={signOut}
            style={{
              background: "none",
              border: "1px solid #eee",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 14,
              color: "#999",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/edit/:id" element={<EditRecipe />} />
          <Route path="/create" element={<CreateRecipe />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
      <RecipeChat />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
