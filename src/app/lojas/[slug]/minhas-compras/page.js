"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Footer from "../../../../components/Footer";
import { formatPrice } from "../../../../lib/utils";

export default function MinhasComprasPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});

  const statusLabels = {
    pending: { label: "Aguardando Confirmação", color: "yellow" },
    confirmed: { label: "Confirmado", color: "blue" },
    preparing: { label: "Em Preparação", color: "purple" },
    delivering: { label: "Saiu para Entrega", color: "indigo" },
    completed: { label: "Concluído", color: "green" },
    cancelled: { label: "Cancelado", color: "red" },
  };

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !session) return;

      try {
        setLoading(true);

        // Buscar loja
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

        // Buscar pedidos do cliente nesta loja
        const ordersResponse = await fetch(
          `/api/orders?storeId=${foundStore.id}`,
        );
        if (!ordersResponse.ok) {
          throw new Error("Erro ao carregar pedidos");
        }

        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setErrors([err.message]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Faça login para ver suas compras
          </h1>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suas compras...</p>
        </div>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Erro ao carregar compras
            </h1>
            <div className="text-red-700 mb-6">
              <ul className="list-disc text-left pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <Link
              href={`/lojas/${slug}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Voltar à Loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Nosso Local
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {session.user?.name}</span>
              <Link
                href="/painel"
                className="text-blue-600 hover:text-blue-800"
              >
                Painel
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/lojas/${slug}`}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Voltar para {store?.name}
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Minhas Compras 🛍️
          </h1>
          <p className="text-gray-600">Seus pedidos em {store?.name}</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhuma compra ainda
            </h2>
            <p className="text-gray-600 mb-6">
              Você ainda não fez nenhum pedido nesta loja
            </p>
            <Link
              href={`/lojas/${slug}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Fazer um Pedido
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const statusInfo =
                statusLabels[order.status] || statusLabels.pending;
              const isExpanded = expandedOrders[order.id];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Order Header - Clickable */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start gap-4">
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className="flex-1 hover:opacity-80 transition-opacity text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
                          >
                            {statusInfo.label}
                          </span>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <p className="text-sm font-semibold text-gray-900">
                            Total: {formatPrice(order.total)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {items.length}{" "}
                            {items.length === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleOrder(order.id)}
                          className="p-2"
                        >
                          <svg
                            className={`w-6 h-6 text-gray-500 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Botão Ver Pagamento - linha separada */}
                    <div className="mt-3 px-6">
                      <Link
                        href={`/lojas/${slug}/checkout?orderId=${order.id}`}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Ver Pagamento
                      </Link>
                    </div>
                  </div>

                  {/* Order Details - Collapsible */}
                  {isExpanded && (
                    <div className="animate-accordion">
                      {/* Order Items */}
                      <div className="px-6 py-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Itens do Pedido:
                        </h3>
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.productName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity}x {formatPrice(item.price)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="space-y-2">
                          <div className="flex justify-between text-gray-700">
                            <span>Subtotal:</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          {order.deliveryFee > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Taxa de entrega:</span>
                              <span>{formatPrice(order.deliveryFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                            <span>Total:</span>
                            <span className="text-green-600">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Store Contact */}
                      <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Contato da loja:</span>{" "}
                          {order.storePhone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
