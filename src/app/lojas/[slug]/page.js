"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ProductImageCarousel from "../../../components/ProductImageCarousel";
import { formatPrice, getStateDisplay } from "../../../lib/utils";

export default function LojaPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [togglingStore, setTogglingStore] = useState(false);
  const [showFloatingCart, setShowFloatingCart] = useState(false);

  // Mapeamento de códigos numéricos para siglas de UF
  const stateCodeToUF = {
    11: "RO",
    12: "AC",
    13: "AM",
    14: "RR",
    15: "PA",
    16: "AP",
    17: "TO",
    21: "MA",
    22: "PI",
    23: "CE",
    24: "RN",
    25: "PB",
    26: "PE",
    27: "AL",
    28: "SE",
    29: "BA",
    31: "MG",
    32: "ES",
    33: "RJ",
    35: "SP",
    41: "PR",
    42: "SC",
    43: "RS",
    50: "MS",
    51: "MT",
    52: "GO",
    53: "DF",
  };

  const getStateDisplay = (state) => {
    if (!state) return "";
    // Se já é uma sigla (2 letras), retorna em maiúsculas
    if (state.length === 2 && isNaN(state)) {
      return state.toUpperCase();
    }
    // Se é código numérico, converte para sigla
    return stateCodeToUF[state] || state;
  };

  // Carregar dados da loja
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!slug) return;

      try {
        setLoading(true);

        // Buscar loja pelo slug
        const storeResponse = await fetch(
          `/api/stores?slug=${encodeURIComponent(slug)}`,
        );
        if (!storeResponse.ok) {
          throw new Error("Loja não encontrada");
        }

        const storeData = await storeResponse.json();
        const foundStore = storeData.stores?.find((s) => s.slug === slug);

        if (!foundStore) {
          throw new Error("Loja não encontrada");
        }

        setStore(foundStore);

        // Buscar produtos da loja
        const productsResponse = await fetch(
          `/api/products?storeId=${foundStore.id}`,
        );
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products || []);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da loja:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [slug]);

  // Carregar contagem do carrinho
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch("/api/cart");
        if (response.ok) {
          const data = await response.json();
          if (data.cart && data.cart.items) {
            const count = data.cart.items.reduce(
              (total, item) => total + item.quantity,
              0,
            );
            setCartItemCount(count);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    };

    fetchCartCount();
  }, []);

  // Detectar scroll para mostrar carrinho flutuante
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop =
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop;
          setShowFloatingCart(scrollTop > 200); // Mostrar após 200px de scroll
          ticking = false;
        });
        ticking = true;
      }
    };

    // Verificar scroll inicial
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addToCart = async (product) => {
    // Verificar se o usuário está logado
    if (!session) {
      router.push("/login");
      return;
    }

    // Verificar se a loja está aberta
    if (!store.isOpen) {
      alert("Esta loja está fechada no momento. Tente novamente mais tarde.");
      return;
    }

    try {
      setAddingToCart(product.id);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cart && data.cart.items) {
          const count = data.cart.items.reduce(
            (total, item) => total + item.quantity,
            0,
          );
          setCartItemCount(count);
        }
        // Produto adicionado com sucesso - usuário permanece na loja
        setSuccessMessage(`${product.name} adicionado ao carrinho!`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao adicionar ao carrinho");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar ao carrinho");
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleStoreStatus = async () => {
    if (!store) return;

    try {
      setTogglingStore(true);
      const response = await fetch(`/api/stores/${store.id}/toggle-open`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        setStore(data.store);
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao alterar status da loja");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao alterar status da loja");
    } finally {
      setTogglingStore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Loja não encontrada
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/lojas"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ver todas as lojas
          </Link>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Loja não encontrada
          </h1>
          <Link
            href="/lojas"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ver todas as lojas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Aviso para lojas criadas pela equipe */}
      {store.createdByTeam && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
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
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">
                  📋 Loja cadastrada pela nossa equipe
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Esta página foi criada pela equipe do{" "}
                  <strong>Nosso Local</strong> para divulgar este
                  estabelecimento. <strong>Você é o proprietário?</strong> Entre
                  em contato conosco para reivindicar e gerenciar esta página:{" "}
                  <a
                    href="https://wa.me/5588997230866?text=Olá%2C%20gostaria%20de%20reivindicar%20a%20página%20da%20minha%20loja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-amber-900 inline-flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>{" "}
                  ou{" "}
                  <a
                    href="mailto:tiagoarraisholanda@gmail.com?subject=Reivindicar%20página%20da%20loja"
                    className="font-semibold underline hover:text-amber-900"
                  >
                    tiagoarraisholanda@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header da Loja */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Image
                  src={store.image || "/no-image.png"}
                  alt={`Logo da ${store.name}`}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
                <h1 className="text-3xl font-bold text-gray-900">
                  {store.name}
                </h1>
              </div>
              {store.description && (
                <p className="text-gray-600 mt-2">{store.description}</p>
              )}
              <div className="flex flex-col items-center mt-2 text-sm text-gray-500 space-y-1">
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {store.category}
                  </span>
                </div>
                <div className="flex items-center">
                  <span>
                    {store.city}, {getStateDisplay(store.state)}
                  </span>
                </div>
                {store.minimumOrder && (
                  <div className="flex items-center">
                    <span>
                      Pedido mínimo: {formatPrice(store.minimumOrder)}
                    </span>
                  </div>
                )}
                {store.deliveryFee && (
                  <div className="flex items-center">
                    <span>
                      Taxa de entrega: {formatPrice(store.deliveryFee)}
                    </span>
                  </div>
                )}
                {store.freeShippingThreshold && (
                  <div className="flex items-center">
                    <span className="text-green-600 font-medium">
                      Frete grátis à partir de{" "}
                      {formatPrice(store.freeShippingThreshold)}
                    </span>
                  </div>
                )}
                {/* Link do Google Maps */}
                {store.latitude && store.longitude && (
                  <div className="flex items-center mt-2">
                    <a
                      href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm underline">Ver no mapa</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
            {/* Botões em linha separada */}
            <div className="flex flex-row items-center gap-2 sm:gap-4 mt-4">
              {/* Botão Minhas Compras / Meus Pedidos */}
              {session && (
                <Link
                  href={
                    store.isOwner
                      ? `/lojas/${slug}/meus-pedidos`
                      : `/lojas/${slug}/minhas-compras`
                  }
                  className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {store.isOwner ? "Meus Pedidos" : "Minhas Compras"}
                  </span>
                  <span className="sm:hidden">
                    {store.isOwner ? "Pedidos" : "Compras"}
                  </span>
                </Link>
              )}
              {/* Botão Abrir/Fechar Loja - apenas para proprietário */}
              {store.isOwner && (
                <button
                  onClick={toggleStoreStatus}
                  disabled={togglingStore}
                  className={`px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0 ${
                    store.isOpen
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {togglingStore ? (
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {store.isOpen ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      )}
                    </svg>
                  )}
                  <span>
                    {store.isOpen ? "Fechar Delivery" : "Abrir Delivery"}
                  </span>
                </button>
              )}
              {!store.isOwner && (
                <Link
                  href={`/painel/carrinho`}
                  className={`bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center text-sm sm:text-base ${
                    showFloatingCart && cartItemCount > 0 ? "hidden" : ""
                  }`}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    Carrinho ({cartItemCount})
                  </span>
                  <span className="sm:hidden">Carrinho ({cartItemCount})</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage("")}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Produtos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos</h2>

        {products.length === 0 ? (
          store.isOwner ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum produto cadastrado ainda
              </h3>
              <p className="mt-1 text-sm text-gray-500 mb-6">
                Comece cadastrando seu primeiro produto
              </p>
              <Link
                href={`/products/new?storeId=${store.id}`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Cadastrar Primeiro Produto
              </Link>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum produto disponível
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta loja ainda não cadastrou produtos.
              </p>
            </div>
          )
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200 group hover:opacity-80 transition-opacity">
                      <ProductImageCarousel
                        images={product.images}
                        productName={product.name}
                        className="w-full"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-lg font-medium text-gray-900 mb-1 hover:text-blue-600 cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Indicador de estoque */}
                    {product.stock !== null && product.stock !== undefined && (
                      <div className="mb-2">
                        {product.stock === 0 ? (
                          <p className="text-sm text-red-600 font-medium">
                            Produto sem estoque na loja virtual. Entre em
                            contato com a loja física.
                          </p>
                        ) : product.stock <= 5 ? (
                          <p className="text-sm text-orange-600">
                            Apenas {product.stock}{" "}
                            {product.stock === 1
                              ? "unidade disponível"
                              : "unidades disponíveis"}
                          </p>
                        ) : (
                          <p className="text-sm text-green-600">
                            {product.stock} unidades em estoque
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {store.isOwner ? (
                        <Link
                          href={`/products/edit?id=${product.id}&storeId=${store.id}`}
                          className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 text-sm"
                        >
                          Editar
                        </Link>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          disabled={
                            addingToCart === product.id ||
                            !product.available ||
                            !store.isOpen ||
                            (product.stock !== null && product.stock === 0)
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingToCart === product.id ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin h-4 w-4 mr-1"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              ...
                            </span>
                          ) : !store.isOpen ? (
                            "Delivery fechado"
                          ) : product.stock !== null && product.stock === 0 ? (
                            "Sem estoque"
                          ) : (
                            "Adicionar"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão para cadastrar mais produtos */}
            {store.isOwner && (
              <div className="mt-12 text-center">
                <Link
                  href={`/products/new?storeId=${store.id}`}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Cadastre Mais um Produto
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Carrinho Flutuante */}
      {showFloatingCart && cartItemCount > 0 && !store?.isOwner && (
        <div className="fixed top-4 right-4 z-[9999] md:top-4 md:right-4 pointer-events-none safe-area-inset">
          <Link
            href={`/painel/carrinho`}
            className="bg-green-600 text-white rounded-full p-3 md:p-4 shadow-2xl hover:bg-green-700 transition-all duration-300 hover:scale-110 flex items-center justify-center relative pointer-events-auto border-2 border-white"
            title="Ver carrinho"
            style={{ zIndex: 9999 }}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z"
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
}
