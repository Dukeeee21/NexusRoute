import { useState } from "react";
import { useDispatch } from "react-redux";

import Sidebar from "../../components/common/Sidebar.jsx";
import { changeMyPassword, updateMyProfile } from "../../api/users.js";
import { useAuth } from "../../hooks/useAuth.js";
import { updateUser } from "../../store/authSlice.js";

const labelCls = "mb-1 block text-slate-300";
const inputCls =
  "w-full rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-nexus-primary";

export default function Settings() {
  const { user, logout } = useAuth();
  const dispatch = useDispatch();

  const [profile, setProfile] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profileStatus, setProfileStatus] = useState(null); // null | "saving" | "ok" | error string

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdStatus, setPwdStatus] = useState(null);

  const setProfileField = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const setPwdField = (k) => (e) => setPwd((p) => ({ ...p, [k]: e.target.value }));

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileStatus("saving");
    try {
      const updated = await updateMyProfile(profile);
      dispatch(updateUser(updated));
      setProfileStatus("ok");
    } catch (err) {
      setProfileStatus(err.response?.data?.detail || "No se pudo guardar el perfil.");
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) {
      setPwdStatus("Las contraseñas nuevas no coinciden.");
      return;
    }
    setPwdStatus("saving");
    try {
      await changeMyPassword(pwd.current, pwd.next);
      setPwdStatus("ok");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (err) {
      const data = err.response?.data;
      setPwdStatus(data?.current_password?.[0] || data?.new_password?.[0] || "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="settings" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-8 py-4">
          <h1 className="text-lg font-semibold text-white">Configuración</h1>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Profile */}
            <form
              onSubmit={handleProfileSubmit}
              className="space-y-4 rounded-xl border border-nexus-border bg-nexus-surface p-5"
            >
              <h2 className="text-base font-semibold text-white">Perfil</h2>

              <label className="block text-sm">
                <span className={labelCls}>Usuario</span>
                <input value={user?.username || ""} disabled className={`${inputCls} opacity-60`} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className={labelCls}>Nombre</span>
                  <input
                    value={profile.first_name}
                    onChange={setProfileField("first_name")}
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm">
                  <span className={labelCls}>Apellido</span>
                  <input
                    value={profile.last_name}
                    onChange={setProfileField("last_name")}
                    className={inputCls}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className={labelCls}>Email</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={setProfileField("email")}
                  className={inputCls}
                />
              </label>

              <label className="block text-sm">
                <span className={labelCls}>Teléfono</span>
                <input
                  value={profile.phone}
                  onChange={setProfileField("phone")}
                  placeholder="+51 999 999 999"
                  className={inputCls}
                />
              </label>

              {profileStatus === "ok" && (
                <p className="rounded-lg bg-status-delivered/10 px-3 py-2 text-sm text-status-delivered">
                  Perfil actualizado.
                </p>
              )}
              {profileStatus && profileStatus !== "saving" && profileStatus !== "ok" && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {profileStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={profileStatus === "saving"}
                className="rounded-lg bg-nexus-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {profileStatus === "saving" ? "Guardando..." : "Guardar perfil"}
              </button>
            </form>

            {/* Change password */}
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-4 rounded-xl border border-nexus-border bg-nexus-surface p-5"
            >
              <h2 className="text-base font-semibold text-white">Cambiar Contraseña</h2>

              <label className="block text-sm">
                <span className={labelCls}>Contraseña actual</span>
                <input
                  type="password"
                  value={pwd.current}
                  onChange={setPwdField("current")}
                  required
                  className={inputCls}
                />
              </label>

              <label className="block text-sm">
                <span className={labelCls}>Contraseña nueva</span>
                <input
                  type="password"
                  value={pwd.next}
                  onChange={setPwdField("next")}
                  minLength={8}
                  required
                  className={inputCls}
                />
              </label>

              <label className="block text-sm">
                <span className={labelCls}>Confirmar contraseña nueva</span>
                <input
                  type="password"
                  value={pwd.confirm}
                  onChange={setPwdField("confirm")}
                  minLength={8}
                  required
                  className={inputCls}
                />
              </label>

              {pwdStatus === "ok" && (
                <p className="rounded-lg bg-status-delivered/10 px-3 py-2 text-sm text-status-delivered">
                  Contraseña actualizada.
                </p>
              )}
              {pwdStatus && pwdStatus !== "saving" && pwdStatus !== "ok" && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{pwdStatus}</p>
              )}

              <button
                type="submit"
                disabled={pwdStatus === "saving"}
                className="rounded-lg bg-nexus-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {pwdStatus === "saving" ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
