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
  // Fracttal expresa duration en SEGUNDOS. Convertimos a HHH:MM
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(3, "0") + ":" + String(m).padStart(2, "0");
}

function parseDuration(str: string): number {
  // Convierte HHH:MM de vuelta a segundos (formato que espera Fracttal)
  const parts = str.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return (hours * 60 + minutes) * 60;
}

function CreateOTContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const taskDesc = searchParams.get("desc") || "";
  const itemDesc = searchParams.get("item") || "";
  const itemCode = searchParams.get("code") || "";
  const duration = parseInt(searchParams.get("duration") || "0");
  const taskType = searchParams.get("type") || "";

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [technicians, setTechnicians] = useState<Personnel[]>([]);
  const [loadingTech, setLoadingTech] = useState(true);

  const [modo, setModo] = useState("1");
  const [responsible, setResponsible] = useState("");
  const [durationStr, setDurationStr] = useState(formatDuration(duration));
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ wo_folio: string; responsible: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("fema_user");
    if (!session) { router.replace("/login"); return; }
    setSessionUser(JSON.parse(session));

    fetch("/api/personnel")
      .then((r) => r.json())
      .then((data) => {
        setTechnicians(data.data || []);
        setLoadingTech(false);
      })
      .catch(() => setLoadingTech(false));
  }, [router]);

  const handleCreate = async () => {
    if (!responsible || !sessionUser) return;
    setCreating(true);
    setError(null);

    const durationMinutes = parseDuration(durationStr);

    const body: any = {
      type: 1,
      responsible_code: responsible,
      account_code: sessionUser.code,
      tasks_todo: [{ tasks_todo_id: parseInt(taskId || "0") }],
    };

    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError("Error al crear la OT. Verifica los datos e intenta nuevamente.");
        setCreating(false);
        return;
      }

      const woData = data.data;
      const techName = technicians.find((t) => t.code === responsible)?.full_name || responsible;
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

  const readonlyStyle: React.CSSProperties = {
    ...inputStyle,
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
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
    ...inputStyle,
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#64748b",
              fontSize: "13px",
              padding: "6px 0",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }} />
          <div
            style={{
              background: "#1e40af",
              color: "white",
              fontWeight: 800,
              fontSize: "13px",
              padding: "4px 10px",
              borderRadius: "6px",
            }}
          >
            FEMA
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
            Generar Nueva Orden de Trabajo
          </div>
        </div>

        {!result && (
          <button
            onClick={handleCreate}
            disabled={!responsible || creating}
            style={{
              background: responsible ? "#1e40af" : "#e2e8f0",
              color: responsible ? "white" : "#94a3b8",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: responsible ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
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
        {/* RESULTADO EXITOSO */}
        {result && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "48px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              Orden de Trabajo Creada
            </div>
            <div
              style={{
                display: "inline-block",
                background: "#eff6ff",
                border: "2px solid #1e40af",
                borderRadius: "12px",
                padding: "12px 32px",
                fontSize: "28px",
                fontWeight: 800,
                color: "#1e40af",
                marginBottom: "16px",
                letterSpacing: "1px",
              }}
            >
              {result.wo_folio}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "32px" }}>
              Responsable: <strong>{result.responsible}</strong>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  background: "#1e40af",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Finalizar
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                disabled
                style={{
                  background: "#f1f5f9",
                  color: "#94a3b8",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "not-allowed",
                }}
              >
                + Agregar técnicos (Próx. etapa)
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "14px 16px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* FORMULARIO */}
        {!result && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            {/* Fila 1: Responsable + Tiempo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ ...labelStyle, color: responsible ? "#64748b" : "#ef4444" }}>
                  RESPONSABLE *
                </label>
                <select
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  style={{
                    ...selectStyle,
                    border: "1px solid " + (responsible ? "#e2e8f0" : "#fca5a5"),
                  }}
                >
                  <option value="">Selecciona el responsable</option>
                  {technicians.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.full_name.trim()}
                    </option>
                  ))}
                </select>
                {!responsible && (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Responsable no puede estar en blanco
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>TIEMPO DE EJECUCIÓN</label>
                <input
                  type="text"
                  value={durationStr}
                  onChange={(e) => setDurationStr(e.target.value)}
                  placeholder="000:30"
                  style={inputStyle}
                />
                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                  Formato: HHH:MM (ej. 001:30 = 1h 30min)
                </div>
              </div>
            </div>

            {/* Fila 2: Modo + Depende de OT */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
              <div>
                <label style={labelStyle}>MODO DE CREACIÓN</label>
                <select
                  value={modo}
                  onChange={(e) => setModo(e.target.value)}
                  style={selectStyle}
                >
                  {MODO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>¿DEPENDE DE OTRA OT?</label>
                <input
                  type="text"
                  placeholder="Seleccione la OT padre"
                  disabled
                  style={readonlyStyle}
                />
              </div>
            </div>

            {/* Tabla de tareas */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Activo", "Tarea", "Tipo de Tarea", "Fecha Programada", "Plan de Tareas", "Duración Estimada", "Prioridad"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#64748b",
                          borderBottom: "1px solid #e2e8f0",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 14px", color: "#1e293b", fontWeight: 500 }}>
                      {itemDesc || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#1e293b" }}>
                      {taskDesc || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {taskType || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {searchParams.get("date")?.split("T")[0] || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {searchParams.get("plan") || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {durationStr}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {searchParams.get("priority") || "Media"}
                    </td>
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
