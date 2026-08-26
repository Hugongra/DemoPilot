import { getSession } from "@/lib/live/session-manager";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);

  if (!session || session.status !== "active") {
    return Response.json({ error: "Session not found or ended" }, { status: 404 });
  }

  try {
    const buffer = await session.page.screenshot({ type: "jpeg", quality: 70 });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return Response.json({ error: "Failed to capture screenshot" }, { status: 500 });
  }
}
