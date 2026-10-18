"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Download,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";

type Profile = {
  fullName: string;
  email: string;
  linkedinUrl: string | null;
  companyUrl: string | null;
  headline: string | null;
};

type LinkItem = {
  id: string;
  label: string;
  url: string;
};

type SnippetItem = {
  id: string;
  title: string;
  body: string;
};

type AssetMeta = {
  id: string;
  kind: "photo" | "resume";
  filename: string;
  mimeType: string;
  updatedAt: string | Date;
};

export function MeHub({
  initialProfile,
  initialLinks,
  initialSnippets,
  initialAssets,
}: {
  initialProfile: Profile;
  initialLinks: LinkItem[];
  initialSnippets: SnippetItem[];
  initialAssets: AssetMeta[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [links, setLinks] = useState(initialLinks);
  const [snippets, setSnippets] = useState(initialSnippets);
  const [assets, setAssets] = useState(initialAssets);
  const [photoKey, setPhotoKey] = useState(0);

  const [linkForm, setLinkForm] = useState({ label: "", url: "" });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [snippetForm, setSnippetForm] = useState({ title: "", body: "" });
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

  const photo = useMemo(
    () => assets.find((a) => a.kind === "photo"),
    [assets],
  );
  const resume = useMemo(
    () => assets.find((a) => a.kind === "resume"),
    [assets],
  );

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      setProfile(data.profile);
      toast.success("Perfil atualizado");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveLink(e: React.FormEvent) {
    e.preventDefault();
    const payload = { label: linkForm.label, url: linkForm.url };
    const res = await fetch(
      editingLinkId ? `/api/me/links/${editingLinkId}` : "/api/me/links",
      {
        method: editingLinkId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro no link");
      return;
    }
    if (editingLinkId) {
      setLinks((prev) =>
        prev.map((l) => (l.id === editingLinkId ? data.link : l)),
      );
      toast.success("Link atualizado");
    } else {
      setLinks((prev) => [...prev, data.link]);
      toast.success("Link adicionado");
    }
    setLinkForm({ label: "", url: "" });
    setEditingLinkId(null);
    router.refresh();
  }

  async function saveSnippet(e: React.FormEvent) {
    e.preventDefault();
    const payload = { title: snippetForm.title, body: snippetForm.body };
    const res = await fetch(
      editingSnippetId
        ? `/api/me/snippets/${editingSnippetId}`
        : "/api/me/snippets",
      {
        method: editingSnippetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro no texto");
      return;
    }
    if (editingSnippetId) {
      setSnippets((prev) =>
        prev.map((s) => (s.id === editingSnippetId ? data.snippet : s)),
      );
      toast.success("Texto atualizado");
    } else {
      setSnippets((prev) => [...prev, data.snippet]);
      toast.success("Texto adicionado");
    }
    setSnippetForm({ title: "", body: "" });
    setEditingSnippetId(null);
    router.refresh();
  }

  async function uploadAsset(kind: "photo" | "resume", file: File | null) {
    if (!file) return;
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    const res = await fetch("/api/me/assets", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Falha no upload");
      return;
    }
    setAssets((prev) => {
      const rest = prev.filter((a) => a.kind !== kind);
      return [...rest, data.asset];
    });
    if (kind === "photo") setPhotoKey((k) => k + 1);
    toast.success(kind === "photo" ? "Foto atualizada" : "Currículo atualizado");
    router.refresh();
  }

  async function removeAsset(kind: "photo" | "resume") {
    const res = await fetch(`/api/me/assets/${kind}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro ao remover");
      return;
    }
    setAssets((prev) => prev.filter((a) => a.kind !== kind));
    if (kind === "photo") setPhotoKey((k) => k + 1);
    toast.success("Arquivo removido");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="shrink-0 space-y-2">
              <div className="h-28 w-28 rounded-full border border-card-border bg-[#0d1024] overflow-hidden flex items-center justify-center">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photoKey}
                    src={`/api/me/assets/photo?t=${photoKey}`}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-muted" />
                )}
              </div>
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-card-border px-3 py-1.5 text-xs hover:bg-white/5">
                <Upload className="h-3.5 w-3.5" />
                Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    void uploadAsset("photo", e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {photo && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full text-down"
                  onClick={() => void removeAsset("photo")}
                >
                  Remover foto
                </Button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-semibold">{profile.fullName}</h1>
                {profile.headline && (
                  <p className="text-sm text-muted mt-1">{profile.headline}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{profile.email}</Badge>
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                    >
                      <Badge className="gap-1">
                        <Link2 className="h-3 w-3" />
                        LinkedIn
                      </Badge>
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(profile.email, "E-mail")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar e-mail
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(profile.fullName, "Nome")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar nome
                </Button>
                {profile.linkedinUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir LinkedIn
                    </a>
                  </Button>
                )}
                {profile.companyUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={profile.companyUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Empresa
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Nome completo</Label>
              <Input
                required
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input
                type="email"
                required
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Headline</Label>
              <Input
                value={profile.headline || ""}
                onChange={(e) =>
                  setProfile({ ...profile, headline: e.target.value })
                }
                placeholder="Ex.: Full-stack · Fundador Energon"
              />
            </div>
            <div className="space-y-1">
              <Label>LinkedIn</Label>
              <Input
                type="url"
                value={profile.linkedinUrl || ""}
                onChange={(e) =>
                  setProfile({ ...profile, linkedinUrl: e.target.value })
                }
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="space-y-1">
              <Label>Link da empresa</Label>
              <Input
                type="url"
                value={profile.companyUrl || ""}
                onChange={(e) =>
                  setProfile({ ...profile, companyUrl: e.target.value })
                }
                placeholder="https://…"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingProfile}>
                Salvar perfil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Links externos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={saveLink} className="grid gap-2">
              <Input
                placeholder="Nome (ex.: Portfólio)"
                value={linkForm.label}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, label: e.target.value })
                }
                required
              />
              <Input
                type="url"
                placeholder="https://…"
                value={linkForm.url}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, url: e.target.value })
                }
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  {editingLinkId ? "Salvar link" : "Adicionar link"}
                </Button>
                {editingLinkId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingLinkId(null);
                      setLinkForm({ label: "", url: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-2">
              {links.length === 0 && (
                <p className="text-sm text-muted">
                  Nenhum link ainda. Cadastre portfólio, site da empresa, etc.
                </p>
              )}
              {links.map((link) => (
                <div
                  key={link.id}
                  className="rounded-md border border-card-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{link.label}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent-cyan underline break-all"
                    >
                      {link.url}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void copyText(link.url, link.label)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingLinkId(link.id);
                        setLinkForm({ label: link.label, url: link.url });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <DeleteButton
                      endpoint={`/api/me/links/${link.id}`}
                      confirmMessage={`Excluir o link "${link.label}"?`}
                      label=""
                      variant="ghost"
                      onDeleted={() =>
                        setLinks((prev) => prev.filter((l) => l.id !== link.id))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Textos úteis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={saveSnippet} className="grid gap-2">
              <Input
                placeholder="Título"
                value={snippetForm.title}
                onChange={(e) =>
                  setSnippetForm({ ...snippetForm, title: e.target.value })
                }
                required
              />
              <textarea
                className="min-h-[100px] w-full rounded-md border border-card-border bg-[#0d1024] px-3 py-2 text-sm"
                placeholder="Texto para colar em propostas, bio, etc."
                value={snippetForm.body}
                onChange={(e) =>
                  setSnippetForm({ ...snippetForm, body: e.target.value })
                }
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  {editingSnippetId ? "Salvar texto" : "Adicionar texto"}
                </Button>
                {editingSnippetId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingSnippetId(null);
                      setSnippetForm({ title: "", body: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-2">
              {snippets.length === 0 && (
                <p className="text-sm text-muted">
                  Guarde aqui bios, pitches e respostas prontas para copiar.
                </p>
              )}
              {snippets.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-card-border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{s.title}</p>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void copyText(s.body, s.title)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSnippetId(s.id);
                          setSnippetForm({ title: s.title, body: s.body });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteButton
                        endpoint={`/api/me/snippets/${s.id}`}
                        confirmMessage={`Excluir o texto "${s.title}"?`}
                        label=""
                        variant="ghost"
                        onDeleted={() =>
                          setSnippets((prev) =>
                            prev.filter((x) => x.id !== s.id),
                          )
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted whitespace-pre-wrap line-clamp-4">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resume ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{resume.filename}</Badge>
              <Button size="sm" variant="outline" asChild>
                <a href="/api/me/assets/resume" download>
                  <Download className="h-3.5 w-3.5" />
                  Baixar
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-down"
                onClick={() => void removeAsset("resume")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Nenhum currículo enviado ainda (PDF ou Word, até 5 MB).
            </p>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gradient-to-r from-accent-cyan via-accent-indigo to-accent-violet px-3 py-1.5 text-xs font-medium text-[#0A0C1F] hover:opacity-90">
            <Upload className="h-3.5 w-3.5" />
            {resume ? "Substituir currículo" : "Enviar currículo"}
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                void uploadAsset("resume", e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
