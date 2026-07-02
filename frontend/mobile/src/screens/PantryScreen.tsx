import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import api from "../lib/api";
import { colors } from "../theme";

interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  expiration_date?: string | null;
}

const UNITS = [
  "pcs",
  "kg",
  "g",
  "L",
  "ml",
  "cup",
  "tbsp",
  "tsp",
  "pack",
  "bag",
  "can",
  "bottle",
];

const EXPIRY_WARNING_DAYS = 3;

function getDaysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(
  expiresAt?: string | null,
): "expired" | "warning" | "ok" | "none" {
  if (!expiresAt) return "none";
  const days = getDaysUntilExpiry(expiresAt);
  if (days < 0) return "expired";
  if (days <= EXPIRY_WARNING_DAYS) return "warning";
  return "ok";
}

function ExpiryBadge({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt) return null;
  const days = getDaysUntilExpiry(expiresAt);
  const status = getExpiryStatus(expiresAt);

  let label = "";
  if (status === "expired") label = "Expired";
  else if (status === "warning")
    label = days === 0 ? "Expires today" : `Expires in ${days}d`;
  else
    label = `Exp: ${new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const badgeStyle =
    status === "expired"
      ? styles.badgeExpired
      : status === "warning"
        ? styles.badgeWarning
        : styles.badgeOk;

  const textStyle =
    status === "expired"
      ? styles.badgeExpiredText
      : status === "warning"
        ? styles.badgeWarningText
        : styles.badgeOkText;

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "",
    unit: "pcs",
    expiresAt: null as Date | null,
  });
  const [showEditPicker, setShowEditPicker] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const fetchPantry = async () => {
    const data = await api.get("/api/pantry");
    if (Array.isArray(data)) setItems(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPantry();
    }, []),
  );

  const expiredItems = items.filter(
    (i) => getExpiryStatus(i.expiration_date) === "expired",
  );
  const warningItems = items.filter(
    (i) => getExpiryStatus(i.expiration_date) === "warning",
  );
  const alertItems = [...expiredItems, ...warningItems];

  const sortedItems = [...items].sort((a, b) => {
    const order = { expired: 0, warning: 1, ok: 2, none: 3 };
    return (
      order[getExpiryStatus(a.expiration_date)] - order[getExpiryStatus(b.expiration_date)]
    );
  });

  const handleAdd = async () => {
    if (!name) return Alert.alert("Error", "Please enter an ingredient name");
    setAdding(true);
    const data = await api.post("/api/pantry", {
      name,
      quantity,
      unit,
      expiration_date: expiresAt ? expiresAt.toISOString().split("T")[0] : null,
    });
    if (!data.error) {
      setItems((prev) => [...prev, data]);
      setName("");
      setQuantity("");
      setUnit("pcs");
      setExpiresAt(null);
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete", "Remove this item from your pantry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.remove(`/api/pantry/${id}`);
          setItems((prev) => prev.filter((i) => i.id !== id));
        },
      },
    ]);
  };

  const handleStartEdit = (item: PantryItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity || "",
      unit: item.unit || "pcs",
      expiresAt: item.expiration_date ? new Date(item.expiration_date) : null,
    });
  };

  const handleSaveEdit = async (id: string) => {
    setSavingId(id);
    const payload = {
      name: editForm.name,
      quantity: editForm.quantity,
      unit: editForm.unit,
      expiration_date: editForm.expiresAt
  ? editForm.expiresAt.toISOString().split("T")[0]
  : null,
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

  if (loading)
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
        color={colors.primary}
      />
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            {/* Expiry alert banner */}
            {!dismissedAlert && alertItems.length > 0 && (
              <View
                style={[
                  styles.alertBanner,
                  expiredItems.length > 0
                    ? styles.alertBannerDanger
                    : styles.alertBannerWarning,
                ]}
              >
                <View style={styles.alertContent}>
                  <Text style={styles.alertIcon}>
                    {expiredItems.length > 0 ? "🚨" : "⚠️"}
                  </Text>
                  <View>
                    <Text
                      style={[
                        styles.alertTitle,
                        expiredItems.length > 0
                          ? styles.alertTitleDanger
                          : styles.alertTitleWarning,
                      ]}
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
                    </Text>
                    <Text style={styles.alertNames}>
                      {alertItems.map((i) => i.name).join(", ")}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setDismissedAlert(true)}>
                  <Text style={styles.alertDismiss}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add form */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Add Ingredient</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingredient name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Qty"
                  placeholderTextColor={colors.textMuted}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={unit}
                    onValueChange={setUnit}
                    style={styles.picker}
                  >
                    {UNITS.map((u) => (
                      <Picker.Item key={u} label={u} value={u} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Expiry date */}
              <View style={styles.expiryRow}>
                <Text style={styles.expiryLabel}>Expires on</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowAddPicker(true)}
                >
                  <Text
                    style={
                      expiresAt ? styles.dateBtnText : styles.dateBtnPlaceholder
                    }
                  >
                    {expiresAt
                      ? expiresAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Set date"}
                  </Text>
                </TouchableOpacity>
                {expiresAt && (
                  <TouchableOpacity onPress={() => setExpiresAt(null)}>
                    <Text style={styles.clearDate}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showAddPicker && (
                <DateTimePicker
                  value={expiresAt || new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowAddPicker(false);
                    if (date) setExpiresAt(date);
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.addBtnText}>+ Add to Pantry</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.listTitle}>In My Pantry ({items.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your pantry is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add ingredients you have at home
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getExpiryStatus(item.expiration_date);
          const cardStyle =
            status === "expired"
              ? styles.itemCardExpired
              : status === "warning"
                ? styles.itemCardWarning
                : styles.itemCard;

          return (
            <View style={cardStyle}>
              {editingId === item.id ? (
                <View style={styles.editPanel}>
                  <TextInput
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={(v) =>
                      setEditForm((f) => ({ ...f, name: v }))
                    }
                    placeholder="Ingredient name"
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={editForm.quantity}
                      onChangeText={(v) =>
                        setEditForm((f) => ({ ...f, quantity: v }))
                      }
                      placeholder="Qty"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={editForm.unit}
                        onValueChange={(v) =>
                          setEditForm((f) => ({ ...f, unit: v }))
                        }
                        style={styles.picker}
                      >
                        {UNITS.map((u) => (
                          <Picker.Item key={u} label={u} value={u} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  {/* Edit expiry date */}
                  <View style={styles.expiryRow}>
                    <Text style={styles.expiryLabel}>Expires on</Text>
                    <TouchableOpacity
                      style={styles.dateBtn}
                      onPress={() => setShowEditPicker(true)}
                    >
                      <Text
                        style={
                          editForm.expiresAt
                            ? styles.dateBtnText
                            : styles.dateBtnPlaceholder
                        }
                      >
                        {editForm.expiresAt
                          ? editForm.expiresAt.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Set date"}
                      </Text>
                    </TouchableOpacity>
                    {editForm.expiresAt && (
                      <TouchableOpacity
                        onPress={() =>
                          setEditForm((f) => ({ ...f, expiresAt: null }))
                        }
                      >
                        <Text style={styles.clearDate}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {showEditPicker && (
                    <DateTimePicker
                      value={editForm.expiresAt || new Date()}
                      mode="date"
                      onChange={(_, date) => {
                        setShowEditPicker(false);
                        if (date)
                          setEditForm((f) => ({ ...f, expiresAt: date }));
                      }}
                    />
                  )}

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setEditingId(null)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => handleSaveEdit(item.id)}
                      disabled={savingId === item.id}
                    >
                      <Text style={styles.saveBtnText}>
                        {savingId === item.id ? "Saving..." : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.itemDot,
                        status === "expired"
                          ? { backgroundColor: colors.danger }
                          : status === "warning"
                            ? { backgroundColor: "#52b788" }
                            : {},
                      ]}
                    />
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleStartEdit(item)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={[styles.actionBtn, styles.deleteBtnContainer]}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  {item.expiration_date && (
                    <View style={{ marginTop: 6, marginLeft: 16 }}>
                      <ExpiryBadge expiresAt={item.expiration_date} />
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  alertBanner: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  alertBannerDanger: {
    backgroundColor: "#fff3f3",
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  alertBannerWarning: {
    backgroundColor: "#f0f7f4",
    borderWidth: 1,
    borderColor: "#b7dfc8",
  },
  alertContent: { flexDirection: "row", gap: 10, flex: 1 },
  alertIcon: { fontSize: 20 },
  alertTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  alertTitleDanger: { color: "#b71c1c" },
  alertTitleWarning: { color: "#1b4332" },
  alertNames: { fontSize: 12, color: "#777" },
  alertDismiss: { fontSize: 20, color: "#aaa", lineHeight: 22 },
  card: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginBottom: 10,
    justifyContent: "center",
  },
  picker: { height: 44 },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  expiryLabel: { fontSize: 13, color: colors.textMuted },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.background,
  },
  dateBtnText: { fontSize: 14, color: colors.textPrimary },
  dateBtnPlaceholder: { fontSize: 14, color: colors.textFaint },
  clearDate: { fontSize: 20, color: "#aaa", lineHeight: 22 },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  addBtnText: { color: colors.white, fontWeight: "600", fontSize: 15 },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: { fontSize: 14, color: colors.textMuted },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCardExpired: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff8f8",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  itemCardWarning: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#f0f7f4",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#b7dfc8",
  },
  editPanel: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 4,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  itemBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  itemBadgeText: { color: colors.white, fontSize: 12, fontWeight: "500" },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBtnText: { fontSize: 13, color: colors.textSecondary },
  deleteBtnContainer: { borderColor: colors.dangerBorder },
  deleteBtnText: { fontSize: 13, color: colors.danger },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 4,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: { fontSize: 14, color: colors.textSecondary },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: { fontSize: 14, color: colors.white, fontWeight: "600" },
  badgeExpired: {
    alignSelf: "flex-start",
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeExpiredText: { fontSize: 12, color: colors.white, fontWeight: "600" },
  badgeWarning: {
    alignSelf: "flex-start",
    backgroundColor: "#b7dfc8",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeWarningText: { fontSize: 12, color: "#1b4332", fontWeight: "600" },
  badgeOk: {
    alignSelf: "flex-start",
    backgroundColor: "#d8f3dc",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeOkText: { fontSize: 12, color: "#1b4332", fontWeight: "500" },
});
