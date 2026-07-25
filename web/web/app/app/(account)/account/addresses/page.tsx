"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Trash2, Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect, COUNTRY_NAMES } from "@/components/ui/SearchableSelect";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Puducherry","Chandigarh",
];

interface Address {
  id: string; label?: string | null; fullName: string; phone: string;
  addressLine1: string; addressLine2?: string | null;
  city: string; state: string; pincode: string; country: string; isDefault: boolean;
}

const emptyForm = {
  label: "Home", fullName: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", pincode: "", country: "India", isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [errors, setErrors]       = useState<Partial<typeof emptyForm>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then(({ addresses }) => setAddresses(addresses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<typeof emptyForm> = {};
    if (!form.fullName.trim())  e.fullName     = "Required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "10-digit number required";
    if (!form.addressLine1.trim()) e.addressLine1 = "Required";
    if (!form.city.trim())     e.city          = "Required";
    if (!form.state)           e.state         = "Required";
    if (!form.pincode || form.pincode.length !== 6) e.pincode = "6-digit pincode required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const res  = await fetch(
        isEdit ? `/api/user/addresses/${editingId}` : "/api/user/addresses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, isDefault: !isEdit && addresses.length === 0 ? true : form.isDefault }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setAddresses((prev) => {
          if (isEdit) {
            return prev.map((a) => {
              if (a.id === data.address.id) return data.address;
              return data.address.isDefault ? { ...a, isDefault: false } : a;
            });
          }
          const updated = data.address.isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : prev;
          return [...updated, data.address];
        });
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
      }
    } catch {}
    setSaving(false);
  };

  const handleEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      label: a.label || "Home",
      fullName: a.fullName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 || "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: a.country || "India",
      isDefault: a.isDefault,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/user/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-7 w-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold font-body min-w-0" style={{ color: "var(--color-text-primary)" }}>
          Saved Addresses
        </h1>
        <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setErrors({}); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Address
        </Button>
      </div>

      {/* Address grid */}
      {addresses.length === 0 && !showForm ? (
        <div className="rounded-md border p-12 flex flex-col items-center text-center gap-4"
          style={{ background: "white", borderColor: "var(--color-parchment)" }}>
          <MapPin className="h-10 w-10" style={{ color: "var(--color-text-disabled)" }} />
          <div>
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No saved addresses</p>
            <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>Add an address for faster checkout</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-5 rounded-md border relative"
              style={{
                background: "white",
                borderColor: addr.isDefault ? "var(--color-primary)" : "var(--color-parchment)",
                borderWidth: addr.isDefault ? 2 : 1,
              }}>
              {addr.isDefault && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-body font-semibold rounded"
                  style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                  Default
                </span>
              )}
              {addr.label && (
                <p className="text-xs font-body font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-gold)" }}>
                  {addr.label}
                </p>
              )}
              <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{addr.fullName}</p>
              <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {addr.addressLine1}{addr.addressLine2 ? ", " + addr.addressLine2 : ""}
              </p>
              <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
              <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>{addr.phone}</p>

              <div className="flex gap-3 mt-4">
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr.id)}
                    className="flex items-center gap-1.5 text-xs font-body font-medium transition-colors"
                    style={{ color: "var(--color-primary)" }}>
                    <Star className="h-3.5 w-3.5" /> Set Default
                  </button>
                )}
                <button onClick={() => handleEdit(addr)}
                  className="flex items-center gap-1.5 text-xs font-body font-medium transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)}
                  className="flex items-center gap-1.5 text-xs font-body font-medium transition-colors ml-auto"
                  style={{ color: "var(--color-error)" }}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => { setShowForm(true); setForm(emptyForm); setErrors({}); }}
            className="p-5 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[160px] transition-colors hover:border-primary hover:bg-primary-50"
            style={{ borderColor: "var(--color-parchment)" }}>
            <Plus className="h-8 w-8" style={{ color: "var(--color-text-disabled)" }} />
            <span className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>Add new address</span>
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="p-6 rounded-md border" style={{ background: "white", borderColor: "var(--color-primary)" }}>
          <h2 className="text-base font-body font-semibold mb-5" style={{ color: "var(--color-text-primary)" }}>{editingId ? "Edit Address" : "New Address"}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {["Home", "Office", "Other"].map((l) => (
                <button key={l} type="button" onClick={() => setForm((p) => ({ ...p, label: l }))}
                  className="px-4 py-2 rounded-full text-sm font-body font-medium border transition-colors"
                  style={{
                    background: form.label === l ? "var(--color-primary)" : "transparent",
                    color: form.label === l ? "white" : "var(--color-text-secondary)",
                    borderColor: form.label === l ? "var(--color-primary)" : "var(--color-parchment)",
                  }}>
                  {l}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 min-w-0">
                <Input label="Full Name *" value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
                {errors.fullName && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{errors.fullName}</p>}
              </div>
              <div className="space-y-1.5 min-w-0">
                <Input label="Mobile Number *" value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} />
                {errors.phone && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{errors.phone}</p>}
              </div>
              <div className="md:col-span-2 space-y-1.5 min-w-0">
                <Input label="Address Line 1 *" value={form.addressLine1}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))} />
                {errors.addressLine1 && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{errors.addressLine1}</p>}
              </div>
              <div className="md:col-span-2 min-w-0">
                <Input label="Address Line 2" value={form.addressLine2}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Input label="City *" value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                {errors.city && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{errors.city}</p>}
              </div>
              <div className="space-y-1.5 min-w-0">
                <label className="block text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>State *</label>
                <input
                  type="text"
                  list="states-datalist"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full h-11 px-4 border rounded-md text-sm font-body focus:outline-none transition-all"
                  style={{ borderColor: errors.state ? "var(--color-error)" : "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.state ? "var(--color-error)" : "var(--color-parchment)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <datalist id="states-datalist">
                  {INDIAN_STATES.map((s) => <option key={s} value={s} />)}
                </datalist>
                {errors.state && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{errors.state}</p>}
              </div>
              <div className="space-y-1.5 min-w-0">
                <Input label="Pincode *" value={form.pincode}
                  onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                {errors.pincode && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{errors.pincode}</p>}
              </div>
              <div className="md:col-span-2 min-w-0">
                <SearchableSelect
                  label="Country"
                  value={form.country}
                  onChange={(v) => setForm((p) => ({ ...p, country: v }))}
                  options={COUNTRY_NAMES}
                  placeholder="Select Country"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>{editingId ? "Update Address" : "Save Address"}</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setErrors({}); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
