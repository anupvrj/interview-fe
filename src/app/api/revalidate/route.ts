import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!secret || bearer !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      paths?: string[];
      tags?: string[];
    };

    for (const path of body.paths ?? []) {
      if (typeof path === "string" && path.startsWith("/")) {
        revalidatePath(path, "page");
      }
    }

    for (const tag of body.tags ?? []) {
      if (typeof tag === "string" && tag.trim()) {
        revalidateTag(tag.trim(), { expire: 0 });
      }
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
