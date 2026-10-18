import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user?.totpEnabled) redirect("/dashboard");
  if (user && !user.totpEnabled && user.role === "owner") {
    redirect("/setup-2fa");
  }
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image
            src="/energon-sentinel-logo.svg"
            alt="Energon Sentinel"
            width={96}
            height={112}
            priority
          />
          <h1 className="text-2xl font-semibold gradient-text">Energon Sentinel</h1>
          <p className="text-sm text-muted text-center">
            Painel interno de sistemas, credenciais e monitoramento
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
