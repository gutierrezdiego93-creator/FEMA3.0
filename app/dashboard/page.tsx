"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FracttalTask, FracttalWorkOrder } from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import TaskDetail from "@/components/TaskDetail";
import WorkOrderCard from "@/components/WorkOrderCard";
import WorkOrderDetail from "@/components/WorkOrderDetail";

type FilterType = "all" | "overdue" | "planned" | "unplanned";
type DetailMode = "none" | "task" | "wo";

function isOverdue(task: FracttalTask): boolean {
  if (task.delay && task.delay > 0) return true;
  if (!task.date_maintenance) return false;
  return new Date(task.date_maintenance) < new Date();
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<{ full_name: string; code: string } | null>(null);

  // ---- Tareas pendientes (ya existente) ----
  const [tasks, setTasks] = useState<FracttalTask[]>([]);
  const [filtered, setFiltered] = useState<FracttalTask[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ---- OTs en proceso (nuevo) ----
  const [workOrders, setWorkOrders] = useState<FracttalWorkOrder[]>([]);
  const [loadingWO, setLoadingWO] = useState(true);
  const [refreshingWO, setRefreshingWO] = useState(false);

  // ---- Selección y panel central ----
  const [detailMode, setDetailMode] = useState<DetailMode>("none");
  const [selectedTask, setSelectedTask] = useState<FracttalTask | null>(null);
  const [selectedWO, setSelectedWO] = useState<FracttalWorkOrder | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("fema_user");
    if (!session) { router.replace("/login"); return; }
    setSessionUser(JSON.parse(session));
  }, [router]);

  // ---- Fetch tareas pendientes ----
  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Error " + res.status);
      const data = await res.json();
      const taskList: FracttalTask[] = data.data || data || [];
      taskList.sort((a, b) => b.id - a.id);
      setTasks(taskList);
      setLastUpdated(new Date());
    } catch (err) {
      setError("No se pudieron cargar las tareas. Verifica la conexion con Fracttal.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---- Fetch OTs en proceso ----
  const fetchWorkOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshingWO(true);
    else setLoadingWO(true);
    try {
      const res = await fetch("/api/work-orders-list");
      if (!res.ok) throw new Error("Error " + res.status);
      const data = await res.json();
      const woList: FracttalWorkOrder[] = data.data || [];
      setWorkOrders(woList);
    } catch (err) {
      // silencioso: si falla, columna queda vacia sin romper el resto
    } finally {
      setLoadingWO(false);
      setRefreshingWO(false);
    }
  }, []);

  useEffect(() => { if (sessionUser) { fetchTasks(); fetchWorkOrders(); } }, [fetchTasks, fetchWorkOrders, sessionUser]);

  useEffect(() => {
    const interval = setInterval(() => { fetchTasks(true); fetchWorkOrders(true); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchWorkOrders]);

  useEffect(() => {
    let result = [...tasks];
    if (activeFilter === "overdue") result = result.filter((t) => isOverdue(t));
    else if (activeFilter === "planned") result = result.filter((t) => !!t.id_group_task);
    else if (activeFilter === "unplanned") result = result.filter((t) => !t.id_group_task);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.item_description?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.code?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, tasks, activeFilter]);

  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const plannedCount = tasks.filter((t) => !!t.id_group_task).length;
  const unplannedCount = tasks.filter((t) => !t.id_group_task).length;

  const handleFilter = (filter: FilterType) => {
    setActiveFilter(prev => prev === filter ? "all" : filter);
    setSelectedTask(null);
    setDetailMode("none");
  };

  const handleSelectTask = (task: FracttalTask) => {
    setSelectedTask(task);
    setSelectedWO(null);
    setDetailMode("task");
  };

  const handleSelectWO = (wo: FracttalWorkOrder) => {
    setSelectedWO(wo);
    setSelectedTask(null);
    setDetailMode("wo");
  };

  const handleSelectFolioFromDetail = (folio: string) => {
    const found = workOrders.find((w) => w.wo_folio === folio);
    if (found) handleSelectWO(found);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("fema_user");
    router.replace("/login");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f1f5f9" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#1e40af", color: "white", fontWeight: 800, fontSize: "13px", padding: "5px 10px", borderRadius: "6px", letterSpacing: "0.5px" }}>FEMA</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Planificador de OTs</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Fracttal One · Instancia 5495</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {sessionUser && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              👤 <strong>{sessionUser.full_name.trim()}</strong>
            </div>
          )}
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Transportes de Carga FEMA S.A. de C.V.</div>
          <button onClick={handleLogout} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#94a3b8", cursor: "pointer" }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ===== COLUMNA IZQUIERDA: TAREAS PENDIENTES (sin cambios) ===== */}
        <div style={{ width: "340px", flexShrink: 0, background: "#f8fafc", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>TAREAS PENDIENTES</span>
                <span style={{ background: "#1e40af", color: "white", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>
                  {loading ? "..." : filtered.length + "/" + tasks.length}
                </span>
              </div>
              <button onClick={() => fetchTasks(true)} disabled={refreshing || loading} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "5px 8px", cursor: refreshing ? "not-allowed" : "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
                  <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>

            {!loading && (
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <FilterPill label="Atrasadas" value={overdueCount} color="#ef4444" active={activeFilter === "overdue"} onClick={() => handleFilter("overdue")} />
                <FilterPill label="Planificadas" value={plannedCount} color="#4f46e5" active={activeFilter === "planned"} onClick={() => handleFilter("planned")} />
                <FilterPill label="No planif." value={unplannedCount} color="#94a3b8" active={activeFilter === "unplanned"} onClick={() => handleFilter("unplanned")} />
              </div>
            )}

            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Buscar activo, tarea..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", outline: "none", background: "#f8fafc", boxSizing: "border-box", color: "#1e293b" }} />
            </div>

            {lastUpdated && (
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px", textAlign: "right" }}>
                Actualizado: {lastUpdated.toLocaleTimeString("es-MX")}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div><div style={{ fontSize: "13px" }}>Cargando...</div></div>}
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "16px", textAlign: "center", color: "#dc2626", fontSize: "13px" }}>{error}</div>}
            {!loading && !error && filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><div style={{ fontSize: "13px" }}>{search || activeFilter !== "all" ? "Sin resultados" : "No hay tareas pendientes"}</div></div>}
            {!loading && !error && filtered.map((task) => (
              <TaskCard key={task.id} task={task} isSelected={selectedTask?.id === task.id} onClick={() => handleSelectTask(task)} />
            ))}
          </div>
        </div>

        {/* ===== PANEL CENTRAL: DETALLE (segun lo seleccionado) ===== */}
        <div style={{ flex: 1, overflow: "hidden", background: "white" }}>
          {detailMode === "task" && <TaskDetail task={selectedTask} />}
          {detailMode === "wo" && selectedWO && (
            <WorkOrderDetail wo={selectedWO} allWorkOrders={workOrders} onSelectFolio={handleSelectFolioFromDetail} />
          )}
          {detailMode === "none" && <TaskDetail task={null} />}
        </div>

        {/* ===== COLUMNA DERECHA: OTs EN PROCESO (nuevo) ===== */}
        <div style={{ width: "340px", flexShrink: 0, background: "#f8fafc", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>OTs EN PROCESO</span>
                <span style={{ background: "#ea580c", color: "white", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>
                  {loadingWO ? "..." : workOrders.length}
                </span>
              </div>
              <button onClick={() => fetchWorkOrders(true)} disabled={refreshingWO || loadingWO} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "5px 8px", cursor: refreshingWO ? "not-allowed" : "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: refreshingWO ? "spin 1s linear infinite" : "none" }}>
                  <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loadingWO && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><div style={{ fontSize: "13px" }}>Cargando OTs...</div></div>}
            {!loadingWO && workOrders.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><div style={{ fontSize: "13px" }}>No hay OTs en proceso</div></div>}
            {!loadingWO && workOrders.map((wo) => (
              <WorkOrderCard
                key={wo.wo_folio}
                wo={wo}
                isSelected={selectedWO?.wo_folio === wo.wo_folio}
                onClick={() => handleSelectWO(wo)}
                hasChildren={workOrders.some((w) => (w as any).annotations?.id_wo_related === wo.wo_folio)}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}

function FilterPill({ label, value, color, active, onClick }: { label: string; value: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ flex: 1, background: active ? color : color + "12", border: "2px solid " + (active ? color : color + "30"), borderRadius: "8px", padding: "5px 8px", textAlign: "center", cursor: "pointer", userSelect: "none" }}>
      <div style={{ fontSize: "14px", fontWeight: 800, color: active ? "white" : color }}>{value}</div>
      <div style={{ fontSize: "9px", color: active ? "white" : "#94a3b8", fontWeight: 600 }}>{label}</div>
    </div>
  );
}
