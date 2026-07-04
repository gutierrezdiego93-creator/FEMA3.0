"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Personnel {
  full_name: string;
  code: string;
  account_email: string;
  id_personnel: number;
}

interface SessionUser {
  full_name: string;
  code: string;
}

const MODO_OPTIONS = [
  { value: "1", label: "Todo en una OT" },
  { value: "2", label: "Generar una OT por Activo" },
  { value: "3", label: "Generar una OT por Tarea" },
];

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(3, "0") + ":" + String(m).padStart(2, "0");
}

function parseDuration(str: string): number {
  const parts = str.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return (hours * 60 + minutes) * 60;
}

function ResponsableModal(props: {
  technicians: Personnel[];
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const technicians = props.technicians;
  const onSelect = props.onSelect;
  const onClose = props.onClose;
  const [search, setSearch] = useState("");

  const filtered = technicians.filter(function (t) {
    return t.full_name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}
    >
      <div
        onClick={function (e) { e.stopPropagation(); }}
        style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Seleccionar Responsable</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={function (e) { setSearch(e.target.value); }}
              style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#1e293b" }}
            />
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: "13px" }}>Sin resultados</div>
          )}
          {filtered.map(function (t) {
            return (
              <div
                key={t.code}
                onClick={function () { onSelect(t.code); }}
                style={{ padding: "12px 14px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                  {t.full_name.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{t.full_name.trim()}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t.code}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CreateOTContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const taskDesc = searchParams.get("desc") || "";
  const itemDesc = searchParams.get("item") || "";
  const itemCode = searchParams.get("itemCode") || "";
  const duration = parseInt(searchParams.get("duration") || "0");
  const taskType = searchParams.get("type") || "";
  const mode = searchParams.get("mode") || "padre";
  const parentFolio = searchParams.get("parentFolio") || "";
  const excludeCode = searchParams.get("excludeCode") || "";

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [technicians, setTechnicians] = useState<Personnel[]>([]);

  const [modo, setModo] = useState("1");
  const [responsible, setResponsible] = useState("");
  const [durationStr, setDurationStr] = useState(formatDuration(duration));
  const originalDurationStr = formatDuration(duration); // fijo, nunca cambia
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ wo_folio: string; responsible: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(function () {
    const session = sessionStorage.getItem("fema_user");
    if (!session) { router.replace("/login"); return; }
    setSessionUser(JSON.parse(session));

    fetch("/api/technicians")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const all: Personnel[] = data.data || [];
        const list = mode === "hija" && excludeCode
          ? all.filter(function (t) { return t.code !== excludeCode; })
          : all;
        setTechnicians(list);
      })
      .catch(function () {});
  }, [router, mode, excludeCode]);

  const selectedTech = technicians.find(function (t) { return t.code === responsible; });

  const handleCreate = async function () {
    if (!responsible || !sessionUser) return;
    setCreating(true);
    setError(null);

    let body: any;

    const durationSeconds = String(parseDuration(durationStr));

    if (mode === "hija" && parentFolio) {
      body = {
        type: 2,
        item_code: itemCode,
        responsible_code: responsible,
        account_code: sessionUser.code,
        requested_by: sessionUser.full_name,
        task_descripcion: (taskDesc || "Tarea sin descripcion").substring(0, 200),
        task_type_main: taskType || "Correctivo",
        duration: durationSeconds,
        annotations: {
          id_wo_related: parentFolio,
          code_wo_related: "OT-" + parentFolio,
          wo_related_status: "OPEN",
        },
      };
    } else {
      body = {
        type: 1,
        responsible_code: responsible,
        account_code: sessionUser.code,
        duration: durationSeconds,
        tasks_todo: [{ tasks_todo_id: parseInt(taskId || "0") }],
      };
    }

    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const detail = data.detail || data.data;
        const detailMsg = Array.isArray(detail) && detail[0] && detail[0].ERROR ? detail[0].ERROR : "";
        setError("Error al crear la OT." + (detailMsg ? " " + detailMsg : " Verifica los datos e intenta nuevamente."));
        setCreating(false);
        return;
      }

      const woData = data.data;
      const techName = selectedTech ? selectedTech.full_name : responsible;
      setResult({ wo_folio: woData.wo_folio, responsible: techName });
    } catch (err) {
      setError("Error de conexión con Fracttal.");
    } finally {
      setCreating(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1e293b",
    background: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.4px",
    marginBottom: "5px",
    display: "block",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1e293b",
    background: "white",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
    cursor: "pointer",
  };

  const isHija = mode === "hija";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {showModal && (
        <ResponsableModal
          technicians={technicians}
          onSelect={function (code) { setResponsible(code); setShowModal(false); }}
          onClose={function () { setShowModal(false); }}
        />
      )}

      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={function () { router.back(); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "13px", padding: "6px 0" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }} />
          <div style={{ background: "#1e40af", color: "white", fontWeight: 800, fontSize: "13px", padding: "4px 10px", borderRadius: "6px" }}>FEMA</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
            {isHija ? "Agregar Técnico (OT Hija de OT-" + parentFolio + ")" : "Generar Nueva Orden de Trabajo"}
          </div>
        </div>

        {!result && (
          <button
            onClick={handleCreate}
            disabled={!responsible || creating}
            style={{ background: responsible ? "#1e40af" : "#e2e8f0", color: responsible ? "white" : "#94a3b8", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: 700, cursor: responsible ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {creating ? "Creando OT..." : "Generar OT"}
          </button>
        )}
      </header>

      <div style={{ maxWidth: "900px", margin: "32px auto", padding: "0 24px" }}>
        {isHija && !result && (
          <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#4338ca", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2.5">
              <path d="M12 2L22 12L12 22L2 12Z" />
            </svg>
            Esta orden quedará ligada como hija de <strong>OT-{parentFolio}</strong>
          </div>
        )}

        {result && (
          <div style={{ background: "white", borderRadius: "16px", padding: "48px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              {isHija ? "OT Hija Creada" : "Orden de Trabajo Creada"}
            </div>
            <div style={{ display: "inline-block", background: "#eff6ff", border: "2px solid #1e40af", borderRadius: "12px", padding: "12px 32px", fontSize: "28px", fontWeight: 800, color: "#1e40af", marginBottom: "16px", letterSpacing: "1px" }}>
              {result.wo_folio}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "32px" }}>
              Responsable: <strong>{result.responsible}</strong>
              {isHija && <div style={{ marginTop: "4px" }}>Ligada a OT-{parentFolio}</div>}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={function () { router.push("/dashboard"); }} style={{ background: "#1e40af", color: "white", border: "none", borderRadius: "10px", padding: "12px 28px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                Finalizar
              </button>
              {!isHija && (
                <button
                  onClick={function () {
                    const params = new URLSearchParams();
                    params.set("parentFolio", result.wo_folio);
                    params.set("item", itemDesc);
                    params.set("itemCode", itemCode || searchParams.get("code") || "");
                    params.set("desc", taskDesc);
                    params.set("type", taskType);
                    params.set("duration", String(duration));
                    params.set("date", searchParams.get("date") || "");
                    params.set("plan", searchParams.get("plan") || "");
                    params.set("priority", searchParams.get("priority") || "");
                    params.set("excludeCode", responsible);
                    router.push("/assign-technicians?" + params.toString());
                  }}
                  style={{ background: "white", color: "#1e40af", border: "2px solid #1e40af", borderRadius: "10px", padding: "12px 28px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                >
                  + Agregar técnicos
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 16px", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {!result && (
          <div style={{ background: "white", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ ...labelStyle, color: responsible ? "#64748b" : "#ef4444" }}>RESPONSABLE *</label>
                <button
                  type="button"
                  onClick={function () { setShowModal(true); }}
                  style={{ ...inputStyle, border: "1px solid " + (responsible ? "#e2e8f0" : "#fca5a5"), textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span style={{ color: responsible ? "#1e293b" : "#94a3b8" }}>
                    {selectedTech ? selectedTech.full_name.trim() : "Selecciona el responsable"}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
                {!responsible && (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Responsable no puede estar en blanco
                  </div>
                )}
                {isHija && (
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                    El técnico de la OT padre no aparece en esta lista
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>TIEMPO DE EJECUCIÓN</label>
                <input
                  type="text"
                  value={durationStr}
                  onChange={function (e) { setDurationStr(e.target.value); }}
                  placeholder="000:30"
                  style={inputStyle}
                />
                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                  Formato: HHH:MM
                </div>
              </div>
            </div>

            {!isHija && (
              <div style={{ marginBottom: "28px" }}>
                <label style={labelStyle}>MODO DE CREACIÓN</label>
                <select value={modo} onChange={function (e) { setModo(e.target.value); }} style={{ ...selectStyle, maxWidth: "400px" }}>
                  {MODO_OPTIONS.map(function (o) {
                    return <option key={o.value} value={o.value}>{o.label}</option>;
                  })}
                </select>
              </div>
            )}

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Activo", "Tarea", "Tipo de Tarea", "Fecha Programada", "Plan de Tareas", "Duración Estimada", "Prioridad"].map(function (h) {
                      return (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 14px", color: "#1e293b", fontWeight: 500 }}>{itemDesc || "-"}</td>
                    <td style={{ padding: "12px 14px", color: "#1e293b" }}>{taskDesc || "-"}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{taskType || "-"}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{(searchParams.get("date") || "").split("T")[0] || "-"}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{searchParams.get("plan") || "-"}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{originalDurationStr}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{searchParams.get("priority") || "Media"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateOTPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>}>
      <CreateOTContent />
    </Suspense>
  );
}
