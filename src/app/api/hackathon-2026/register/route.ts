import { NextResponse } from "next/server";
import { HACKATHON_PROFESSIONS } from "@/lib/hackathon-2026-content";

function isValidEmail(value: string) {
  const at = value.indexOf("@");
  const dot = value.lastIndexOf(".");
  return at > 0 && dot > at + 1 && dot < value.length - 1 && !value.includes(" ");
}

const PROFESSION_VALUES = new Set(
  HACKATHON_PROFESSIONS.map((item) => item.value),
);

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; profession?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const profession = typeof body.profession === "string" ? body.profession : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!PROFESSION_VALUES.has(profession as (typeof HACKATHON_PROFESSIONS)[number]["value"])) {
    return NextResponse.json({ error: "Select a valid profession." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
