import { handleViewerMessage, getSession } from "@/lib/live/session-manager";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { message } = await request.json();

  if (!message) {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  const session = getSession(id);
  if (!session) {
    return Response.json({ error: "Session not found or not active" }, { status: 404 });
  }

  const response = await handleViewerMessage(id, message);

  return Response.json({ response, transcript: session.transcript.slice(-20) });
}
