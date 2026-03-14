import { revalidatePath } from "next/cache";

/**
 * Revalida os caches ISR quando uma loja é criada ou modificada.
 * @param {string|null} slug - Slug da loja (null se for criação/exclusão)
 */
export function revalidateStorePages(slug) {
  revalidatePath("/"); // Home page (lista de lojas)
  revalidatePath("/lojas"); // Listagem de lojas
  if (slug) {
    revalidatePath(`/lojas/${slug}`);
  }
}

/**
 * Revalida os caches ISR quando um produto é criado ou modificado.
 * @param {string|null} storeSlug - Slug da loja do produto
 * @param {string|null} productId - ID do produto (null se for criação)
 */
export function revalidateProductPages(storeSlug, productId) {
  revalidatePath("/"); // Home page (últimos produtos)
  if (storeSlug) {
    revalidatePath(`/lojas/${storeSlug}`);
  }
  if (productId) {
    revalidatePath(`/products/${productId}`);
  }
}
