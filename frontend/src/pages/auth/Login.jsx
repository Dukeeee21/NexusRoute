import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  IconArrowRight,
  IconBolt,
  IconEye,
  IconLock,
  IconShield,
  IconUser,
} from "../../components/common/icons.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { loginThunk } from "../../store/authSlice.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await dispatch(loginThunk({ username, password }));
    if (loginThunk.fulfilled.match(result)) {
      const role = result.payload.role;
      navigate(role === "ADMIN" ? "/admin" : "/driver", { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-nexus-navy px-4">
      <div className="w-full max-w-md rounded-2xl border border-nexus-border bg-nexus-surface p-8 shadow-2xl">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-nexus-primary text-white">
            <IconBolt width={26} height={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenido a NexusRoute</h1>
          <p className="mt-1 text-sm text-slate-400">Fleet Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Usuario */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Usuario
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <IconUser width={18} height={18} />
              </span>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-nexus-border bg-nexus-surface2 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-nexus-primary"
                required
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <button
                type="button"
                className="text-xs font-medium text-nexus-primary hover:underline"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <IconLock width={18} height={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-nexus-border bg-nexus-surface2 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-nexus-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                aria-label="Mostrar contraseña"
              >
                <IconEye width={18} height={18} />
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-nexus-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? "Ingresando..." : "Ingresar"}
            {status !== "loading" && <IconArrowRight width={18} height={18} />}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <IconShield width={14} height={14} />
          Acceso seguro protegido
        </div>
      </div>
    </div>
  );
}
