// components/RelatedOtBadge.tsx
// Badge "OT relacionada" (ej. "OT-37") que replica la esquina superior
// izquierda de la cartilla nativa de Fracttal. No reemplaza ni modifica
// el rombo existente de Padre/Hija: es un elemento independiente que se
// posiciona en la esquina opuesta.
"use client";

interface RelatedOtBadgeProps {
  code: string | number | boolean | null | undefined;
}

export default function RelatedOtBadge({ code }: RelatedOtBadgeProps) {
  if (!code) return null;
  const label = String(code);

  return (
    <span
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "10px",
        fontWeight: 700,
        color: "#64748b",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "2px 8px",
        zIndex: 1,
      }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 014-4h14" />
        <path d="M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
      {label}
    </span>
  );
}
