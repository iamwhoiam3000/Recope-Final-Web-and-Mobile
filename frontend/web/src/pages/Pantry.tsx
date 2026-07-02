import { useEffect, useState } from "react";
import api from "../lib/api";

interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  expiration_date?: string | null; // ISO date string
}

const UNITS = [
  "pcs",
  "g",
  "kg",
  "ml",
  "L",
  "tsp",
  "tbsp",
  "cup",
  "pinch",
  "pack",
  "sachet",
  "bag",
  "box",
  "can",
  "bottle",
  "jar",
  "slice",
  "clove",
  "bunch",
];

// How many days before expiry to warn the user
const EXPIRY_WARNING_DAYS = 3;

function getDaysUntilExpiry(expiration_date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiration_date);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(
  expiration_date?: string | null,
): "expired" | "warning" | "ok" | "none" {
  if (!expiration_date) return "none";
  const days = getDaysUntilExpiry(expiration_date);
  if (days < 0) return "expired";
  if (days <= EXPIRY_WARNING_DAYS) return "warning";
  return "ok";
}

function ExpiryBadge({ expiration_date }: { expiration_date?: string | null }) {
  if (!expiration_date) return null;
  const days = getDaysUntilExpiry(expiration_date);
  const status = getExpiryStatus(expiration_date);

  const styles: Record<string, React.CSSProperties> = {
    expired: {
      fontSize: 12,
      color: "#fff",
      backgroundColor: "#e53935",
      padding: "2px 10px",
      borderRadius: 20,
      fontWeight: 600,
    },
    warning: {
      fontSize: 12,
      color: "#1b4332",
      backgroundColor: "#b7dfc8",
      padding: "2px 10px",
      borderRadius: 20,
      fontWeight: 600,
    },
    ok: {
      fontSize: 12,
      color: "#1b4332",
      backgroundColor: "#d8f3dc",
      padding: "2px 10px",
      borderRadius: 20,
      fontWeight: 500,
    },
  };

  let label = "";
  if (status === "expired") label = "Expired";
  else if (status === "warning")
    label = days === 0 ? "Expires today" : `Expires in ${days}d`;
  else
    label = `Exp: ${new Date(expiration_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return <span style={styles[status]}>{label}</span>;
}

const selectStyle: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #d0e8dc",
  fontSize: 15,
  outline: "none",
  backgroundColor: "#f4faf7",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232d6a4f' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

const inputStyle: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #d0e8dc",
  fontSize: 15,
  outline: "none",
  backgroundColor: "#f4faf7",
};

const dateInputStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  colorScheme: "light",
};

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [expiration_date, setexpiration_date] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    quantity: string;
    unit: string;
    expiration_date: string;
  }>({ name: "", quantity: "", unit: "pcs", expiration_date: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const fetchPantry = async () => {
    const data = await api.get("/api/pantry");
    if (Array.isArray(data)) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPantry();
  }, []);

  // Items needing attention
  const expiredItems = items.filter(
    (i) => getExpiryStatus(i.expiration_date) === "expired",
  );
  const warningItems = items.filter(
    (i) => getExpiryStatus(i.expiration_date) === "warning",
  );
  const alertItems = [...expiredItems, ...warningItems];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setAdding(true);
    const data = await api.post("/api/pantry", {
      name,
      quantity,
      unit,
      expiration_date: expiration_date || null,
    });
    if (!data.error) {
      setItems((prev) => [...prev, data]);
      setName("");
      setQuantity("");
      setUnit("pcs");
      setexpiration_date("");
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/pantry/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleStartEdit = (item: PantryItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity || "",
      unit: item.unit || "pcs",
      expiration_date: item.expiration_date
        ? new Date(item.expiration_date).toISOString().split("T")[0]
        : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", quantity: "", unit: "pcs", expiration_date: "" });
  };

  const handleSaveEdit = async (id: string) => {
    setSavingId(id);
    const payload = {
      ...editForm,
      expiration_date: editForm.expiration_date || null,
    };
    const data = await api.put(`/api/pantry/${id}`, payload);
    if (!data.error) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...payload } : i)),
      );
      setEditingId(null);
    }
    setSavingId(null);
  };

  // Sort: expired first, then warning, then ok, then no date
  const sortedItems = [...items].sort((a, b) => {
    const order = { expired: 0, warning: 1, ok: 2, none: 3 };
    return (
      order[getExpiryStatus(a.expiration_date)] - order[getExpiryStatus(b.expiration_date)]
    );
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          My Pantry
        </h2>
        <p style={{ color: "#999", fontSize: 15 }}>
          Track ingredients you have at home
        </p>
      </div>

      {/* Expiry alert banner */}
      {!dismissedAlert && alertItems.length > 0 && (
        <div
          style={{
            backgroundColor: expiredItems.length > 0 ? "#fff3f3" : "#f0f7f4",
            border: `1px solid ${expiredItems.length > 0 ? "#ffcdd2" : "#b7dfc8"}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, lineHeight: 1.3 }}>
              {expiredItems.length > 0 ? "🚨" : "⚠️"}
            </span>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: expiredItems.length > 0 ? "#b71c1c" : "#1b4332",
                  marginBottom: 4,
                }}
              >
                {expiredItems.length > 0
                  ? `${expiredItems.length} item${expiredItems.length > 1 ? "s" : ""} expired`
                  : ""}
                {expiredItems.length > 0 && warningItems.length > 0
                  ? " · "
                  : ""}
                {warningItems.length > 0
                  ? `${warningItems.length} item${warningItems.length > 1 ? "s" : ""} expiring soon`
                  : ""}
              </p>
              <p style={{ fontSize: 13, color: "#777" }}>
                {alertItems.map((i) => i.name).join(", ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissedAlert(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#aaa",
              fontSize: 18,
              lineHeight: 1,
              padding: "2px 4px",
              flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Add item form */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Add Ingredient
        </h3>
        <form onSubmit={handleAdd}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 130px",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <input
              placeholder="Ingredient name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={selectStyle}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label
                style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap" }}
              >
                Expires on
              </label>
              <input
                type="date"
                value={expiration_date}
                onChange={(e) => setexpiration_date(e.target.value)}
                style={{ ...dateInputStyle, flex: 1 }}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              style={{
                backgroundColor: "#2d6a4f",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 20px",
                fontSize: 15,
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {adding ? "..." : "+ Add"}
            </button>
          </div>
        </form>
      </div>

      {/* Pantry items */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          In My Pantry ({items.length})
        </h3>

        {loading && <p style={{ color: "#999" }}>Loading...</p>}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p style={{ color: "#999", fontSize: 15 }}>Your pantry is empty</p>
            <p style={{ color: "#bbb", fontSize: 13, marginTop: 4 }}>
              Add ingredients you have at home
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedItems.map((item) => {
            const status = getExpiryStatus(item.expiration_date);
            const rowBorder =
              status === "expired"
                ? "1px solid #ffcdd2"
                : status === "warning"
                  ? "1px solid #b7dfc8"
                  : "1px solid #f0f0f0";
            const rowBg =
              status === "expired"
                ? "#fff8f8"
                : status === "warning"
                  ? "#f0f7f4"
                  : "#f4faf7";

            return (
              <div key={item.id}>
                {editingId === item.id ? (
                  // Edit mode
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#eaf4ef",
                      borderRadius: 10,
                      border: "1px solid #95c9b0",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 90px 130px",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        style={inputStyle}
                        placeholder="Ingredient name"
                      />
                      <input
                        value={editForm.quantity}
                        onChange={(e) =>
                          setEditForm({ ...editForm, quantity: e.target.value })
                        }
                        style={inputStyle}
                        placeholder="Qty"
                      />
                      <select
                        value={editForm.unit}
                        onChange={(e) =>
                          setEditForm({ ...editForm, unit: e.target.value })
                        }
                        style={selectStyle}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 13,
                          color: "#888",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Expires on
                      </label>
                      <input
                        type="date"
                        value={editForm.expiration_date}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            expiration_date: e.target.value,
                          })
                        }
                        style={{ ...dateInputStyle, flex: 1 }}
                      />
                      {editForm.expiration_date && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({ ...editForm, expiration_date: "" })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#aaa",
                            fontSize: 18,
                            lineHeight: 1,
                            padding: "2px 4px",
                          }}
                          aria-label="Clear expiry date"
                          title="Remove expiry date"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          border: "1px solid #eee",
                          background: "#fff",
                          padding: "8px 16px",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={savingId === item.id}
                        style={{
                          backgroundColor: "#2d6a4f",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {savingId === item.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      backgroundColor: rowBg,
                      borderRadius: 10,
                      border: rowBorder,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor:
                            status === "expired"
                              ? "#e53935"
                              : status === "warning"
                                ? "#52b788"
                                : "#2d6a4f",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 15, fontWeight: 500 }}>
                        {item.name}
                      </span>
                      {(item.quantity || item.unit) && (
                        <span
                          style={{
                            fontSize: 13,
                            color: "#fff",
                            backgroundColor: "#2d6a4f",
                            padding: "2px 10px",
                            borderRadius: 20,
                            fontWeight: 500,
                          }}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      )}
                      <ExpiryBadge expiration_date={item.expiration_date} />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleStartEdit(item)}
                        style={{
                          background: "none",
                          border: "1px solid #eee",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 13,
                          color: "#666",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: "none",
                          border: "1px solid #ffcdd2",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 13,
                          color: "#e53935",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
