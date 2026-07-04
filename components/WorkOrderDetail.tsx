// components/WorkOrderDetail.tsx
// Panel de detalle cuando se selecciona una OT en proceso (columna derecha)
"use client";

import { FracttalWorkOrder } from "@/lib/types";
import { useRouter } from "next/navigation";
import RelatedOtBadge from "@/components/RelatedOtBadge";

interface WorkOrderDetailProps {
  wo: FracttalWorkOrder;
  allWorkOrders: FracttalWorkOrder[];
  onSelectFolio: (folio: string) => void;
}

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + " hrs";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function WorkOrderDetail(props: WorkOrderDetailProps) {
  const router = useRouter();
  const wo = props.wo;
  const isHija = !!wo.id_parent_wo || !!(wo as any).annotations?.code_wo_related;

  // Buscar las OTs hijas reales dentro de la lista que ya tenemos cargada.
  // Se busca por id_parent_wo (campo nativo, hoy vacío) Y por
  // annotations.id_wo_related (como ligamos las hijas hoy vía el workaround).
  // El día que Fracttal llene id_parent_wo de forma nativa, esto sigue
  // funcionando igual sin tocar nada.
  const hijas = props.allWorkOrders.filter(function (w) {
    return w.id_parent_wo === wo.wo_folio || (w as any).annotations?.id_wo_related === wo.wo_folio;
  });

  const hasChildren = wo.has_children === true || hijas.length > 0;

  const handleAgregarTecnicos = function () {
    const params = new URLSearchParams();
    params.set("parentFolio", wo.wo_folio);
    params.set("item", wo.items_log_description || "");
    params.set("itemCode", wo.code || "");
    params.set("desc", wo.description || "");
    params.set("type", (wo as any).tasks_log_task_type_main || "");
    params.set("duration", String(wo.duration || 0));
    params.set("date", wo.date_maintenance || "");
    params.set("plan", (wo as any).group_task_description || "");
    params.set("priority", (wo as any).priorities_description || "");
    params.set("excludeCode", wo.code_responsible || "");
    router.push("/assign-technicians?" + params.toString());
  };

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: "12px", padding: "20px", marginBottom: "16px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: 600 }}>ORDEN DE TRABAJO</div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>OT-{wo.wo_folio}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RelatedOtBadge code={(wo as any).annotations?.code_wo_related} />
            {(isHija || hasChildren) && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
                background: isHija ? "#4f46e5" : "rgba(255,255,255,0.15)",
                border: "1.5px solid " + (isHija ? "#4f46e5" : "rgba(255,255,255,0.4)"),
                borderRadius: "20px",
                padding: "4px 10px",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill={isHija ? "white" : "none"} stroke="white" strokeWidth="2.5">
                <path d="M12 2L22 12L12 22L2 12Z" />
              </svg>
              {isHija ? "OT Hija" : "OT Padre"}
            </span>
            )}
          </div>
        </div>
      </div>

      {/* Relación padre/hija */}
      {isHija && (
        <div
          onClick={function () { props.onSelectFolio((wo.id_parent_wo || (wo as any).annotations?.id_wo_related) as string); }}
          style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "12px", marginBottom: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2.5">
            <path d="M12 2L22 12L12 22L2 12Z" />
          </svg>
          <span style={{ fontSize: "12px", color: "#4338ca", fontWeight: 600 }}>
            Ver OT padre: OT-{wo.id_parent_wo || (wo as any).annotations?.id_wo_related}
          </span>
        </div>
      )}

      {hasChildren && hijas.length > 0 && (
        <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px", letterSpacing: "0.5px" }}>
            OTS HIJAS ({hijas.length})
          </div>
          {hijas.map(function (h) {
            return (
              <div
                key={h.wo_folio}
                onClick={function () { props.onSelectFolio(h.wo_folio); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer", borderBottom: "1px solid #e2e8f0" }}
              >
                <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: 600 }}>OT-{h.wo_folio}</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{String(h.personnel_description || "Sin asignar")}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Activo */}
      <div style={sectionStyle}>
        <div style={labelStyle}>ACTIVO</div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{String(wo.items_log_description || "-")}</div>
      </div>

      {/* Tarea */}
      <div style={sectionStyle}>
        <div style={labelStyle}>TAREA</div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{String(wo.description || "-")}</div>
      </div>

      {/* Grid de detalles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <DetailCard icon="📅" label="Fecha programada" value={formatDate(wo.date_maintenance)} />
        <DetailCard icon="⏱" label="Duración estimada" value={formatDuration(wo.duration)} />
      </div>

      {/* Avance */}
      <div style={sectionStyle}>
        <div style={labelStyle}>AVANCE</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ width: Number(wo.completed_percentage || 0) + "%", height: "100%", background: "#22c55e" }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{Number(wo.completed_percentage || 0)}%</span>
        </div>
      </div>

      {/* Responsable actual */}
      {wo.personnel_description && (
        <div style={sectionStyle}>
          <div style={labelStyle}>RESPONSABLE ACTUAL</div>
          <div style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600 }}>{String(wo.personnel_description).trim()}</div>
        </div>
      )}

      {/* Botón Agregar técnicos: solo disponible en OTs padre, no en hijas */}
      {!isHija ? (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={handleAgregarTecnicos}
            style={{ width: "100%", padding: "14px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            + Agregar técnicos
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
          Esta OT ya es una hija — no se le pueden agregar más técnicos
        </div>
      )}
    </div>
  );
}

function DetailCard(props: { icon: string; label: string; value: string }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
      <div style={{ fontSize: "16px", marginBottom: "4px" }}>{props.icon}</div>
      <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>{props.label}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{props.value}</div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = { background: "#f8fafc", borderRadius: "10px", padding: "12px", marginBottom: "10px" };
const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "4px" };
