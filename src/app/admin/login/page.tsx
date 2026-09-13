import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-14">
      <LoginForm />
    </main>
  );
}
