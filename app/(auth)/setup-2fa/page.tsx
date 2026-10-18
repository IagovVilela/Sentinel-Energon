import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Setup2faForm } from "@/components/auth/setup-2fa-form";

export default async function Setup2faPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.totpEnabled) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        <h1 className="text-2xl font-semibold mb-2 gradient-text">
          Ativar autenticação em dois fatores
        </h1>
        <p className="text-sm text-muted mb-6">
          O papel <strong>owner</strong> exige 2FA TOTP. Escaneie o QR Code no
          Google Authenticator, Authy ou similar e confirme o código.
        </p>
        <Setup2faForm />
      </div>
    </main>
  );
}
