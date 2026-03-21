import { LoginScreen } from "@/components/admin/login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/overview";

  return <LoginScreen nextPath={nextPath} />;
}
