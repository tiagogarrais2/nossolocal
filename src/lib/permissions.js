/**
 * Sistema de permissões baseado em roles e emails do .env
 */

/**
 * Verifica se um email está na lista de admins
 * @param {string} email
 * @returns {boolean}
 */
export function isAdmin(email) {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
}

/**
 * Verifica se um email está na lista de gerentes
 * @param {string} email
 * @returns {boolean}
 */
export function isStoreManager(email) {
  if (!email) return false;
  const managerEmails = process.env.STORE_MANAGER_EMAILS || "";
  const managerList = managerEmails
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return managerList.includes(email.toLowerCase());
}

/**
 * Obtém a role do usuário baseado no email
 * @param {string} email
 * @returns {'ADMIN' | 'STORE_MANAGER' | 'USER'}
 */
export function getUserRoleFromEmail(email) {
  if (isAdmin(email)) return "ADMIN";
  if (isStoreManager(email)) return "STORE_MANAGER";
  return "USER";
}

/**
 * Verifica se o usuário pode criar lojas para outros
 * @param {object} session - Sessão do NextAuth
 * @returns {boolean}
 */
export function canCreateStoresForOthers(session) {
  if (!session?.user?.email) return false;
  const role = getUserRoleFromEmail(session.user.email);
  return role === "ADMIN" || role === "STORE_MANAGER";
}

/**
 * Verifica se o usuário pode gerenciar uma loja específica
 * @param {object} session - Sessão do NextAuth
 * @param {object} store - Objeto da loja com userId
 * @returns {boolean}
 */
export function canManageStore(session, store) {
  if (!session?.user?.id || !store) return false;

  // Proprietário pode gerenciar
  if (store.userId === session.user.id) return true;

  // Admin e gerentes podem gerenciar qualquer loja
  const role = getUserRoleFromEmail(session.user.email);
  return role === "ADMIN" || role === "STORE_MANAGER";
}

/**
 * Verifica se o usuário pode gerenciar pedidos de uma loja específica
 * @param {object} session - Sessão do NextAuth
 * @param {object} store - Objeto da loja com userId
 * @returns {boolean}
 */
export function canManageStoreOrders(session, store) {
  // Mesma lógica de canManageStore
  return canManageStore(session, store);
}

/**
 * Verifica se o usuário pode gerenciar produtos de uma loja específica
 * @param {object} session - Sessão do NextAuth
 * @param {object} product - Objeto do produto com store.userId
 * @returns {boolean}
 */
export function canManageProduct(session, product) {
  if (!session?.user?.id || !product?.store) return false;
  return canManageStore(session, product.store);
}

/**
 * Verifica se o usuário pode gerenciar chaves PIX de uma loja específica
 * @param {object} session - Sessão do NextAuth
 * @param {object} pixKey - Objeto da chave PIX com store.userId
 * @returns {boolean}
 */
export function canManagePixKey(session, pixKey) {
  if (!session?.user?.id || !pixKey?.store) return false;
  return canManageStore(session, pixKey.store);
}

/**
 * Verifica se o usuário tem permissões de admin
 * @param {object} session - Sessão do NextAuth
 * @returns {boolean}
 */
export function isUserAdmin(session) {
  if (!session?.user?.email) return false;
  return isAdmin(session.user.email);
}
