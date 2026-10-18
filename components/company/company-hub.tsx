"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Globe,
  Camera,
  Phone,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { instagramUrl, whatsappUrl } from "@/lib/company";

type Company = {
  name: string;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  websiteUrl: string | null;
  subscriptionUrl: string | null;
};

export function CompanyHub({ initial }: { initial: Company }) {
  const router = useRouter();
  const [company, setCompany] = useState(initial);
  const [saving, setSaving] = useState(false);

  const waLink = whatsappUrl(company.whatsapp);
  const igLink = instagramUrl(company.instagram);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      setCompany(data.company);
      toast.success("Empresa atualizada");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            {company.tagline && (
              <p className="text-sm text-muted mt-1">{company.tagline}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {company.email && <Badge>{company.email}</Badge>}
              {company.instagram && <Badge>{company.instagram}</Badge>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={<Phone className="h-4 w-4 text-online" />}
              label="Telefone"
              value={company.phone}
              onCopy={() =>
                company.phone && void copyText(company.phone, "Telefone")
              }
            />
            <InfoCard
              icon={
                <span className="text-online text-sm font-bold leading-none">
                  WA
                </span>
              }
              label="WhatsApp"
              value={company.whatsapp}
              href={waLink}
              onCopy={() =>
                company.whatsapp && void copyText(company.whatsapp, "WhatsApp")
              }
            />
            <InfoCard
              icon={<Camera className="h-4 w-4 text-online" />}
              label="Instagram"
              value={company.instagram}
              href={igLink}
              onCopy={() =>
                company.instagram &&
                void copyText(company.instagram, "Instagram")
              }
            />
            <InfoCard
              icon={<Globe className="h-4 w-4 text-accent-cyan" />}
              label="Site"
              value={company.websiteUrl}
              href={company.websiteUrl}
              onCopy={() =>
                company.websiteUrl &&
                void copyText(company.websiteUrl, "Site")
              }
            />
            <InfoCard
              icon={<CreditCard className="h-4 w-4 text-accent-indigo" />}
              label="Assinatura"
              value={company.subscriptionUrl}
              href={company.subscriptionUrl}
              onCopy={() =>
                company.subscriptionUrl &&
                void copyText(company.subscriptionUrl, "Assinatura")
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {company.websiteUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={company.websiteUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir site
                </a>
              </Button>
            )}
            {company.subscriptionUrl && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={company.subscriptionUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir assinatura
                </a>
              </Button>
            )}
            {waLink && (
              <Button size="sm" variant="outline" asChild>
                <a href={waLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </Button>
            )}
            {igLink && (
              <Button size="sm" variant="outline" asChild>
                <a href={igLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Instagram
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editar dados da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                required
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={company.email || ""}
                onChange={(e) =>
                  setCompany({ ...company, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Tagline</Label>
              <Input
                value={company.tagline || ""}
                onChange={(e) =>
                  setCompany({ ...company, tagline: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input
                value={company.phone || ""}
                onChange={(e) =>
                  setCompany({ ...company, phone: e.target.value })
                }
                placeholder="+55 12 98700-2929"
              />
            </div>
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <Input
                value={company.whatsapp || ""}
                onChange={(e) =>
                  setCompany({ ...company, whatsapp: e.target.value })
                }
                placeholder="+55 12 98700-2929"
              />
            </div>
            <div className="space-y-1">
              <Label>Instagram</Label>
              <Input
                value={company.instagram || ""}
                onChange={(e) =>
                  setCompany({ ...company, instagram: e.target.value })
                }
                placeholder="@energontech"
              />
            </div>
            <div className="space-y-1">
              <Label>Site</Label>
              <Input
                type="url"
                value={company.websiteUrl || ""}
                onChange={(e) =>
                  setCompany({ ...company, websiteUrl: e.target.value })
                }
                placeholder="https://energon.up.railway.app/"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Assinatura</Label>
              <Input
                type="url"
                value={company.subscriptionUrl || ""}
                onChange={(e) =>
                  setCompany({ ...company, subscriptionUrl: e.target.value })
                }
                placeholder="https://assinates-energon-production.up.railway.app"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                Salvar empresa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  href,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string | null;
  onCopy?: () => void;
}) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-card-border bg-[#0d1024]/60 p-3 flex gap-3 items-start">
      <div className="mt-0.5 h-8 w-8 rounded-md border border-card-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-accent-cyan break-all hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium break-all">{value}</p>
        )}
      </div>
      {onCopy && (
        <Button size="sm" variant="ghost" onClick={onCopy} className="shrink-0">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
