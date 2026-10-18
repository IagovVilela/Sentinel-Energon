import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Energon Sentinel",
  description: "Painel interno de monitoramento e cofre de credenciais da Energon",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#12152B",
              border: "1px solid #1E2340",
              color: "#E2E8F0",
            },
          }}
        />
      </body>
    </html>
  );
}
