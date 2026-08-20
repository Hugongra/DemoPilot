import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file) {
    return Response.json({ error: "Missing file param" }, { status: 400 });
  }

  const supabase = await createClient();
  const path = `demos/${id}/${file}`;

  // Try download first
  const { data, error } = await supabase.storage
    .from("demo-assets")
    .download(path);

  if (error || !data) {
    // Fallback: try to get public URL and redirect
    const { data: urlData } = supabase.storage
      .from("demo-assets")
      .getPublicUrl(path);

    if (urlData?.publicUrl) {
      return Response.redirect(urlData.publicUrl, 302);
    }

    return Response.json(
      { error: "File not found", detail: error?.message },
      { status: 404 }
    );
  }

  const contentType = file.endsWith(".mp3")
    ? "audio/mpeg"
    : file.endsWith(".jpg")
      ? "image/jpeg"
      : "application/octet-stream";

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
