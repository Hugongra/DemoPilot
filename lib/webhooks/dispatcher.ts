import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export type WebhookEvent =
  | "demo.created"
  | "demo.completed"
  | "demo.viewed"
  | "demo.cta_clicked"
  | "live_session.started"
  | "live_session.ended";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export async function dispatchWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  try {
    const supabase = await createClient();

    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .contains("events", [event]);

    if (!webhooks?.length) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-DemoPilot-Event": event,
        };

        if (webhook.secret) {
          const signature = crypto
            .createHmac("sha256", webhook.secret)
            .update(body)
            .digest("hex");
          headers["X-DemoPilot-Signature"] = signature;
        }

        await fetch(webhook.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(10000),
        });
      })
    );
  } catch {
    // Webhook dispatch should never block the main flow
  }
}
