import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/ui";
import { getProduct, listProducts } from "@/lib/data/catalog";

export default async function ProductEdit({ params }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  const product = id === "nuevo" ? null : await getProduct(id);
  if (id !== "nuevo" && !product) notFound();
  const categories = [...new Set((await listProducts()).map((p) => p.category))];
  return (
    <>
      <PageHeader eyebrow="Admin · Productos" title={product ? product.name : "Nuevo producto"} />
      <ProductForm product={product} categories={categories} />
    </>
  );
}
