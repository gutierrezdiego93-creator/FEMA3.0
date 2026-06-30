"use client";

import { FracttalTask, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/types";
import { useRouter } from "next/navigation";

interface TaskDetailProps {
  task: FracttalTask | null;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + " hrs";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TaskDetail({ task }: TaskDetailProps) {
  const router = useRouter();

  const handleCreateOT = () => {
    if (!task) return;
    const params = new URLSearchParams({
      taskId: String(task.id),
      desc: task.description || task.task_description || "",
      item: task.item_description || "",
      code: task.code || "",
      duration: String(task.duration || 0),
      type: task.tasks_types_main_description || task.type_description || "",
      date: task.date_maintenance || "",
      plan: task.group_task_description || "",
      priority: task.priorities_description || "Media",
    });
    router.push("/create-ot?" + params.toString());
  };

  if (!task) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#94a3b8",
          gap: "16px",
        }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#475569", margin: 0 }}>
            Selecciona una tarea pendiente
          </p>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "6px 0 0" }}>
            Elige una tarea de la columna izquierda para ver sus detalles
          </p>
        </div>
      </div>
    );
  }

  const priorityColor = PRIORITY_COLORS[task.id_priorities] || "#94a3b8";
  const priorityLabel = PRIORITY_LABELS[task.id_priorities] || task.priorities_description || "MEDIA";
  const isPlanned = !!task.id_group_task;
  const overdue = task.delay > 0;

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header activo */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
          color: "white",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: 600 }}>ACTIVO</div>
        <div style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>{task.item_description}</div>
        {task.code && (
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", color: "#cbd5e1" }}>
            {task.code}
          </span>
        )}
      </div>

      {/* Tarea */}
      <div style={sectionStyle}>
        <div style={labelStyle}>TAREA</div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
          {task.description || task.task_description || "Sin descripción"}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
        {(task.tasks_types_main_description || task.type_description) && (
          <span style={tagStyle("#dcfce7", "#166534")}>{(task.tasks_types_main_description || task.type_description || "").toUpperCase()}</span>
        )}
        {task.tasks_types_description && (
          <span style={tagStyle("#dbeafe", "#1e40af")}>{task.tasks_types_description.toUpperCase()}</span>
        )}
        <span style={tagStyle(isPlanned ? "#e0e7ff" : "#f1f5f9", isPlanned ? "#3730a3" : "#475569")}>
          {isPlanned ? "PLANIFICADA" : "NO PLANIFICADA"}
        </span>
        <span style={{ ...tagStyle(priorityColor + "22", priorityColor), border: "1px solid " + priorityColor + "44" }}>
          {priorityLabel.toUpperCase()}
        </span>
      </div>

      {/* Grid detalles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <DetailCard icon="📅" label="Fecha programada" value={formatDate(task.date_maintenance)} alert={overdue} />
        <DetailCard icon="⏱" label="Duración estimada" value={formatDuration(task.duration)} />
        {overdue && <DetailCard icon="⚠️" label="Días de atraso" value={task.delay + " días"} alert={true} />}
        {task.wo_folio && <DetailCard icon="📋" label="Folio OT" value={task.wo_folio} />}
      </div>

      {task.location_description && (
        <div style={sectionStyle}>
          <div style={labelStyle}>UBICACIÓN</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{task.location_description}</div>
        </div>
      )}

      {task.workshop_description && (
        <div style={sectionStyle}>
          <div style={labelStyle}>TALLER</div>
          <div style={{ fontSize: "13px", color: "#4f46e5", fontWeight: 600 }}>{task.workshop_description}</div>
        </div>
      )}

      {task.requested_by && (
        <div style={sectionStyle}>
          <div style={labelStyle}>SOLICITADO POR</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{task.requested_by}</div>
        </div>
      )}

      {/* BOTÓN CREAR OT */}
      <div style={{ marginTop: "auto", paddingTop: "20px" }}>
        <button
          onClick={handleCreateOT}
          style={{
            width: "100%",
            padding: "14px",
            background: "#1e40af",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Crear Orden de Trabajo
        </button>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, alert = false }: { icon: string; label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ background: alert ? "#fef2f2" : "#f8fafc", border: "1px solid " + (alert ? "#fecaca" : "#e2e8f0"), borderRadius: "10px", padding: "12px" }}>
      <div style={{ fontSize: "16px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: alert ? "#ef4444" : "#1e293b" }}>{value}</div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = { background: "#f8fafc", borderRadius: "10px", padding: "12px", marginBottom: "10px" };
const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "4px" };

function tagStyle(bg: string, color: string): React.CSSProperties {
  return { fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: bg, color };
}
