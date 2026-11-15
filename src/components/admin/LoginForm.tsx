"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    router.push(searchParams.get("next") ?? "/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo variant="white" />
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-sm p-8">
          <h1 className="heading-condensed text-xl text-center mb-6">Panel de administración</h1>

          <label className="block text-sm mb-4">
            <span className="block text-xs heading-condensed text-neutral-500 mb-1">Correo</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="username"
            />
          </label>

          <label className="block text-sm mb-6">
            <span className="block text-xs heading-condensed text-neutral-500 mb-1">Contraseña</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="text-sm text-brand-red mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-brand-red text-white font-heading uppercase tracking-wide text-sm py-3 hover:bg-brand-red-hover disabled:opacity-50"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
