"use client";

import { usePreviousPath } from "@/hooks/usePreviousPath";

/**
 * Componente que registra o caminho anterior para redirecionamento pós-login
 * Deve ser colocado no layout raiz para capturar todas as navegações
 */
export function PathRecorder() {
  usePreviousPath();
  return null; // Não renderiza nada, apenas efeito colateral
}
