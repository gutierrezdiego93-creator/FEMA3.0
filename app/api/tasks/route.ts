import { getFracttalToken } from "@/lib/fracttal-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getFracttalToken();

    // Endpoint correcto: tareas pendientes con activo, fecha, atraso, etc.
    const response = await fetch(
      `https://app.fracttal.com/api/tasks_todo/?limit=200`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error Fracttal:", response.status, errorText);
      return NextResponse.json(
        { error: `Error de Fracttal: ${response.status} - ${errorText}` },
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
