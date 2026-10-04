import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";
import { COMPANION_SYSTEM_PROMPT } from "@/lib/companion/persona";

export const dynamic = "force-dynamic";

// Only the most recent turns are resent each time — enough for the companion
// to remember the conversation, without the cost growing forever.
const MAX_HISTORY_MESSAGES = 60;
const MAX_MESSAGE_CHARS = 4000;

const client = new Anthropic();

type ChatTurn = { role: "user" | "assistant"; content: string };

function parseHistory(body: unknown): ChatTurn[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw)) return null;

  const turns: ChatTurn[] = [];
  for (const m of raw) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      !m.content.trim()
    ) {
      return null;
    }
    turns.push({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) });
  }

  const recent = turns.slice(-MAX_HISTORY_MESSAGES);
  // The API requires the conversation to open with a user turn.
  while (recent.length && recent[0].role !== "user") recent.shift();
  if (!recent.length || recent[recent.length - 1].role !== "user") return null;
  return recent;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedAdminEmail(user.email)) {
    return new Response("غير مصرح", { status: 401 });
  }

  const messages = parseHistory(await request.json().catch(() => null));
  if (!messages) {
    return new Response("صيغة الرسائل غير صحيحة", { status: 400 });
  }

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // Casual chat doesn't need deep reasoning; low effort keeps replies quick
    // and cheap.
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    cache_control: { type: "ephemeral" },
    system: COMPANION_SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\nخلنا نغيّر الموضوع، هذا ما أقدر أكمل فيه 🙏")
          );
        }
        controller.close();
      } catch (error) {
        console.error("companion chat failed", error);
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
