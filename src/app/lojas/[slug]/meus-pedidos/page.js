"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Footer from "../../../../components/Footer";
import { formatPrice } from "../../../../lib/utils";

export default function MeusPedidosPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const statusLabels = {
    pending: { label: "Aguardando Confirmação", color: "yellow" },
    confirmed: { label: "Confirmado", color: "blue" },
    preparing: { label: "Em Preparação", color: "purple" },
    delivering: { label: "Saiu para Entrega", color: "indigo" },
    completed: { label: "Concluído", color: "green" },
    cancelled: { label: "Cancelado", color: "red" },
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status do pedido");
      }

      // Atualizar lista de pedidos
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    } catch (err) {
      console.error("Erro ao atualizar pedido:", err);
      alert("Erro ao atualizar status do pedido");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    await updateOrderStatus(orderToCancel.id, "cancelled");
    setCancelModalOpen(false);
    setOrderToCancel(null);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setOrderToCancel(null);
  };

  const getAllOrderSteps = (currentStatus) => {
    const steps = [
      { label: "Receber Pedido", status: "confirmed", color: "blue" },
      { label: "Confirmar Pagamento", status: "preparing", color: "purple" },
      {
        label: "Pedido em Rota de Entrega",
        status: "delivering",
        color: "indigo",
      },
      { label: "Pedido Finalizado", status: "completed", color: "green" },
    ];

    const statusOrder = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      delivering: 3,
      completed: 4,
      cancelled: -1,
    };

    const currentStepIndex = statusOrder[currentStatus] || 0;

    return steps.map((step, index) => ({
      ...step,
      isCompleted: index < currentStepIndex,
      isCurrent: index === currentStepIndex,
      isAvailable: index === currentStepIndex,
      stepNumber: index + 1,
    }));
  };

  const getAvailableActions = (status) => {
    const actions = [];

    switch (status) {
      case "pending":
        actions.push({
          label: "Receber Pedido",
          status: "confirmed",
          color: "blue",
        });
        break;
      case "confirmed":
        actions.push({
          label: "Confirmar forma de pagamento",
          status: "preparing",
          color: "purple",
        });
        break;
      case "preparing":
        actions.push({
          label: "Confirmar pedido em Rota de Entrega",
          status: "delivering",
          color: "indigo",
        });
        break;
      case "delivering":
        actions.push({
          label: "Finalizar Pedido",
          status: "completed",
          color: "green",
        });
        break;
      default:
        break;
    }

    // Adicionar botão de cancelar para pedidos que não foram finalizados ou já cancelados
    if (status !== "completed" && status !== "cancelled") {
      actions.push({
        label: "Cancelar Pedido",
        action: "cancel",
        color: "red",
      });
    }

    return actions;
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

        // Verificar se é o dono da loja
        if (!foundStore.isOwner) {
          throw new Error("Você não tem permissão para ver esta página");
        }

        setStore(foundStore);

        // Buscar pedidos da loja
        const ordersResponse = await fetch(
          `/api/orders?storeId=${foundStore.id}&asStore=true`,
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
            Faça login para ver os pedidos
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
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro</h1>
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
            Meus Pedidos 📋
          </h1>
          <p className="text-gray-600">Pedidos recebidos em {store?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Pedidos</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Aguardando Confirmação</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">
              {
                orders.filter(
                  (o) =>
                    o.status === "confirmed" ||
                    o.status === "preparing" ||
                    o.status === "delivering",
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Concluídos</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Cancelados</p>
            <p className="text-2xl font-bold text-red-600">
              {orders.filter((o) => o.status === "cancelled").length}
            </p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum pedido ainda
            </h2>
            <p className="text-gray-600">
              Sua loja ainda não recebeu nenhum pedido
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const statusInfo =
                statusLabels[order.status] || statusLabels.pending;
              const availableActions = getAvailableActions(order.status);
              const isUpdating = updatingOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg text-gray-900 mb-1">
                          Pedido #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="font-semibold text-gray-900">
                          Cliente: {order.customerName || "Não informado"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Pedido em{" "}
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
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

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
                              Quantidade: {item.quantity} ×{" "}
                              {formatPrice(item.price)}
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

                  {/* Delivery Information */}
                  <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Informações de Entrega
                    </h4>
                    <div className="space-y-2">
                      {/* Tipo de Entrega */}
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">
                          {order.deliveryType === "pickup"
                            ? "🏪 Retirada:"
                            : "🚚 Entrega:"}
                        </span>
                        <span className="text-gray-900">
                          {order.deliveryType === "pickup"
                            ? "Cliente vai retirar na loja"
                            : "Entrega no endereço"}
                        </span>
                      </div>

                      {/* Endereço de Entrega */}
                      {order.deliveryType === "delivery" &&
                        order.deliveryAddress && (
                          <div className="flex items-start">
                            <span className="font-medium text-gray-700 min-w-[140px]">
                              📍 Endereço:
                            </span>
                            <div className="text-gray-900">
                              <p>
                                {order.deliveryAddress.street},{" "}
                                {order.deliveryAddress.number}
                              </p>
                              {order.deliveryAddress.complement && (
                                <p className="text-sm text-gray-600">
                                  Complemento:{" "}
                                  {order.deliveryAddress.complement}
                                </p>
                              )}
                              <p>{order.deliveryAddress.neighborhood}</p>
                              <p>
                                {order.deliveryAddress.city} -{" "}
                                {order.deliveryAddress.state}
                              </p>
                              <p className="text-sm text-gray-600">
                                CEP: {order.deliveryAddress.zipCode}
                              </p>
                              {order.deliveryAddress.latitude &&
                                order.deliveryAddress.longitude && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center mt-1"
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
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    Abrir no Google Maps
                                  </a>
                                )}
                            </div>
                          </div>
                        )}

                      {/* Cliente */}
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">
                          👤 Cliente:
                        </span>
                        <span className="text-gray-900">
                          {order.customerName || "Não informado"}
                        </span>
                      </div>

                      {/* Contatos */}
                      {(order.customerPhone || order.customerWhatsapp) && (
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 min-w-[140px]">
                            📞 Contato:
                          </span>
                          <div className="flex flex-col gap-2">
                            {/* Telefone */}
                            {order.customerPhone && (
                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {order.customerPhone}
                                </a>
                              </div>
                            )}

                            {/* WhatsApp */}
                            {order.customerWhatsapp && (
                              <a
                                href={`https://wa.me/${order.customerWhatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-fit"
                              >
                                <svg
                                  className="w-4 h-4 mr-1.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                WhatsApp: {order.customerWhatsapp}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="px-6 py-4 bg-green-50 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Informações de Pagamento
                    </h4>
                    <div className="space-y-2">
                      {/* Método de Pagamento */}
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">
                          💳 Forma de Pagamento:
                        </span>
                        <span className="text-gray-900">
                          {order.paymentMethod === "pix" && "PIX"}
                          {order.paymentMethod === "credit" &&
                            "Cartão de Crédito"}
                          {order.paymentMethod === "debit" &&
                            "Cartão de Débito"}
                          {order.paymentMethod === "cash" && "Dinheiro"}
                          {!order.paymentMethod && "Não informado"}
                        </span>
                      </div>

                      {/* Troco */}
                      {order.paymentMethod === "cash" &&
                        order.needsChange &&
                        order.changeAmount && (
                          <div className="flex items-start">
                            <span className="font-medium text-gray-700 min-w-[140px]">
                              💵 Troco para:
                            </span>
                            <span className="text-gray-900 font-semibold">
                              {formatPrice(order.changeAmount)}
                            </span>
                          </div>
                        )}

                      {order.paymentMethod === "cash" && !order.needsChange && (
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 min-w-[140px]"></span>
                          <span className="text-gray-600 text-sm">
                            Cliente tem o valor exato
                          </span>
                        </div>
                      )}

                      {/* ID do Pedido */}
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">
                          🔖 ID do Pedido:
                        </span>
                        <span className="text-gray-600 text-sm font-mono">
                          {order.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Steps */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Status do Pedido
                      </h4>
                      <div className="flex flex-col space-y-4 relative">
                        {getAllOrderSteps(order.status).map((step, index) => (
                          <div
                            key={step.status}
                            className="flex items-start relative"
                          >
                            {/* Step Circle */}
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0 z-10 ${
                                step.isCompleted
                                  ? "bg-green-600 text-white"
                                  : step.isCurrent
                                    ? `bg-${step.color}-600 text-white`
                                    : "bg-gray-300 text-gray-600"
                              }`}
                            >
                              {step.isCompleted ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                step.stepNumber
                              )}
                            </div>

                            {/* Step Label */}
                            <div className="ml-3 flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  step.isCompleted
                                    ? "text-green-600"
                                    : step.isCurrent
                                      ? `text-${step.color}-600`
                                      : "text-gray-500"
                                }`}
                              >
                                {step.label}
                              </p>
                            </div>

                            {/* Vertical Connector Line */}
                            {index <
                              getAllOrderSteps(order.status).length - 1 && (
                              <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-300">
                                {step.isCompleted && (
                                  <div className="w-full h-full bg-green-600" />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {availableActions && availableActions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {availableActions.map((action) => (
                          <button
                            key={action.status || action.action}
                            onClick={() =>
                              action.action === "cancel"
                                ? handleCancelOrder(order)
                                : updateOrderStatus(order.id, action.status)
                            }
                            disabled={isUpdating}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              isUpdating
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : action.color === "blue"
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : action.color === "purple"
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : action.color === "indigo"
                                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                      : action.color === "green"
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : action.color === "red"
                                          ? "bg-red-600 text-white hover:bg-red-700"
                                          : "bg-gray-600 text-white hover:bg-gray-700"
                            }`}
                          >
                            {isUpdating ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Atualizando...
                              </span>
                            ) : (
                              action.label
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Confirmação de Cancelamento */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmar Cancelamento
              </h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja cancelar este pedido?
                <br />
                <span className="font-medium text-gray-900">
                  Cliente: {orderToCancel?.customerName || "Não informado"}
                </span>
                <br />
                <span className="font-medium text-green-600">
                  Total: {orderToCancel ? formatPrice(orderToCancel.total) : ""}
                </span>
              </p>
              <p className="text-sm text-red-600 mb-6">
                ⚠️ Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Não, manter pedido
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={updatingOrder === orderToCancel?.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingOrder === orderToCancel?.id ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Cancelando...
                    </span>
                  ) : (
                    "Sim, cancelar pedido"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
