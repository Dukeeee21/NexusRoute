import Sidebar from "../../components/common/Sidebar.jsx";
import { IconHelp, IconMail } from "../../components/common/icons.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const FAQ = [
  {
    q: "¿Cómo calcula NexusRoute la ruta óptima?",
    a: "Con el algoritmo A* y una heurística de árbol de expansión mínima (MST), que es matemáticamente admisible. Eso garantiza la ruta con menor distancia total posible, no una aproximación.",
  },
  {
    q: "¿Por qué no puedo asignar más de 12 paradas a una sola ruta?",
    a: "El cálculo exacto crece exponencialmente con la cantidad de paradas. Más allá de 12, el sistema prefiere rechazar la solicitud con un error claro antes que devolver una 'optimización' que en realidad ya no lo es.",
  },
  {
    q: "¿Por qué no veo entregas de otros conductores en mi vista?",
    a: "Por diseño: cada conductor solo ve y puede actualizar las entregas y rutas que tiene asignadas. Los administradores sí tienen visibilidad completa de la flota.",
  },
  {
    q: "¿Cómo se actualiza el estado de una entrega?",
    a: "El conductor la marca desde su vista, parada por parada: Pendiente → En tránsito → Entregado. El dashboard del administrador refleja los cambios automáticamente (se actualiza cada 15 segundos).",
  },
  {
    q: "¿Los reportes están disponibles para conductores?",
    a: "No. El módulo de reportes es exclusivo del panel de administración, para mantener la app del conductor liviana y enfocada solo en su operación del día.",
  },
];

export default function Support() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="support" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-8 py-4">
          <h1 className="text-lg font-semibold text-white">Soporte</h1>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-xl border border-nexus-border bg-nexus-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <IconHelp width={18} height={18} className="text-nexus-primary" />
                <h2 className="text-base font-semibold text-white">Preguntas frecuentes</h2>
              </div>
              <div className="divide-y divide-nexus-border">
                {FAQ.map(({ q, a }) => (
                  <details key={q} className="group py-3 first:pt-0 last:pb-0">
                    <summary className="cursor-pointer list-none text-sm font-medium text-slate-200 group-open:text-nexus-primary">
                      {q}
                    </summary>
                    <p className="mt-2 text-sm text-slate-400">{a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-nexus-border bg-nexus-surface p-5">
              <div className="mb-2 flex items-center gap-2">
                <IconMail width={18} height={18} className="text-nexus-primary" />
                <h2 className="text-base font-semibold text-white">Contacto</h2>
              </div>
              <p className="text-sm text-slate-400">
                ¿Un problema no cubierto arriba? Escribí al equipo de soporte de tu
                organización o a quien administre esta instalación de NexusRoute.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
