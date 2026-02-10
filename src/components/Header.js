"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userFullName, setUserFullName] = useState(null);
  const [loadingName, setLoadingName] = useState(false);

  // Buscar o nome completo do cadastro do usuário
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserName();
    }
  }, [session?.user?.id]);

  const fetchUserName = async () => {
    try {
      setLoadingName(true);
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUserFullName(data.user?.fullName || null);
      }
    } catch (error) {
      console.error("Erro ao buscar nome do usuário:", error);
    } finally {
      setLoadingName(false);
    }
  };

  // Função para validar e sanitizar callbackUrl (apenas URLs internas)
  const getLoginLink = () => {
    return "/login";
  };

  // Determinar qual nome exibir
  const getDisplayName = () => {
    if (loadingName) {
      return "Carregando...";
    }
    if (userFullName) {
      return userFullName;
    }
    return "(sem nome no cadastro)";
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
            <div className="flex flex-col items-center space-y-3 w-full">
              {/* Saudação com Sair */}
              <div className="flex items-center justify-center gap-6">
                <p className="text-gray-800 font-semibold text-base">
                  Olá, {getDisplayName()} 👋
                </p>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sair
                </button>
              </div>

              {/* Botão Meu Painel */}
              <Link
                href="/painel"
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Meu Painel
              </Link>
            </div>
          ) : (
            <Link
              href={getLoginLink()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
