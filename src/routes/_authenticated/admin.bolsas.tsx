import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminGate } from "@/components/admin-gate";
import { Badge, Button, Card, Input, Label } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, imageKeys, resolveImage } from "@/data/catalog";

export const Route = createFileRoute("/_authenticated/admin/bolsas")({
  head: () => ({
    meta: [
      { title: "Bolsas — Painel Adribacci" },
      { name: "description", content: "Gerencie as bolsas artesanais do ateliê Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Bolsas — Painel Adribacci" },
      { property: "og:description", content: "Gerencie as bolsas artesanais do ateliê." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminProducts,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type Row = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_cents: number;
  image_key: string | null;
  image_alt: string;
  availability: string;
  stock: number;
  production_days: number | null;
  dimensions: string;
  materials: string[];
  featured: boolean;
  published: boolean;
};

function AdminProducts() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-bolsas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        name,
        slug: slugify(name),
        published: false,
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["admin-bolsas"] });
    },
  });

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const { id, ...fields } = row;
      const { error } = await supabase.from("products").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-bolsas"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-bolsas"] }),
  });

  return (
    <AdminGate>
      <h1 className="text-display">Bolsas</h1>

      <Card className="mt-8 p-6">
        <h2 className="text-headline-sm">Cadastrar bolsa</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Label htmlFor="nova-bolsa">Nome da peça</Label>
            <Input
              id="nova-bolsa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button onClick={() => create.mutate()} disabled={name.trim().length < 3}>
            Criar rascunho
          </Button>
        </div>
      </Card>

      <div className="mt-8 space-y-4">
        {(data ?? []).map((product) => (
          <Card key={product.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={resolveImage(product.image_key)}
                  alt={product.image_alt}
                  width={80}
                  height={80}
                  className="size-16 rounded-lg object-cover"
                />
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-headline-sm">{product.name}</h2>
                    <Badge variant={product.published ? "leather" : "neutral"}>
                      {product.published ? "Publicada" : "Rascunho"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {formatPrice(product.price_cents)} · {product.availability} · estoque{" "}
                    {product.stock}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setEditing(editing?.id === product.id ? null : product)}
                >
                  {editing?.id === product.id ? "Fechar" : "Editar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline-neutral"
                  onClick={() => save.mutate({ ...product, published: !product.published })}
                >
                  {product.published ? "Despublicar" : "Publicar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Apagar "${product.name}"?`)) remove.mutate(product.id);
                  }}
                >
                  Apagar
                </Button>
              </div>
            </div>

            {editing?.id === product.id && (
              <form
                className="mt-6 grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate(editing);
                }}
              >
                <Field label="Nome">
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </Field>
                <Field label="Endereço na web (slug)">
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  />
                </Field>
                <Field label="Resumo">
                  <Input
                    value={editing.short_description}
                    onChange={(e) =>
                      setEditing({ ...editing, short_description: e.target.value })
                    }
                  />
                </Field>
                <Field label="Preço em centavos">
                  <Input
                    type="number"
                    value={editing.price_cents}
                    onChange={(e) =>
                      setEditing({ ...editing, price_cents: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Disponibilidade">
                  <select
                    value={editing.availability}
                    onChange={(e) => setEditing({ ...editing, availability: e.target.value })}
                    className="min-h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface"
                  >
                    <option value="pronta-entrega">pronta-entrega</option>
                    <option value="encomenda">encomenda</option>
                  </select>
                </Field>
                <Field label="Estoque">
                  <Input
                    type="number"
                    value={editing.stock}
                    onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Prazo de produção (dias)">
                  <Input
                    type="number"
                    value={editing.production_days ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, production_days: Number(e.target.value) || null })
                    }
                  />
                </Field>
                <Field label="Medidas">
                  <Input
                    value={editing.dimensions}
                    onChange={(e) => setEditing({ ...editing, dimensions: e.target.value })}
                  />
                </Field>
                <Field label="Foto">
                  <select
                    value={editing.image_key ?? ""}
                    onChange={(e) => setEditing({ ...editing, image_key: e.target.value })}
                    className="min-h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface"
                  >
                    <option value="">sem foto</option>
                    {imageKeys.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Texto alternativo da foto">
                  <Input
                    value={editing.image_alt}
                    onChange={(e) => setEditing({ ...editing, image_alt: e.target.value })}
                  />
                </Field>
                <Field label="Materiais (separados por ponto e vírgula)" full>
                  <Input
                    value={editing.materials.join("; ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        materials: e.target.value
                          .split(";")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
                <Field label="Descrição completa" full>
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md text-on-surface"
                  />
                </Field>
                <div className="sm:col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-body-md">
                    <input
                      type="checkbox"
                      checked={editing.featured}
                      onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                    />
                    Destacar na página inicial
                  </label>
                  <Button type="submit" loading={save.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            )}
          </Card>
        ))}
      </div>
    </AdminGate>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
