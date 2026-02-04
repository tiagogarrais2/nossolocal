"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Footer from "../../../../components/Footer";
import { formatPrice } from "../../../../lib/utils";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [order, setOrder] = useState(null);
  const [pixKey, setPixKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [copied, setCopied] = useState(false);

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
    if (state && state.length === 2 && isNaN(state)) {
      return state.toUpperCase();
    }
    return stateCodeToUF[state] || state;
  };

  const pixKeyTypeLabels = {
    cpf: "CPF",
    cnpj: "CNPJ",
    email: "E-mail",
    phone: "Telefone",
    random: "Chave Aleatória",
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      // Pegar orderId da URL
      const searchParams = new URLSearchParams(window.location.search);
      const orderId = searchParams.get("orderId");

      if (!orderId) {
        setErrors(["ID do pedido não encontrado"]);
        setLoading(false);
        return;
      }

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

        // Buscar pedido
        const ordersResponse = await fetch(`/api/orders?orderId=${orderId}`);
        if (!ordersResponse.ok) {
          throw new Error("Pedido não encontrado");
        }

        const ordersData = await ordersResponse.json();
        if (!ordersData.order) {
          throw new Error("Pedido não encontrado");
        }

        setOrder(ordersData.order);

        // Buscar chave PIX preferencial da loja
        const pixResponse = await fetch(
          `/api/pix-keys?storeId=${foundStore.id}`,
        );
        if (pixResponse.ok) {
          const pixData = await pixResponse.json();
          const primaryKey = pixData.pixKeys?.find((key) => key.isPrimary);
          if (primaryKey) {
            setPixKey(primaryKey);
          } else if (pixData.pixKeys?.length > 0) {
            setPixKey(pixData.pixKeys[0]);
          } else {
            throw new Error("Loja não possui chave PIX cadastrada");
          }
        } else {
          throw new Error("Erro ao buscar chave PIX da loja");
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setErrors([err.message]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const calculateSubtotal = () => {
    return order?.subtotal || 0;
  };

  const calculateTotal = () => {
    return order?.total || 0;
  };

  const copyPixKey = () => {
    if (pixKey?.key) {
      navigator.clipboard.writeText(pixKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPixKey = (key, type) => {
    if (!key) return "";

    switch (type) {
      case "cpf":
        // Format: 000.000.000-00
        return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      case "cnpj":
        // Format: 00.000.000/0000-00
        return key.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5",
        );
      case "phone":
        // Format: (00) 00000-0000 or +55 (00) 00000-0000
        if (key.startsWith("+")) {
          return key.replace(/(\+\d{2})(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4");
        }
        return key.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      default:
        return key;
    }
  };

  const formatWhatsAppNumber = (phone) => {
    if (!phone) return "";
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "");
    // Se não começar com 55 (código do Brasil), adiciona
    if (!cleaned.startsWith("55")) {
      return "55" + cleaned;
    }
    return cleaned;
  };

  const getWhatsAppLink = () => {
    const whatsappNumber = formatWhatsAppNumber(store?.phone);
    const message = encodeURIComponent(
      `Olá! Acabei de realizar o pagamento do meu pedido na ${
        store?.name
      }.\n\nValor: ${formatPrice(calculateTotal())}\n\nSegue o comprovante:`,
    );
    return `https://wa.me/${whatsappNumber}?text=${message}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Erro ao carregar checkout
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
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
              {session ? (
                <>
                  <span className="text-gray-700">
                    Olá, {session.user?.name}
                  </span>
                  <Link
                    href="/painel"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Painel
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/lojas/${slug}`}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Voltar para {store?.name}
          </Link>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <svg
                className="w-8 h-8 text-red-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-bold text-red-900">Erro</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-red-800">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">
            {order?.paymentMethod === "pix" && "📱💰"}
            {order?.paymentMethod === "credit" && "💳💰"}
            {order?.paymentMethod === "debit" && "💳💰"}
            {order?.paymentMethod === "cash" && "💵💰"}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Finalizar Pedido
          </h1>
          <p className="text-gray-600">
            {order?.paymentMethod === "pix" &&
              "Complete o pagamento via PIX para confirmar seu pedido"}
            {order?.paymentMethod === "credit" &&
              "O entregador levará a maquininha para pagamento em cartão de crédito"}
            {order?.paymentMethod === "debit" &&
              "O entregador levará a maquininha para pagamento em cartão de débito"}
            {order?.paymentMethod === "cash" &&
              "Prepare o dinheiro para o entregador"}
          </p>
        </div>

        {/* Payment Instructions */}
        {order?.paymentMethod === "pix" && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="text-6xl">💰</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Instruções para Pagamento via PIX
            </h2>

            {/* Store Info */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🏪</span>
                Informações da Loja
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Nome:</span> {store?.name}
                </p>
                <p>
                  <span className="font-medium">Localização:</span>{" "}
                  {store?.city}, {getStateDisplay(store?.state)}
                </p>
                {store?.phone && (
                  <p>
                    <span className="font-medium">Telefone:</span> {store.phone}
                  </p>
                )}
              </div>
            </div>

            {/* PIX Key Info */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🔑</span>
                Chave PIX para Pagamento
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo de Chave:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {pixKeyTypeLabels[pixKey?.type] || pixKey?.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Chave PIX:</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg font-mono text-gray-900 break-all">
                      {pixKey?.key?.replace(/\D/g, "")}
                    </div>
                    <button
                      onClick={copyPixKey}
                      className="bg-blue-600 text-white px-4 py-4 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                      title="Copiar chave PIX"
                    >
                      {copied ? (
                        <span className="flex items-center">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center">
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Chave copiada para a área de transferência!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {order?.paymentMethod === "credit" && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="text-6xl">💳</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Pagamento em Cartão de Crédito
            </h2>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  O entregador levará a maquininha de cartão quando entregar seu
                  pedido.
                </p>
                <p className="text-sm text-gray-600">
                  Tenha seu cartão de crédito em mãos no momento da entrega.
                </p>
              </div>
            </div>
          </div>
        )}

        {order?.paymentMethod === "debit" && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="text-6xl">💳</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Pagamento em Cartão de Débito
            </h2>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  O entregador levará a maquininha de cartão quando entregar seu
                  pedido.
                </p>
                <p className="text-sm text-gray-600">
                  Tenha seu cartão de débito em mãos no momento da entrega.
                </p>
              </div>
            </div>
          </div>
        )}

        {order?.paymentMethod === "cash" && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="text-6xl">💵</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Pagamento em Dinheiro
            </h2>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Prepare o dinheiro para o entregador no momento da entrega.
                </p>
                {order?.needsChange && order?.changeAmount && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800 mb-2">
                      💰 Troco necessário
                    </p>
                    <p className="text-yellow-700">
                      Entregue{" "}
                      <span className="font-bold">
                        {formatPrice(order.changeAmount)}
                      </span>{" "}
                      ao entregador
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Você receberá{" "}
                      {formatPrice(order.changeAmount - order.total)} de troco
                    </p>
                  </div>
                )}
                {!order?.needsChange && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">✅ Valor justo</p>
                    <p className="text-green-700 text-sm">
                      Entregue exatamente {formatPrice(order.total)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer and Delivery Info */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">👤</span>
            Informações do Cliente e Entrega
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Dados do Cliente</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-600">Nome:</span>{" "}
                  <span className="text-gray-900">
                    {order?.customerName ||
                      session?.user?.name ||
                      "Não informado"}
                  </span>
                </p>
                {order?.customerPhone && (
                  <p>
                    <span className="font-medium text-gray-600">Telefone:</span>{" "}
                    <span className="text-gray-900">{order.customerPhone}</span>
                  </p>
                )}
                <p>
                  <span className="font-medium text-gray-600">
                    Tipo de Entrega:
                  </span>{" "}
                  <span className="text-gray-900">
                    {order?.deliveryType === "pickup"
                      ? "🏪 Retirada na Loja"
                      : "🚚 Entrega em Domicílio"}
                  </span>
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            {order?.deliveryType === "delivery" && order?.deliveryAddress && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Endereço de Entrega
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-600">Endereço:</span>{" "}
                    <span className="text-gray-900">
                      {order.deliveryAddress.street},{" "}
                      {order.deliveryAddress.number}
                      {order.deliveryAddress.complement &&
                        ` - ${order.deliveryAddress.complement}`}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Bairro:</span>{" "}
                    <span className="text-gray-900">
                      {order.deliveryAddress.neighborhood}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">
                      Cidade/UF:
                    </span>{" "}
                    <span className="text-gray-900">
                      {order.deliveryAddress.city},{" "}
                      {getStateDisplay(order.deliveryAddress.state)}
                    </span>
                  </p>
                  {order.deliveryAddress.zipCode && (
                    <p>
                      <span className="font-medium text-gray-600">CEP:</span>{" "}
                      <span className="text-gray-900">
                        {order.deliveryAddress.zipCode}
                      </span>
                    </p>
                  )}
                  {order.deliveryAddress.reference && (
                    <p>
                      <span className="font-medium text-gray-600">
                        Referência:
                      </span>{" "}
                      <span className="text-gray-900">
                        {order.deliveryAddress.reference}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Info */}
            {order?.deliveryType === "pickup" && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Retirada na Loja</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    Você poderá retirar seu pedido diretamente na loja nos
                    horários de funcionamento.
                  </p>
                  <p className="text-gray-600">
                    Leve este comprovante ou informe o número do pedido.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📋</span>
            Resumo do Pedido
          </h3>

          {/* Payment Method */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Forma de Pagamento
            </h4>
            <div className="flex items-center">
              {order?.paymentMethod === "pix" && (
                <>
                  <span className="text-2xl mr-2">📱</span>
                  <span className="font-medium text-gray-900">PIX</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (Pagamento instantâneo)
                  </span>
                </>
              )}
              {order?.paymentMethod === "credit" && (
                <>
                  <span className="text-2xl mr-2">💳</span>
                  <span className="font-medium text-gray-900">
                    Cartão de Crédito
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    (Entregador leva a maquininha)
                  </span>
                </>
              )}
              {order?.paymentMethod === "debit" && (
                <>
                  <span className="text-2xl mr-2">💳</span>
                  <span className="font-medium text-gray-900">
                    Cartão de Débito
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    (Entregador leva a maquininha)
                  </span>
                </>
              )}
              {order?.paymentMethod === "cash" && (
                <>
                  <span className="text-2xl mr-2">💵</span>
                  <span className="font-medium text-gray-900">Dinheiro</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (Entregador leva o troco)
                  </span>
                  {order?.needsChange && order?.changeAmount && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Troco para: </span>
                      <span className="font-medium text-green-600">
                        {formatPrice(order.changeAmount)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (Troco: {formatPrice(order.changeAmount - order.total)})
                      </span>
                    </div>
                  )}
                  {!order?.needsChange && (
                    <div className="mt-2 text-sm text-gray-600">
                      Valor justo - sem necessidade de troco
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4">
            {order?.items?.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200"
              >
                <div className="flex-1">
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

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t-2 border-gray-300">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>{formatPrice(calculateSubtotal())}</span>
            </div>
            {order?.deliveryFee > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Taxa de entrega:</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-green-600 pt-2">
              <span>Total a Pagar:</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Section */}
        {order?.paymentMethod === "pix" && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Envie o Comprovante
              </h3>
              <p className="text-gray-600 mb-4">
                Após realizar o pagamento, envie o comprovante para a loja pelo
                WhatsApp
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mb-6">
                <p className="text-sm text-gray-600 mb-1">WhatsApp da Loja:</p>
                <p className="text-2xl font-bold text-green-600">
                  {store?.phone}
                </p>
              </div>
            </div>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl text-center"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Enviar Comprovante pelo WhatsApp
              </span>
            </a>
          </div>
        )}

        {(order?.paymentMethod === "credit" ||
          order?.paymentMethod === "debit") && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Pagamento na Entrega
              </h3>
              <p className="text-gray-600 mb-4">
                O entregador levará a maquininha de cartão quando entregar seu
                pedido
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mb-6">
                <p className="text-sm text-gray-600 mb-1">WhatsApp da Loja:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {store?.phone}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Tenha seu cartão em mãos no momento da entrega. O entregador irá
                processar o pagamento diretamente na maquininha.
              </p>
            </div>
          </div>
        )}

        {order?.paymentMethod === "cash" && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💵</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Pagamento em Dinheiro
              </h3>
              <p className="text-gray-600 mb-4">
                Prepare o dinheiro para o entregador
              </p>
              <div className="bg-white rounded-lg p-4 inline-block mb-6">
                <p className="text-sm text-gray-600 mb-1">WhatsApp da Loja:</p>
                <p className="text-2xl font-bold text-orange-600">
                  {store?.phone}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-700 mb-4">
                O entregador irá até sua localização com o pedido e você poderá
                efetuar o pagamento em dinheiro.
              </p>
              {order?.needsChange && order?.changeAmount && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 inline-block">
                  <p className="font-medium text-yellow-800 mb-2">
                    💰 Troco necessário
                  </p>
                  <p className="text-yellow-700">
                    Tenha {formatPrice(order.changeAmount)} preparado
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Você receberá{" "}
                    {formatPrice(order.changeAmount - order.total)} de troco
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">⚠️</span>
            Importante:
          </h3>
          <ul className="space-y-2 text-yellow-800 text-sm">
            {order?.paymentMethod === "pix" && (
              <>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Tire um print ou salve o comprovante de pagamento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Envie o comprovante pelo WhatsApp para confirmar seu pedido
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    A loja confirmará o recebimento e entrará em contato para os
                    próximos passos
                  </span>
                </li>
              </>
            )}
            {(order?.paymentMethod === "credit" ||
              order?.paymentMethod === "debit") && (
              <>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Tenha seu cartão em mãos no momento da entrega</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    O entregador levará a maquininha para processar o pagamento
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Verifique se o valor na maquininha está correto antes de
                    confirmar
                  </span>
                </li>
              </>
            )}
            {order?.paymentMethod === "cash" && (
              <>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Prepare o dinheiro correto no momento da entrega</span>
                </li>
                {order?.needsChange && order?.changeAmount && (
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Tenha {formatPrice(order.changeAmount)} para pagar
                      (incluindo troco)
                    </span>
                  </li>
                )}
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Conte o dinheiro e o troco na presença do entregador
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Link
            href={`/lojas/${slug}/minhas-compras`}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl inline-flex items-center"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Ver Minhas Compras
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
