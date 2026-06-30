import { getFracttalToken } from "@/lib/fracttal-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = await getFracttalToken();
    const body = await request.json();

    const response = await fetch(
      "https://app.fracttal.com/api/work_orders/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error de Fracttal: " + response.status, detail: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
