import Link from "next/link";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { listProducts } from "@/lib/data/catalog";
import { money } from "@/lib/format";

const STOCK = { in_stock: ["En stock", "good"], backorder: ["Bajo pedido", "warn"], unavailable: ["No disponible", "bad"] } as const;

export default async function ProductsAdmin() {
  const products = await listProducts();
  const categories = [...new Set(products.map((p) => p.category))];
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Productos"
        description="El catálogo es la única fuente de verdad: el cliente simulado y el coach sólo usan lo que está aquí."
        action={<ButtonLink href="/admin/productos/nuevo">Nuevo producto</ButtonLink>}
      />
      <div className="space-y-6">
        {categories.map((cat) => (
          <Card key={cat} className="overflow-x-auto">
            <div className="border-b border-line px-5 py-3 text-sm font-semibold">{cat}</div>
            <table className="w-full min-w-[640px] text-sm">
              <tbody className="divide-y divide-line">
                {products
                  .filter((p) => p.category === cat)
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-panel">
                      <td className="px-5 py-3">
                        <Link href={`/admin/productos/${p.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        <div className="text-xs text-subtle">{p.slug}</div>
                      </td>
                      <td className="px-5 py-3 tabular-nums">{money(p.price)}</td>
                      <td className="px-5 py-3 text-muted">{p.delivery_time || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STOCK[p.stock_status][1]}>{STOCK[p.stock_status][0]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">{p.active ? <Badge tone="dark">Activo</Badge> : <Badge>Inactivo</Badge>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </>
  );
}
