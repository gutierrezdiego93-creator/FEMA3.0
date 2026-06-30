// app/api/work-orders-list/route.ts
// Trae las OTs en proceso (ot_status=1) para la columna derecha del dashboard

import { getFracttalToken } from "@/lib/fracttal-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getFracttalToken();

    const response = await fetch(
      "https://app.fracttal.com/api/work_orders/?ot_status=1&limit=100",
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
      return NextResponse.json(
        { error: "Error de Fracttal: " + response.status, detail: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
