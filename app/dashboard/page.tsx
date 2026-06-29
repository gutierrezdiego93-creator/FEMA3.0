// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { FracttalTask } from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import TaskDetail from "@/components/TaskDetail";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<FracttalTask[]>([]);
  const [filtered, setFiltered] = useState<FracttalTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<FracttalTask | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const taskList: FracttalTask[] = data.data || data || [];
      setTasks(taskList);
      setFiltered(taskList);
      setLastUpdated(new Date());
    } catch (err) {
      setError("No se pudieron cargar las tareas. Verifica la conexión con Fracttal.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => fetchTasks(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Búsqueda en tiempo real
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(tasks);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      tasks.filter(
        (t) =>
          t.item_description?.toLowerCase().includes(q) ||
          t.task_description?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q) ||
          t.location_description?.toLowerCase().includes(q)
      )
    );
  }, [search, tasks]);

  const overdueCount = tasks.filter((t) => t.delay > 0).length;
  const plannedCount = tasks.filter((t) => !!t.id_group_task).length;
  const unplannedCount = tasks.filter((t) => !t.id_group_task).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f1f5f9" }}>
      {/* HEADER */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "#1e40af",
              color: "white",
              fontWeight: 800,
              fontSize: "13px",
              padding: "5px 10px",
              borderRadius: "6px",
              letterSpacing: "0.5px",
            }}
          >
            FEMA
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              Planificador de OTs
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Fracttal One · Instancia 5495
            </div>
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
          Transportes de Carga FEMA S.A. de C.V.
        </div>
      </header>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* PANEL IZQUIERDO */}
        <div
          style={{
            width: "380px",
            flexShrink: 0,
            background: "#f8fafc",
            borderRight: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Subheader izquierdo */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e2e8f0",
              background: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                  TAREAS PENDIENTES
                </span>
                <span
                  style={{
                    background: "#1e40af",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  {loading ? "..." : `${filtered.length}/${tasks.length}`}
                </span>
              </div>
              {/* Botón refresh */}
              <button
                onClick={() => fetchTasks(true)}
                disabled={refreshing || loading}
                style={{
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "5px 8px",
                  cursor: refreshing ? "not-allowed" : "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  transition: "all 0.15s",
                }}
                title="Actualizar tareas"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                  }}
                >
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
            </div>

            {/* Stats rápidas */}
            {!loading && (
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <StatPill label="Atrasadas" value={overdueCount} color="#ef4444" />
                <StatPill label="Planificadas" value={plannedCount} color="#4f46e5" />
                <StatPill label="No planif." value={unplannedCount} color="#94a3b8" />
              </div>
            )}

            {/* Buscador */}
            <div style={{ position: "relative" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Buscar activo, tarea..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  outline: "none",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                  color: "#1e293b",
                }}
              />
            </div>

            {lastUpdated && (
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px", textAlign: "right" }}>
                Actualizado: {lastUpdated.toLocaleTimeString("es-MX")}
              </div>
            )}
          </div>

          {/* Lista de tarjetas */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
                <div style={{ fontSize: "13px" }}>Cargando tareas de Fracttal...</div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "16px",
                  textAlign: "center",
                  color: "#dc2626",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>⚠️</div>
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>✅</div>
                <div style={{ fontSize: "13px" }}>
                  {search ? "Sin resultados para tu búsqueda" : "No hay tareas pendientes"}
                </div>
              </div>
            )}

            {!loading &&
              !error &&
              filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
          </div>
        </div>

        {/* PANEL DERECHO - Detalle */}
        <div style={{ flex: 1, overflow: "hidden", background: "white" }}>
          <TaskDetail task={selectedTask} />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: color + "12",
        border: `1px solid ${color}30`,
        borderRadius: "8px",
        padding: "5px 8px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600 }}>{label}</div>
    </div>
  );
}
