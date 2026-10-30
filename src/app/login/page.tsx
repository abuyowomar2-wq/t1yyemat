import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-14">
      <LoginForm next={next} />
    </main>
  );
}
