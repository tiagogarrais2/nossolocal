"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { formatPrice } from "../../lib/utils";
import ProductImageCarousel from "../../components/ProductImageCarousel";

function ProductsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    // Não redirecionar mais - permitir acesso público
  }, [session, status, router]);

  // Buscar dados da loja
  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;

      try {
        const response = await fetch("/api/stores");
        if (response.ok) {
          const data = await response.json();
          const foundStore = data.stores?.find((s) => s.id === storeId);
          setStore(foundStore);
        }
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
      }
    };

    fetchStore();
  }, [storeId, session]);

  // Buscar produtos da loja
  useEffect(() => {
    const fetchProducts = async () => {
      if (!storeId) return;

      try {
        const response = await fetch(`/api/products?storeId=${storeId}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };

    fetchProducts();
  }, [storeId, session, successMessage]);

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Produto removido com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || ["Erro ao remover produto"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    // Verificar se o usuário está logado
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setAddingToCart(productId);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        setSuccessMessage("Produto adicionado ao carrinho!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao adicionar ao carrinho"]);
        setTimeout(() => setErrors([]), 3000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro ao adicionar ao carrinho"]);
      setTimeout(() => setErrors([]), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Loja não especificada
          </h1>
          <Link
            href="/painel?tab=stores"
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar para lojas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Store Info */}
        {store && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center space-x-4">
              {store.image && (
                <img
                  src={store.image}
                  alt={`Logo da ${store.name}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {store.name}
                </h2>
                {store.description && (
                  <p className="text-gray-600">{store.description}</p>
                )}
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {store.category}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {store?.isOwner ? "Gerenciar Produtos" : "Produtos da Loja"}
              </h1>
              <p className="text-gray-600">
                {store?.isOwner
                  ? "Adicione e gerencie os produtos da sua loja"
                  : "Confira os produtos disponíveis"}
              </p>
            </div>
            {store?.isOwner && (
              <Link
                href={`/products/new?storeId=${storeId}`}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5"
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
                <span>Novo Produto</span>
              </Link>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Products List */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto cadastrado
              </h3>
              <p className="text-gray-500 mb-6">
                Comece adicionando produtos à sua loja para que os clientes
                possam fazer pedidos.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {product.images && product.images.length > 0 && (
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                      <ProductImageCarousel
                        images={product.images}
                        productName={product.name}
                        className="w-full"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {product.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(parseFloat(product.price))}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.available ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    {store?.isOwner ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/products/edit?id=${product.id}&storeId=${storeId}`,
                            )
                          }
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={loading}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={
                          addingToCart === product.id || !product.available
                        }
                        className={`w-full px-3 py-2 text-sm rounded-lg font-semibold transition-all ${
                          !product.available
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                        }`}
                      >
                        {addingToCart === product.id ? (
                          <span className="flex items-center justify-center">
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
                            Adicionando...
                          </span>
                        ) : (
                          "🛒 Adicionar ao Carrinho"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-lg">Carregando...</p>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
