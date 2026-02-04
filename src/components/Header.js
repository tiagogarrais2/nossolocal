"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Função para validar e sanitizar callbackUrl (apenas URLs internas)
  const getLoginLink = () => {
    // Se o usuário estiver em uma página de loja ou qualquer página interna,
    // passar como callbackUrl para voltar após login
    if (pathname && !pathname.includes("login")) {
      return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
    }
    return "/login";
  };

  return (
    <header className="bg-[#F5F6F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo centralizado no topo */}
        <div className="text-center py-4">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Logomarca do site Nosso Local"
              width={300}
              height={128}
              className="mx-auto"
            />
          </Link>
        </div>

        {/* Menu inferior */}
        <div className="flex justify-center items-center pb-4">
          {session ? (
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 text-sm">
                  Olá, {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                >
                  Sair
                </button>
              </div>
              <Link
                href="/painel"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Meu Painel
              </Link>
            </div>
          ) : (
            <Link
              href={getLoginLink()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
