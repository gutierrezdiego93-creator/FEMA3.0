// app/api/tasks/route.ts
// Endpoint que consulta las tareas pendientes a Fracttal y las devuelve al frontend

import { getFracttalToken } from "@/lib/fracttal-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getFracttalToken();
    const companyId = process.env.FRACTTAL_COMPANY_ID;
    const apiUrl = process.env.FRACTTAL_API_URL;

    // Llamada a Fracttal para tareas pendientes
    const response = await fetch(
      `${apiUrl}/api/maintenance/tasks/todo?id_company=${companyId}&limit=200&start=0`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // No cachear en el servidor para siempre tener datos frescos
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error Fracttal:", response.status, errorText);
      return NextResponse.json(
        { error: `Error de Fracttal: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en /api/tasks:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
