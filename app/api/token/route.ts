// app/api/token/route.ts
// Este endpoint es interno - el frontend lo llama para verificar conexión

import { getFracttalToken } from "@/lib/fracttal-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getFracttalToken();
    // Solo devolvemos si hay token, sin exponer el valor real
    return NextResponse.json({ connected: !!token });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: "No se pudo conectar con Fracttal" },
      { status: 500 }
    );
  }
}
