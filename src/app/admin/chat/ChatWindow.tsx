"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";

type ChatTurn = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "companion-chat-v1";

const STARTERS = [
  "طفشان، اقترح علينا شي نسويه 😄",
  "لو خيروك…",
  "وش رأيك نتناقش في موضوع جدلي خفيف؟",
  "رشّح لي فيلم يناسب الليلة",
];

function loadHistory(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(turns: ChatTurn[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(turns));
  } catch {
    // Storage unavailable (private mode / full) — the chat still works,
    // it just won't survive a reload.
  }
}

export function ChatWindow({ companionName }: { companionName: string }) {
  // Rendered client-only (see ChatLoader), so localStorage is safe to read here.
  const [turns, setTurns] = useState<ChatTurn[]>(loadHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;

    setError(null);
    setInput("");
    const history: ChatTurn[] = [...turns, { role: "user", content }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    let reply = "";
    try {
      const res = await fetch("/admin/chat/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        throw new Error(await res.text().catch(() => ""));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setTurns([...history, { role: "assistant", content: reply }]);
      }
    } catch {
      setError("صار خلل بالاتصال، جرّب ترسل مرة ثانية.");
    } finally {
      setStreaming(false);
      // Keep the user's message even if the reply failed; drop an empty reply
      // so the next request doesn't send a blank assistant turn.
      const finalTurns = reply.trim()
        ? [...history, { role: "assistant" as const, content: reply }]
        : history;
      setTurns(finalTurns);
      saveHistory(finalTurns);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  function resetChat() {
    if (streaming) return;
    if (!confirm("تبغى تبدأ سالفة جديدة؟ المحادثة الحالية بتنمسح.")) return;
    setTurns([]);
    saveHistory([]);
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
            {companionName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{companionName}</p>
            <p className="text-xs text-slate-500">
              {streaming ? "يكتب…" : "متصل"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={resetChat}
            className="text-slate-500 hover:text-slate-800 disabled:opacity-40"
            disabled={streaming || turns.length === 0}
          >
            سالفة جديدة
          </button>
          <Link href="/admin" className="text-slate-500 hover:text-slate-800">
            اللوحة
          </Link>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {turns.length === 0 && (
          <div className="mt-10 space-y-5 text-center">
            <p className="text-slate-600">
              هلا عمر 👋 أنا {companionName}. وش السالفة اليوم؟
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 leading-relaxed ${
                t.role === "user"
                  ? "rounded-tr-sm bg-emerald-600 text-white"
                  : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
              }`}
            >
              {t.content || <span className="animate-pulse text-slate-400">…</span>}
            </div>
          </div>
        ))}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-slate-200 bg-white px-4 py-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="اكتب رسالتك…"
          className="max-h-40 flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          إرسال
        </button>
      </form>
    </main>
  );
}
