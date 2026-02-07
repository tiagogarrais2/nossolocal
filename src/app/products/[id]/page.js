"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { formatPrice, getStateDisplay } from "../../../lib/utils";
import ProductImageCarousel from "../../../components/ProductImageCarousel";

export default function ProductPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Carregar dados do produto
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;

      try {
        setLoading(true);

        // Buscar produto
        const productResponse = await fetch(`/api/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error("Produto não encontrado");
        }

        const productData = await productResponse.json();
        setProduct(productData.product);

        // Buscar loja do produto
        const storeResponse = await fetch(
          `/api/stores?id=${productData.product.storeId}`,
        );
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          const foundStore = storeData.stores?.find(
            (s) => s.id === productData.product.storeId,
          );
          setStore(foundStore);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do produto:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  // Função para adicionar ao carrinho
  const addToCart = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setAddingToCart(true);

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        setSuccessMessage("Produto adicionado ao carrinho!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Erro ao adicionar produto ao carrinho");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar produto ao carrinho");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Produto não encontrado
          </h1>
          <Link href="/lojas" className="text-blue-600 hover:text-blue-700">
            Voltar para lojas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Store Info */}
        {store && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <Link
              href={`/lojas/${store.slug}`}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Voltar para {store.name}
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">
              {store.name}
            </h2>
            {store.description && (
              <p className="text-gray-600">{store.description}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Product Images Carousel */}
            <div className="md:w-1/2 relative">
              {product.images && product.images.length > 0 ? (
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <ProductImageCarousel
                    images={product.images}
                    productName={product.name}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="md:w-1/2 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Descrição
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="mb-8">
                <span className="text-4xl font-bold text-green-600">
                  {formatPrice(product.price)}
                </span>
              </div>

              <div className="mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    product.available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.available ? "Disponível" : "Indisponível"}
                </span>
              </div>

              {/* Stock Information */}
              {product.stock !== null && product.stock !== undefined && (
                <div className="mb-6">
                  {product.stock === 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-medium">
                        Produto sem estoque na loja virtual. Entre em contato
                        com a loja física.
                      </p>
                    </div>
                  ) : product.stock <= 5 ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800 font-medium">
                        Atenção: Apenas {product.stock}{" "}
                        {product.stock === 1
                          ? "unidade disponível"
                          : "unidades disponíveis"}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">
                        ✓ {product.stock} unidades em estoque
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Store Info Compact */}
              {store && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Vendido por {store.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      📍 {store.city}, {getStateDisplay(store.state)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          store.isOpen
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {store.isOpen ? "Aberta" : "Delivery fechado"}
                      </span>
                      {store.category && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {store.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="space-y-4">
                {product.available &&
                store?.isOpen &&
                session &&
                (product.stock === null || product.stock > 0) ? (
                  <button
                    onClick={addToCart}
                    disabled={addingToCart}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
                  >
                    {addingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
                  </button>
                ) : !session ? (
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      window.location.pathname,
                    )}`}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors text-center block"
                  >
                    Fazer Login para Comprar
                  </Link>
                ) : !store?.isOpen ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-medium">
                      Esta loja está fechada no momento
                    </p>
                  </div>
                ) : product.stock !== null && product.stock === 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">
                      Produto sem estoque
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">
                      Produto indisponível no momento
                    </p>
                  </div>
                )}

                {store && (
                  <Link
                    href={`/lojas/${store.slug}`}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 font-medium transition-colors text-center block"
                  >
                    Ver todos os produtos da loja
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message Toast */}
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
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
