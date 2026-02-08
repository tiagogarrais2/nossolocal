import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

/**
 * Hook que salva a URL da página atual em localStorage
 * para poder redirecionar o usuário para lá após login
 */
export function usePreviousPath() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // Só guardar a URL se:
    // 1. Não estiver autenticado (precisa fazer login)
    // 2. Não for a página de login
    // 3. Estiver em um ambiente cliente
    if (!session && pathname !== "/login" && typeof window !== "undefined") {
      // Guardar apenas o pathname, não a URL completa
      console.log("[PathRecorder] Salvando página anterior:", pathname);
      localStorage.setItem("previousPath", pathname);
    }
  }, [pathname, session]);
}

/**
 * Recupera o caminho anterior guardado em localStorage
 * NÃO remove após ler - apenas marca como consumido
 */
export function getPreviousPath() {
  // Só rodar em ambiente cliente
  if (typeof window === "undefined") {
    return "/";
  }

  const previousPath = localStorage.getItem("previousPath");
  console.log("[getPreviousPath] Lendo localStorage:", previousPath);

  // Validar que é um caminho relativo válido
  if (
    previousPath &&
    previousPath.startsWith("/") &&
    previousPath !== "/login"
  ) {
    console.log("[getPreviousPath] Retornando:", previousPath);
    return previousPath;
  }

  console.log("[getPreviousPath] Usando fallback: /");
  return "/";
}

/**
 * Limpa o localStorage após usar com segurança
 */
export function clearPreviousPath() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("previousPath");
    console.log("[clearPreviousPath] Limpou localStorage");
  }
}
