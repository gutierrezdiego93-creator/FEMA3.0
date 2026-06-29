// components/TaskCard.tsx
"use client";

import { FracttalTask, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/types";

interface TaskCardProps {
  task: FracttalTask;
  isSelected: boolean;
  onClick: () => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  const overdue = task.delay > 0 || isOverdue(task.date_maintenance);
  const isPlanned = !!task.id_group_task;
  const priorityColor = PRIORITY_COLORS[task.id_priorities] || "#94a3b8";
  const priorityLabel = PRIORITY_LABELS[task.id_priorities] || "MEDIA";

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? "#eef2ff" : "#ffffff",
        border: isSelected ? "2px solid #4f46e5" : "2px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginBottom: "10px",
        boxShadow: isSelected
          ? "0 4px 12px rgba(79,70,229,0.15)"
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Checkbox visual */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "4px",
            border: "2px solid #d1d5db",
            flexShrink: 0,
            marginTop: "2px",
          }}
        />
        <div style={{ flex: 1 }}>
          {/* Activo */}
          <div
            style={{
              background: "#f1f5f9",
              borderRadius: "6px",
              padding: "6px 10px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Activo: </span>
            <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: 700 }}>
              {task.item_description}
            </span>
            {task.code && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {"  "}
                {task.code}{"  "}
                <span style={{ color: "#94a3b8" }}>{`{ ${task.code} }`}</span>
              </span>
            )}
          </div>

          {/* Tarea */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "6px",
              padding: "6px 10px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Tarea: </span>
              <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: 600 }}>
                {task.task_description || task.description || "Sin descripción"}
              </span>
            </div>
            {/* Indicador de prioridad */}
            <div
              style={{
                width: "8px",
                height: "24px",
                borderRadius: "3px",
                background: priorityColor,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tags de tipo, disciplina, prioridad */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
        {task.type_description && (
          <span style={tagStyle("#dcfce7", "#166534")}>{task.type_description.toUpperCase()}</span>
        )}
        {task.discipline_description && (
          <span style={tagStyle("#dbeafe", "#1e40af")}>{task.discipline_description.toUpperCase()}</span>
        )}
        {isPlanned ? (
          <span style={tagStyle("#e0e7ff", "#3730a3")}>PLANIFICADA</span>
        ) : (
          <span style={tagStyle("#f1f5f9", "#475569")}>NO PLANIFICADA</span>
        )}
        <span
          style={{
            ...tagStyle(priorityColor + "22", priorityColor),
            border: `1px solid ${priorityColor}44`,
          }}
        >
          {priorityLabel}
        </span>
      </div>

      {/* Fecha, duración, atraso */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <ClockIcon />
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {formatDuration(task.duration)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <CalendarIcon color={overdue ? "#ef4444" : "#64748b"} />
          <span
            style={{
              fontSize: "12px",
              color: overdue ? "#ef4444" : "#64748b",
              fontWeight: overdue ? 700 : 400,
            }}
          >
            {formatDate(task.date_maintenance)}
          </span>
        </div>
        {overdue && task.delay > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <WarningIcon />
            <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700 }}>
              {task.delay} días de atraso
            </span>
          </div>
        )}
      </div>

      {/* Ubicación y taller */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {task.location_description && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <LocationIcon />
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              {task.location_description}
            </span>
          </div>
        )}
        {task.workshop_description && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <WorkshopIcon />
            <span style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
              {task.workshop_description}
            </span>
          </div>
        )}
      </div>

      {/* Footer: frecuencia */}
      <div
        style={{
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FrequencyIcon />
          <span
            style={{
              fontSize: "11px",
              color: isPlanned ? "#4f46e5" : "#94a3b8",
              fontWeight: 600,
            }}
          >
            {isPlanned ? "PLANIFICADA" : "NO PLANIFICADA"}
          </span>
        </div>
      </div>
    </div>
  );
}

function tagStyle(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: "4px",
    background: bg,
    color: color,
    letterSpacing: "0.3px",
  };
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function CalendarIcon({ color = "#64748b" }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function WorkshopIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function FrequencyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}
