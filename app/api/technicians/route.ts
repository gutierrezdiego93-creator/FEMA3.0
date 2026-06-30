// app/api/technicians/route.ts
// Trae TODOS los recursos humanos activos (Administradores + Tecnicos Limitados)
// para el selector de "Responsable" al crear una OT.
// NO confundir con /api/personnel que filtra solo Administradores para el login.

import { getFracttalToken } from "@/lib/fracttal-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getFracttalToken();

    const response = await fetch(
      "https://app.fracttal.com/api/personnel/?limit=200",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error de Fracttal: " + response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    const all = data.data || [];

    // Todos los activos con codigo, sin filtrar por grupo de permisos
    const technicians = all.filter(
      (p: any) =>
        p.active === true &&
        p.code &&
        p.code !== "INT-MFM-01"
    );

    return NextResponse.json({ success: true, data: technicians });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
