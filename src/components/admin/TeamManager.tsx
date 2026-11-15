"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffRole } from "@/lib/database.types";

interface StaffMember {
  id: string;
  full_name: string;
  role: StaffRole;
  active: boolean;
}

const EMPTY_FORM = { email: "", password: "", fullName: "", role: "staff" as StaffRole };

export function TeamManager({ members, currentUserId }: { members: StaffMember[]; currentUserId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al crear la cuenta");
      return;
    }
    setForm(EMPTY_FORM);
    router.refresh();
  }

  async function handlePatch(id: string, patch: Partial<{ role: StaffRole; active: boolean }>) {
    setError(null);
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al actualizar");
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta de staff? Esta acción no se puede deshacer.")) return;
    setError(null);
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al eliminar");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="text-sm text-brand-red mb-4">{error}</p>}

      <div className="space-y-3 mb-8">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between border border-neutral-200 rounded-sm p-4">
            <div>
              <p className="heading-condensed">{m.full_name}</p>
              <p className="text-xs text-neutral-500 uppercase">
                {m.role === "super_admin" ? "Super administrador" : "Atención a público"}
                {!m.active && " · Inactivo"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <select
                value={m.role}
                disabled={m.id === currentUserId}
                onChange={(e) => handlePatch(m.id, { role: e.target.value as StaffRole })}
                className="input py-1"
              >
                <option value="staff">Atención a público</option>
                <option value="super_admin">Super administrador</option>
              </select>
              <button
                disabled={m.id === currentUserId}
                onClick={() => handlePatch(m.id, { active: !m.active })}
                className="text-neutral-500 hover:text-brand-red disabled:opacity-30"
              >
                {m.active ? "Desactivar" : "Activar"}
              </button>
              <button
                disabled={m.id === currentUserId}
                onClick={() => handleDelete(m.id)}
                className="text-neutral-400 hover:text-brand-red disabled:opacity-30"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-dashed border-neutral-300 rounded-sm p-5">
        <p className="heading-condensed text-sm mb-4">Nueva cuenta de staff</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Nombre completo</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Rol</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
              className="input"
            >
              <option value="staff">Atención a público</option>
              <option value="super_admin">Super administrador</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Correo</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Contraseña (mín. 8 caracteres)</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
            />
          </label>
        </div>
        <button
          disabled={loading || !form.email || form.password.length < 8 || !form.fullName}
          onClick={handleCreate}
          className="mt-4 rounded-sm bg-brand-red text-white px-4 py-2 text-xs heading-condensed disabled:opacity-40"
        >
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
}
