// components/WorkOrderCard.tsx
// Tarjeta de OT en proceso para la columna derecha del dashboard
"use client";

import { FracttalWorkOrder } from "@/lib/types";
import RelatedOtBadge from "@/components/RelatedOtBadge";

interface WorkOrderCardProps {
  wo: FracttalWorkOrder;
  isSelected: boolean;
  onClick: () => void;
}

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function WorkOrderCard(props: WorkOrderCardProps) {
  const wo = props.wo;
  const isHija = !!wo.id_parent_wo;
  const isPadreConHijas = wo.has_children === true;

  return (
    <div
      onClick={props.onClick}
      style={{
        position: "relative",
        background: props.isSelected ? "#eef2ff" : "#ffffff",
        border: props.isSelected ? "2px solid #4f46e5" : "2px solid #e5e7eb",
        borderRadius: "12px",
        padding: "14px",
        cursor: "pointer",
        marginBottom: "10px",
        boxShadow: props.isSelected ? "0 4px 12px rgba(79,70,229,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <RelatedOtBadge code={wo.code_wo_related} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e40af" }}>
          OT-{wo.wo_folio}
        </span>
        {(isPadreConHijas || isHija) && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "10px",
              fontWeight: 700,
              color: isHija ? "white" : "#4f46e5",
              background: isHija ? "#4f46e5" : "white",
              border: "1.5px solid #4f46e5",
              borderRadius: "20px",
              padding: "2px 8px",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill={isHija ? "white" : "none"} stroke={isHija ? "white" : "#4f46e5"} strokeWidth="2.5">
              <path d="M12 2L22 12L12 22L2 12Z" />
            </svg>
            {isHija ? "Hija" : "Padre"}
          </span>
        )}
      </div>

      <div style={{ background: "#f1f5f9", borderRadius: "6px", padding: "6px 10px", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Activo: </span>
        <span style={{ fontSize: "11px", color: "#1e293b", fontWeight: 700 }}>
          {String(wo.items_log_description || "-")}
        </span>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "6px 10px", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Tarea: </span>
        <span style={{ fontSize: "11px", color: "#1e293b", fontWeight: 600 }}>
          {String(wo.description || "-")}
        </span>
      </div>

      {/* Barra de avance */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{ flex: 1, height: "5px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
          <div
            style={{
              width: Number(wo.completed_percentage || 0) + "%",
              height: "100%",
              background: "#22c55e",
            }}
          />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
          {Number(wo.completed_percentage || 0)}%
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{ fontSize: "10px", color: "#64748b" }}>{formatDuration(wo.duration)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span style={{ fontSize: "10px", color: "#64748b" }}>{formatDate(wo.date_maintenance)}</span>
        </div>
      </div>

      {wo.personnel_description && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#e0e7ff",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {String(wo.personnel_description).trim().charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "11px", color: "#475569" }}>{String(wo.personnel_description).trim()}</span>
        </div>
      )}
    </div>
  );
}
