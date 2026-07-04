"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Personnel {
  full_name: string;
  code: string;
  id_personnel: number;
}

interface TechCard {
  id: string;
  code: string;
  name: string;
  durationStr: string;
}

function parseDuration(str: string): number {
  const parts = str.split(":");
  if (parts.length !== 2) return 600;
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return (hours * 60 + minutes) * 60;
}

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(3, "0") + ":" + String(m).padStart(2, "0");
}

// Modal de seleccion de tecnico
function TechModal(props: {
  technicians: Personnel[];
  usedCodes: string[];
  onSelect: (code: string, name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = props.technicians.filter(function (t) {
    const notUsed = !props.usedCodes.includes(t.code);
    const matches = t.full_name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    return notUsed && matches;
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={props.onClose}
    >
      <div
        onClick={function (e) { e.stopPropagation(); }}
        style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Seleccionar Técnico</div>
          <button onClick={props.onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "20px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <input
              autoFocus
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={function (e) { setSearch(e.target.value); }}
              style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#1e293b" }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
            {filtered.length} disponibles
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: "13px" }}>
              {search ? "Sin resultados" : "No hay técnicos disponibles"}
            </div>
          )}
          {filtered.map(function (t) {
            return (
              <div
                key={t.code}
                onClick={function () { props.onSelect(t.code, t.full_name.trim()); }}
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

function AssignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentFolio = searchParams.get("parentFolio") || "";
  const itemDesc = searchParams.get("item") || "";
  const taskDesc = searchParams.get("desc") || "";
  const taskType = searchParams.get("type") || "";
  const duration = parseInt(searchParams.get("duration") || "0");
  const itemCode = searchParams.get("itemCode") || "";
  const excludeCode = searchParams.get("excludeCode") || "";
  const originalDuration = formatDuration(duration);

  const [sessionUser, setSessionUser] = useState<{ full_name: string; code: string } | null>(null);
  const [technicians, setTechnicians] = useState<Personnel[]>([]);
  const [cards, setCards] = useState<TechCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<{ folio: string; name: string }[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(function () {
    const session = sessionStorage.getItem("fema_user");
    if (!session) { router.replace("/login"); return; }
    setSessionUser(JSON.parse(session));

    fetch("/api/technicians")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const all: Personnel[] = data.data || [];
        // Excluir el tecnico padre
        setTechnicians(all.filter(function (t) { return t.code !== excludeCode; }));
      })
      .catch(function () {});
  }, [router, excludeCode]);

  // Todos los codigos ya usados (para no repetir en el modal)
  const usedCodes = [excludeCode, ...cards.map(function (c) { return c.code; })];

  const handleAddTech = function (code: string, name: string) {
    const newCard: TechCard = {
      id: Date.now().toString(),
      code,
      name,
      durationStr: originalDuration,
    };
    setCards(function (prev) { return [...prev, newCard]; });
    setShowModal(false);
  };

  const handleRemoveCard = function (id: string) {
    setCards(function (prev) { return prev.filter(function (c) { return c.id !== id; }); });
  };

  const handleDurationChange = function (id: string, val: string) {
    setCards(function (prev) { return prev.map(function (c) { return c.id === id ? { ...c, durationStr: val } : c; }); });
  };

  const handleCreate = async function () {
    if (cards.length === 0 || !sessionUser) return;

    // Validar que todas las tarjetas tengan responsable (ya lo tienen por diseño)
    setCreating(true);
    setErrors([]);

    const newResults: { folio: string; name: string }[] = [];
    const newErrors: string[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const body: any = {
        type: 2,
        item_code: itemCode,
        responsible_code: card.code,
        account_code: sessionUser.code,
        requested_by: sessionUser.full_name,
        task_descripcion: (taskDesc || "Tarea sin descripcion").substring(0, 200),
        task_type_main: taskType || "Correctivo",
        duration: String(parseDuration(card.durationStr)),
        annotations: {
          id_wo_related: parentFolio,
          code_wo_related: "OT-" + parentFolio,
          wo_related_status: "OPEN",
        },
      };

      try {
        const res = await fetch("/api/work-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          newResults.push({ folio: data.data.wo_folio, name: card.name });
        } else {
          newErrors.push("Error creando OT para " + card.name);
        }
      } catch (err) {
        newErrors.push("Error de conexion para " + card.name);
      }
    }

    setResults(newResults);
    if (newErrors.length > 0) setErrors(newErrors);
    setCreating(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1e293b",
    background: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {showModal && (
        <TechModal
          technicians={technicians}
          usedCodes={usedCodes}
          onSelect={handleAddTech}
          onClose={function () { setShowModal(false); }}
        />
      )}

      {/* HEADER */}
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={function () { router.push("/dashboard"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "13px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver al dashboard
          </button>
          <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }} />
          <div style={{ background: "#1e40af", color: "white", fontWeight: 800, fontSize: "13px", padding: "4px 10px", borderRadius: "6px" }}>FEMA</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
            Agregar Técnicos a OT-{parentFolio}
          </div>
        </div>
        {!results && cards.length > 0 && (
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{ background: "#1e40af", color: "white", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer" }}
          >
            {creating ? "Creando..." : "⚡ Crear OTs (" + cards.length + ")"}
          </button>
        )}
      </header>

      <div style={{ maxWidth: "1000px", margin: "24px auto", padding: "0 24px" }}>

        {/* RESULTADOS */}
        {results && (
          <div style={{ background: "white", borderRadius: "16px", padding: "40px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "20px" }}>
              {results.length} OT{results.length > 1 ? "s" : ""} creada{results.length > 1 ? "s" : ""} exitosamente
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
              {results.map(function (r) {
                return (
                  <div key={r.folio} style={{ background: "#eff6ff", border: "2px solid #1e40af", borderRadius: "10px", padding: "10px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e40af" }}>{r.folio}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{r.name}</div>
                  </div>
                );
              })}
            </div>
            {errors.length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                {errors.map(function (e, i) { return <div key={i} style={{ fontSize: "12px", color: "#dc2626" }}>{e}</div>; })}
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "24px" }}>
              Todas ligadas a <strong>OT-{parentFolio}</strong> via annotations
            </div>
            <button
              onClick={function () { router.push("/dashboard"); }}
              style={{ background: "#1e40af", color: "white", border: "none", borderRadius: "10px", padding: "12px 32px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              Volver al dashboard
            </button>
          </div>
        )}

        {!results && (
          <>
            {/* BANNER CONTEXTO */}
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "12px" }}>
                <span style={{ color: "#4338ca", fontWeight: 700, fontSize: "13px" }}>◇ OT PADRE: {parentFolio}</span>
                <span style={{ color: "#94a3b8" }}>|</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Activo:</span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>{itemDesc}</span>
                <span style={{ color: "#94a3b8" }}>|</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Tarea:</span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>{taskDesc}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "6px" }}>
                👤 Técnico padre excluido de la selección
              </div>
            </div>

            {/* BOTÓN AGREGAR */}
            <button
              onClick={function () { setShowModal(true); }}
              disabled={technicians.length === usedCodes.length}
              style={{ background: "white", border: "1.5px solid #1e40af", color: "#1e40af", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginBottom: "16px" }}
            >
              + Agregar técnico
            </button>

            {/* TARJETAS */}
            {cards.length === 0 && (
              <div style={{ background: "white", border: "1.5px dashed #e2e8f0", borderRadius: "12px", padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Haz clic en "+ Agregar técnico" para comenzar la asignación
              </div>
            )}

            {cards.map(function (card, index) {
              return (
                <div key={card.id} style={{ background: "white", border: "1.5px solid #c7d2fe", borderRadius: "12px", padding: "18px", marginBottom: "14px", position: "relative" }}>
                  {/* Badge y borrar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ background: "#eef2ff", color: "#4338ca", fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>
                      TÉCNICO {index + 1}
                    </span>
                    <button
                      onClick={function () { handleRemoveCard(card.id); }}
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      🗑
                    </button>
                  </div>

                  {/* Responsable + Tiempo */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", letterSpacing: "0.4px", marginBottom: "5px" }}>RESPONSABLE</div>
                      <div style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontWeight: 600 }}>{card.name}</span>
                        <button
                          onClick={function () { handleRemoveCard(card.id); setShowModal(true); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "12px" }}
                        >
                          cambiar
                        </button>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", letterSpacing: "0.4px", marginBottom: "5px" }}>TIEMPO DE EJECUCIÓN</div>
                      <input
                        type="text"
                        value={card.durationStr}
                        onChange={function (e) { handleDurationChange(card.id, e.target.value); }}
                        style={inputStyle}
                        placeholder="000:30"
                      />
                      <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>Formato: HHH:MM</div>
                    </div>
                  </div>

                  {/* Tabla tarea */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Activo", "Tarea", "Tipo de Tarea", "Fecha Programada", "Plan de Tareas", "Duración Estimada", "Prioridad"].map(function (h) {
                          return <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: 600 }}>{itemDesc || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "#1e293b" }}>{taskDesc || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{taskType || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{(searchParams.get("date") || "").split("T")[0] || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{searchParams.get("plan") || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{originalDuration}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{searchParams.get("priority") || "Media"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* FOOTER */}
            {cards.length > 0 && (
              <div style={{ background: "white", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: "8px" }}>
                <button
                  onClick={function () { router.push("/dashboard"); }}
                  style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", color: "#64748b", borderRadius: "10px", padding: "10px 24px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Finalizar sin agregar
                </button>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {cards.length} técnico{cards.length > 1 ? "s" : ""} → se crearán {cards.length} OT{cards.length > 1 ? "s" : ""} hijas ligadas a OT-{parentFolio}
                </span>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{ background: "#1e40af", color: "white", border: "none", borderRadius: "10px", padding: "10px 28px", fontSize: "13px", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer" }}
                >
                  {creating ? "Creando..." : "⚡ Crear OTs (" + cards.length + ")"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AssignTechniciansPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>Cargando...</div>}>
      <AssignContent />
    </Suspense>
  );
}
