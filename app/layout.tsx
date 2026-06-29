// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FEMA - Planificador de OTs",
  description: "Planificador de Órdenes de Trabajo - Transportes de Carga FEMA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
