"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Personnel {
  full_name: string;
  code: string;
  account_email: string;
  id_personnel: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Personnel[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si ya hay sesión activa, ir directo al dashboard
    const session = sessionStorage.getItem("fema_user");
    if (session) {
      router.replace("/dashboard");
      return;
    }

    fetch("/api/personnel")
      .then((r) => r.json())
      .then((data) => {
        setAdmins(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo conectar con Fracttal");
        setLoading(false);
      });
  }, [router]);

  const handleEnter = () => {
    if (!selected) return;
    const user = admins.find((a) => a.code === selected);
    if (!user) return;
    setEntering(true);
    sessionStorage.setItem("fema_user", JSON.stringify(user));
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-block",
              background: "#1e40af",
              color: "white",
              fontWeight: 800,
              fontSize: "22px",
              padding: "8px 20px",
              borderRadius: "8px",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}
          >
            FEMA
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
            Planificador de OTs
          </div>
          <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            Transportes de Carga FEMA S.A. de C.V.
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "#e2e8f0",
            marginBottom: "28px",
          }}
        />

        <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
          ¿Quién eres?
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
            Cargando usuarios...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid " + (selected ? "#1e40af" : "#e2e8f0"),
                borderRadius: "10px",
                fontSize: "14px",
                color: selected ? "#1e293b" : "#94a3b8",
                background: "white",
                outline: "none",
                cursor: "pointer",
                marginBottom: "20px",
                transition: "border 0.15s",
                appearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "40px",
              }}
            >
              <option value="">Selecciona tu nombre...</option>
              {admins.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.full_name.trim()}
                </option>
              ))}
            </select>

            <button
              onClick={handleEnter}
              disabled={!selected || entering}
              style={{
                width: "100%",
                padding: "14px",
                background: selected ? "#1e40af" : "#e2e8f0",
                color: selected ? "white" : "#94a3b8",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: selected ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                letterSpacing: "0.3px",
              }}
            >
              {entering ? "Entrando..." : "Entrar"}
            </button>
          </>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "11px",
            color: "#cbd5e1",
          }}
        >
          Fracttal One · Instancia 5495
        </div>
      </div>
    </div>
  );
}
