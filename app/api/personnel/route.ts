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
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Error de Fracttal: " + response.status, detail: errorText, tokenPreview: token ? token.slice(0, 20) + "..." : null },
        { status: response.status }
      );
    }

    const data = await response.json();
    const all = data.data || [];

    const admins = all.filter(
      (p: any) =>
        p.groups_permissions_description === "Administrator" &&
        p.account_active === true &&
        p.active === true &&
        p.code &&
        p.code !== "INT-MFM-01"
    );

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    return NextResponse.json({ error: "Error interno", detail: String(error) }, { status: 500 });
  }
}
