"use client";

import dynamic from "next/dynamic";

// The chat history lives in localStorage, so the window renders on the
// client only — otherwise the server HTML (empty chat) wouldn't match.
const ChatWindow = dynamic(
  () => import("./ChatWindow").then((m) => m.ChatWindow),
  { ssr: false }
);

export function ChatLoader({ companionName }: { companionName: string }) {
  return <ChatWindow companionName={companionName} />;
}
