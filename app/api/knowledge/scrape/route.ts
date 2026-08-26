import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await request.json();
  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DemoPilot-Knowledge-Bot/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    // Extract text content from HTML (basic extraction)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000); // Cap at 10k chars

    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || new URL(url).hostname;

    // Save to knowledge base
    const { data, error } = await supabase
      .from("product_knowledge")
      .insert({
        user_id: user.id,
        source_type: "url",
        title,
        content: textContent,
        source_url: url,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ item: data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
