"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CarrinhoLojaPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para o carrinho unificado no painel
    router.push("/painel/carrinho");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecionando para o carrinho centralizado...</p>
    </div>
  );
}
