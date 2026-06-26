/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // NexusRoute palette (matches the Stitch design system).
        nexus: {
          primary: "#3B82F6", // azul — acciones principales
          navy: "#0F1117", // fondo oscuro
          surface: "#161A23", // tarjetas / paneles
          surface2: "#1E2533", // tarjetas elevadas / hover
          border: "#2A3242", // bordes sutiles
        },
        // Estados de entrega.
        status: {
          delivered: "#10B981", // entregado (verde)
          transit: "#F59E0B", // en tránsito (ámbar)
          pending: "#64748B", // pendiente (gris pizarra)
        },
      },
    },
  },
  plugins: [],
};
