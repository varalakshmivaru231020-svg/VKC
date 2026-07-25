"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Edit2, Trash2, Check, X, Save, User, Eye, Pencil, Trash } from "lucide-react";

const MODULES = [
  { key: "dashboard",  label: "Dashboard" },
  { key: "orders",     label: "Orders" },
  { key: "products",   label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "customers",  label: "Customers" },
  { key: "reviews",    label: "Reviews" },
  { key: "coupons",    label: "Coupons" },
  { key: "banners",    label: "Banners / Marketing" },
  { key: "stock",      label: "Stock / Inventory" },
  { key: "shipments",  label: "Shipments" },
  { key: "reports",    label: "Reports" },
  { key: "settings",   label: "Settings" },
];

type Perm = { view: boolean; edit: boolean; delete: boolean };
type Permissions = Record<string, Perm>;

interface RoleTemplate {
  id: string;
  name: string;
  description?: string | null;
  permissions: Permissions;
  isActive: boolean;
  _count?: { users: number };
}
interface StaffUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  isActive: boolean;
  roleTemplate?: { id: string; name: string } | null;
  createdAt: string;
}

const inputCls = "w-full h-10 px-3 border rounded-lg text-sm font-body focus:outline-none transition-all";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };
const focus = {
  onFocus: (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; },
  onBlur:  (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; },
};

function defaultPerms(): Permissions {
  const p: Permissions = {};
  MODULES.forEach((m) => { p[m.key] = { view: false, edit: false, delete: false }; });
  return p;
}

function mergePerms(saved: any): Permissions {
  const base = defaultPerms();
  for (const m of MODULES) {
    if (saved?.[m.key]) {
      base[m.key] = { view: !!saved[m.key].view, edit: !!saved[m.key].edit, delete: !!saved[m.key].delete };
    }
  }
  return base;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [staff, setStaff]   = useState<StaffUser[]>([]);
  const [tab, setTab]        = useState<"roles" | "users">("roles");
  const [loading, setLoading]= useState(true);

  // Role form
  const [roleModal, setRoleModal]   = useState(false);
  const [editRole, setEditRole]     = useState<RoleTemplate | null>(null);
  const [roleName, setRoleName]     = useState("");
  const [roleDesc, setRoleDesc]     = useState("");
  const [perms, setPerms]           = useState<Permissions>(defaultPerms());
  const [savingRole, setSavingRole] = useState(false);

  // User form
  const [userModal, setUserModal]   = useState(false);
  const [editUser, setEditUser]     = useState<StaffUser | null>(null);
  const [uFirst, setUFirst]         = useState("");
  const [uLast, setULast]           = useState("");
  const [uEmail, setUEmail]         = useState("");
  const [uPhone, setUPhone]         = useState("");
  const [uPwd, setUPwd]             = useState("");
  const [uRole, setURoleVal]        = useState("STAFF");
  const [uTemplate, setUTemplate]   = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const load = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([
      fetch("/api/admin/roles").then((x) => x.json()),
      fetch("/api/admin/staff").then((x) => x.json()),
    ]);
    setRoles(r.roles ?? []);
    setStaff(s.users ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Role CRUD ──────────────────────────────────────────────────────────────
  const openNewRole = () => {
    setEditRole(null); setRoleName(""); setRoleDesc(""); setPerms(defaultPerms()); setRoleModal(true);
  };
  const openEditRole = (r: RoleTemplate) => {
    setEditRole(r); setRoleName(r.name); setRoleDesc(r.description ?? ""); setPerms(mergePerms(r.permissions)); setRoleModal(true);
  };
  const saveRole = async () => {
    if (!roleName.trim()) return;
    setSavingRole(true);
    const method = editRole ? "PUT" : "POST";
    const body = { ...(editRole && { id: editRole.id }), name: roleName, description: roleDesc, permissions: perms };
    await fetch("/api/admin/roles", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingRole(false); setRoleModal(false); load();
  };
  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role? Assigned users will lose this role.")) return;
    await fetch("/api/admin/roles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  const togglePerm = (module: string, action: "view" | "edit" | "delete") => {
    setPerms((p) => {
      const cur = p[module] ?? { view: false, edit: false, delete: false };
      const updated = { ...cur, [action]: !cur[action] };
      // view is required for edit/delete
      if (action !== "view" && updated[action]) updated.view = true;
      if (action === "view" && !updated.view) { updated.edit = false; updated.delete = false; }
      return { ...p, [module]: updated };
    });
  };

  // ── User CRUD ──────────────────────────────────────────────────────────────
  const openNewUser = () => {
    setEditUser(null); setUFirst(""); setULast(""); setUEmail(""); setUPhone(""); setUPwd(""); setURoleVal("STAFF"); setUTemplate(""); setUserModal(true);
  };
  const openEditUser = (u: StaffUser) => {
    setEditUser(u); setUFirst(u.firstName ?? ""); setULast(u.lastName ?? ""); setUEmail(u.email ?? ""); setUPhone(u.phone ?? ""); setUPwd("");
    setURoleVal(u.role); setUTemplate(u.roleTemplate?.id ?? ""); setUserModal(true);
  };
  const saveUser = async () => {
    setSavingUser(true);
    const method = editUser ? "PUT" : "POST";
    const body: any = { firstName: uFirst, lastName: uLast, email: uEmail, phone: uPhone, role: uRole, roleTemplateId: uTemplate || null };
    if (editUser) body.id = editUser.id; else body.password = uPwd;
    if (uPwd && editUser) body.password = uPwd;
    await fetch("/api/admin/staff", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingUser(false); setUserModal(false); load();
  };
  const deleteUser = async (id: string) => {
    if (!confirm("Deactivate this user?")) return;
    await fetch("/api/admin/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  const CheckBox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className="h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
      style={{ background: checked ? "var(--color-primary)" : "white", borderColor: checked ? "var(--color-primary)" : "#D1D5DB" }}>
      {checked && <Check className="h-3 w-3 text-white" />}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Roles & Permissions</h1>
          <p className="text-sm font-body mt-0.5" style={{ color: "#6B7280" }}>
            Create roles with module-level access, then assign them to staff users.
          </p>
        </div>
        <button
          onClick={tab === "roles" ? openNewRole : openNewUser}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold font-body transition-all"
          style={{ background: "var(--color-primary)", color: "white" }}>
          <Plus className="h-4 w-4" />
          {tab === "roles" ? "New Role" : "New User"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#F3F4F6" }}>
        {(["roles", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-md text-sm font-body font-medium transition-all capitalize"
            style={{ background: tab === t ? "white" : "transparent", color: tab === t ? "#111827" : "#6B7280",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {t === "roles" ? "Role Templates" : "Staff Users"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm font-body" style={{ color: "#9CA3AF" }}>Loading…</div>
      ) : tab === "roles" ? (
        /* ── ROLES TABLE ── */
        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          {roles.length === 0 ? (
            <div className="p-16 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
              <p className="text-sm font-body" style={{ color: "#6B7280" }}>No roles yet. Create your first role template.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Role Name", "Description", "Permissions", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role, i) => {
                  const permsObj = (role.permissions ?? {}) as Permissions;
                  const activeModules = MODULES.filter((m) => permsObj[m.key]?.view).map((m) => m.label);
                  return (
                    <tr key={role.id} className="border-b" style={{ borderColor: "#F3F4F6", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                          <span className="text-sm font-semibold font-body" style={{ color: "#111827" }}>{role.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-body max-w-xs" style={{ color: "#6B7280" }}>{role.description || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {activeModules.slice(0, 4).map((m) => (
                            <span key={m} className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-body"
                              style={{ background: "var(--color-primary-50, #fdf4f4)", color: "var(--color-primary)" }}>{m}</span>
                          ))}
                          {activeModules.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold font-body" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                              +{activeModules.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                          style={{ background: role.isActive ? "#D1FAE5" : "#FEE2E2", color: role.isActive ? "#065F46" : "#991B1B" }}>
                          {role.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditRole(role)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                            <Edit2 className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                          </button>
                          <button onClick={() => deleteRole(role.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── STAFF USERS TABLE ── */
        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
          {staff.length === 0 ? (
            <div className="p-16 text-center">
              <User className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
              <p className="text-sm font-body" style={{ color: "#6B7280" }}>No staff users yet. Create your first staff account.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Name", "Email", "Phone", "System Role", "Role Template", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((u, i) => (
                  <tr key={u.id} className="border-b" style={{ borderColor: "#F3F4F6", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <td className="px-4 py-3 text-sm font-semibold font-body" style={{ color: "#111827" }}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-body" style={{ color: "#6B7280" }}>{u.email || "—"}</td>
                    <td className="px-4 py-3 text-sm font-body" style={{ color: "#6B7280" }}>{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                        style={{ background: u.role === "ADMIN" ? "#DBEAFE" : "#FEF3C7", color: u.role === "ADMIN" ? "#1E40AF" : "#92400E" }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-body" style={{ color: "#374151" }}>{u.roleTemplate?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                        style={{ background: u.isActive ? "#D1FAE5" : "#FEE2E2", color: u.isActive ? "#065F46" : "#991B1B" }}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Edit2 className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ROLE MODAL ── */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: "white" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-lg font-semibold font-body" style={{ color: "#111827" }}>
                {editRole ? "Edit Role" : "Create Role"}
              </h2>
              <button onClick={() => setRoleModal(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Role Name *</label>
                  <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Order Manager"
                    className={inputCls} style={inputStyle} {...focus} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Description</label>
                  <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Brief description"
                    className={inputCls} style={inputStyle} {...focus} />
                </div>
              </div>

              {/* Permissions matrix */}
              <div>
                <h3 className="text-sm font-semibold font-body mb-3" style={{ color: "#111827" }}>Module Permissions</h3>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                        <th className="text-left px-4 py-2.5 text-xs font-body font-semibold uppercase tracking-wide w-1/2" style={{ color: "#6B7280" }}>Module</th>
                        {(["view", "edit", "delete"] as const).map((a) => (
                          <th key={a} className="text-center px-3 py-2.5 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>
                            <div className="flex items-center justify-center gap-1">
                              {a === "view" && <Eye className="h-3 w-3" />}
                              {a === "edit" && <Pencil className="h-3 w-3" />}
                              {a === "delete" && <Trash className="h-3 w-3" />}
                              {a}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((m, i) => (
                        <tr key={m.key} style={{ background: i % 2 === 0 ? "white" : "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                          <td className="px-4 py-2.5 text-sm font-body" style={{ color: "#374151" }}>{m.label}</td>
                          {(["view", "edit", "delete"] as const).map((action) => (
                            <td key={action} className="px-3 py-2.5 text-center">
                              <div className="flex justify-center">
                                <CheckBox
                                  checked={!!(perms[m.key]?.[action])}
                                  onChange={() => togglePerm(m.key, action)}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: "#E5E7EB" }}>
              <button onClick={() => setRoleModal(false)} className="px-4 py-2 rounded-lg text-sm font-body font-medium border" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
              <button onClick={saveRole} disabled={savingRole || !roleName.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body disabled:opacity-60 transition-all"
                style={{ background: "var(--color-primary)", color: "white" }}>
                <Save className="h-4 w-4" />
                {savingRole ? "Saving…" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── USER MODAL ── */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: "white" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-lg font-semibold font-body" style={{ color: "#111827" }}>
                {editUser ? "Edit Staff User" : "Create Staff User"}
              </h2>
              <button onClick={() => setUserModal(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>First Name</label>
                  <input value={uFirst} onChange={(e) => setUFirst(e.target.value)} placeholder="Priya" className={inputCls} style={inputStyle} {...focus} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Last Name</label>
                  <input value={uLast} onChange={(e) => setULast(e.target.value)} placeholder="Sharma" className={inputCls} style={inputStyle} {...focus} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Email *</label>
                <input type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} placeholder="priya@store.com" className={inputCls} style={inputStyle} {...focus} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Phone</label>
                <input value={uPhone} onChange={(e) => setUPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} style={inputStyle} {...focus} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Password {editUser && "(leave blank to keep)"}</label>
                <input type="password" value={uPwd} onChange={(e) => setUPwd(e.target.value)} placeholder="••••••••" className={inputCls} style={inputStyle} {...focus} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>System Role</label>
                  <select value={uRole} onChange={(e) => setURoleVal(e.target.value)} className={inputCls} style={inputStyle} {...focus}>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Role Template</label>
                  <select value={uTemplate} onChange={(e) => setUTemplate(e.target.value)} className={inputCls} style={inputStyle} {...focus}>
                    <option value="">No template</option>
                    {roles.filter((r) => r.isActive).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: "#E5E7EB" }}>
              <button onClick={() => setUserModal(false)} className="px-4 py-2 rounded-lg text-sm font-body font-medium border" style={{ borderColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
              <button onClick={saveUser} disabled={savingUser || !uEmail.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "white" }}>
                <Save className="h-4 w-4" />
                {savingUser ? "Saving…" : "Save User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
