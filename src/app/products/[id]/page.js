import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ProductDetailClient from "@/components/ProductDetailClient";

export const revalidate = 120;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true, price: true, store: { select: { name: true } } },
  });

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  return {
    title: `${product.name} - ${product.store.name} | Nosso Local`,
    description:
      product.description ||
      `${product.name} disponível em ${product.store.name} no Nosso Local.`,
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      store: true,
      groups: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const { store, ...productWithoutStore } = product;

  // Serialize dates for client component
  const serializeDate = (d) => (d instanceof Date ? d.toISOString() : d);

  const productData = {
    ...productWithoutStore,
    createdAt: serializeDate(productWithoutStore.createdAt),
    updatedAt: serializeDate(productWithoutStore.updatedAt),
    groups: productWithoutStore.groups.map((g) => ({
      ...g,
      createdAt: serializeDate(g.createdAt),
      updatedAt: serializeDate(g.updatedAt),
      options: g.options.map((o) => ({
        ...o,
        createdAt: serializeDate(o.createdAt),
        updatedAt: serializeDate(o.updatedAt),
      })),
    })),
  };

  const storeData = {
    ...store,
    createdAt: serializeDate(store.createdAt),
    updatedAt: serializeDate(store.updatedAt),
  };

  return <ProductDetailClient product={productData} store={storeData} />;
}
