import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import StoreDetailClient from "@/components/StoreDetailClient";

export const revalidate = 120;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { name: true, description: true, city: true, category: true },
  });

  if (!store) {
    return { title: "Loja não encontrada" };
  }

  return {
    title: `${store.name} - Nosso Local`,
    description:
      store.description ||
      `${store.name} em ${store.city} - ${store.category}. Veja os produtos disponíveis no Nosso Local.`,
  };
}

export default async function LojaPage({ params }) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!store) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: {
      groups: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Determine ownership and admin status server-side
  const session = await getServerSession(authOptions);
  let currentUserId = null;
  if (session?.user?.id) {
    currentUserId = session.user.id;
  } else if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (user) currentUserId = user.id;
  }

  const storeIsOwner = currentUserId ? store.userId === currentUserId : false;
  const userIsAdmin = session?.user?.email
    ? isAdmin(session.user.email)
    : false;

  // Build serializable store object
  const storeData = {
    ...store,
    isOwner: storeIsOwner,
    createdByTeam: store.createdBy !== null,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };

  // Serialize product dates
  const productsData = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    groups: p.groups.map((g) => ({
      ...g,
      createdAt: g.createdAt?.toISOString?.() ?? null,
      updatedAt: g.updatedAt?.toISOString?.() ?? null,
      options: g.options.map((o) => ({
        ...o,
        createdAt: o.createdAt?.toISOString?.() ?? null,
        updatedAt: o.updatedAt?.toISOString?.() ?? null,
      })),
    })),
  }));

  return (
    <StoreDetailClient
      store={storeData}
      products={productsData}
      isOwner={storeIsOwner}
      isAdmin={userIsAdmin}
      slug={slug}
    />
  );
}
