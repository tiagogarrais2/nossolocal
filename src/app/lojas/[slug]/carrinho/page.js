"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import { formatPrice } from "../../../../lib/utils";

export default function CarrinhoLojaPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(null); // { itemId, value }
  const [paymentMethod, setPaymentMethod] = useState("pix"); // pix, credit, debit, cash
  const [changeAmount, setChangeAmount] = useState("");
  const [needsChange, setNeedsChange] = useState(false); // Controla se precisa de troco
  const [deliveryType, setDeliveryType] = useState("delivery"); // delivery or pickup
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);

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

  // Carregar dados da loja
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!slug) return;

      try {
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
      } catch (err) {
        console.error("Erro ao carregar dados da loja:", err);
        setErrors([err.message]);
      }
    };

    fetchStoreData();
  }, [slug]);

  // Buscar carrinho quando a loja for carregada
  useEffect(() => {
    if (store) {
      fetchCart();
    }
  }, [store]);

  // Buscar endereços quando o usuário estiver logado
  useEffect(() => {
    if (session?.user) {
      fetchUserAddresses();
    }
  }, [session]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        // Verificar se o carrinho é desta loja
        if (data.cart && data.cart.storeId === store.id) {
          setCart(data.cart);
        } else {
          setCart(null);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar carrinho:", error);
      setErrors(["Erro ao carregar carrinho"]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddresses = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/addresses");
      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.addresses || []);
        // Selecionar o primeiro endereço como padrão se houver
        if (data.addresses && data.addresses.length > 0 && !selectedAddress) {
          setSelectedAddress(data.addresses[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
        setSuccessMessage("Quantidade atualizada!");
        setTimeout(() => setSuccessMessage(""), 2000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao atualizar quantidade"]);
        setTimeout(() => setErrors([]), 3000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
      setTimeout(() => setErrors([]), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    if (!confirm("Remover este item do carrinho?")) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cart && data.cart.storeId === store.id) {
          setCart(data.cart);
        } else {
          setCart(null);
        }
        setSuccessMessage("Item removido do carrinho!");
        setTimeout(() => setSuccessMessage(""), 2000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao remover item"]);
        setTimeout(() => setErrors([]), 3000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
      setTimeout(() => setErrors([]), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!confirm("Limpar todo o carrinho?")) return;

    try {
      setUpdating(true);
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (response.ok) {
        setCart(null);
        setSuccessMessage("Carrinho limpo!");
        setTimeout(() => setSuccessMessage(""), 2000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao limpar carrinho"]);
        setTimeout(() => setErrors([]), 3000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
      setTimeout(() => setErrors([]), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      return total + parseFloat(item.product.price) * item.quantity;
    }, 0);
  };

  const calculateDeliveryFee = () => {
    // Se for retirada na loja, não há taxa de entrega
    if (deliveryType === "pickup") {
      return 0;
    }

    if (!store?.deliveryFee) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const threshold = parseFloat(store.freeShippingThreshold) || 0;

    // Verificar se frete é grátis - threshold deve ser um número válido > 0
    if (threshold > 0 && subtotal >= threshold) {
      return 0;
    }

    return parseFloat(store.deliveryFee);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const calculateAmountForFreeShipping = () => {
    if (!store?.freeShippingThreshold) return 0;

    const subtotal = calculateSubtotal();
    const threshold = parseFloat(store.freeShippingThreshold);

    if (subtotal >= threshold) return 0;

    return threshold - subtotal;
  };

  const handleFinalizarPedido = async () => {
    if (creatingOrder) return;

    try {
      setCreatingOrder(true);
      setErrors([]);

      // Verificar se há sessão
      if (!session) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }

      // Impedir que o dono da loja finalize pedidos da própria loja
      if (store.isOwner) {
        setErrors(["Você não pode finalizar pedidos da sua própria loja."]);
        setCreatingOrder(false);
        return;
      }

      // Validar valor do troco apenas se o pagamento for em dinheiro E precisar de troco
      if (paymentMethod === "cash" && needsChange) {
        const total = calculateTotal();
        const changeValue = parseFloat(changeAmount);

        if (!changeAmount || isNaN(changeValue)) {
          setErrors(["Por favor, informe o valor que você terá para pagar."]);
          setCreatingOrder(false);
          return;
        }

        if (changeValue < total) {
          setErrors([
            `O valor informado (${formatPrice(changeValue)}) é menor que o total do pedido (${formatPrice(total)}). Por favor, informe um valor suficiente para cobrir o pedido e o troco.`,
          ]);
          setCreatingOrder(false);
          return;
        }
      }

      // Validar tipo de entrega e endereço
      if (deliveryType === "delivery" && !selectedAddress) {
        setErrors(["Por favor, selecione um endereço para entrega."]);
        setCreatingOrder(false);
        return;
      }

      // Preparar dados do pedido
      const orderItems = cart.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: parseFloat(item.product.price),
        quantity: item.quantity,
      }));

      const subtotal = calculateSubtotal();
      const deliveryFee = calculateDeliveryFee();
      const total = calculateTotal();

      const orderData = {
        storeId: store.id,
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        customerName: session?.user?.name,
        customerPhone: null,
        paymentMethod,
        needsChange,
        changeAmount: needsChange ? parseFloat(changeAmount) : null,
        deliveryType,
        deliveryAddress: deliveryType === "delivery" ? selectedAddress : null,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar pedido");
      }

      const data = await response.json();

      // Redirecionar para checkout com o ID do pedido
      router.push(`/lojas/${slug}/checkout?orderId=${data.order.id}`);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      setErrors([error.message]);
      setTimeout(() => setErrors([]), 5000);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/lojas/${slug}`}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Voltar para {store.name}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Carrinho - {store.name} 🛒
          </h1>
          <p className="text-gray-600">
            Revise seus itens antes de finalizar o pedido
          </p>
        </div>

        {/* Toast Notification */}
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

        {!cart || !cart.items || cart.items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-600 mb-6">
              Adicione produtos de {store.name} ao carrinho para fazer um pedido
            </p>
            <Link
              href={`/lojas/${slug}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Store Info */}
              <div className="bg-white rounded-xl shadow-md p-4 mb-4">
                <div className="mb-3">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      🏪 {store.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📍 {store.city}, {getStateDisplay(store.state)}
                    </p>
                  </div>
                  <Link
                    href={`/lojas/${slug}`}
                    className="inline-block w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    + Adicionar mais itens
                  </Link>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 pt-3 border-t">
                  {store.minimumOrder && (
                    <div>
                      <span className="font-medium">Pedido mínimo:</span>{" "}
                      <span className="text-green-600 font-semibold">
                        {formatPrice(parseFloat(store.minimumOrder))}
                      </span>
                    </div>
                  )}
                  {store.deliveryFee !== null &&
                    store.deliveryFee !== undefined && (
                      <div>
                        <span className="font-medium">Taxa de entrega:</span>{" "}
                        <span className="text-green-600 font-semibold">
                          {store.deliveryFee === 0
                            ? "Grátis"
                            : formatPrice(parseFloat(store.deliveryFee))}
                        </span>
                      </div>
                    )}
                  {store.freeShippingThreshold &&
                    parseFloat(store.freeShippingThreshold) > 0 && (
                      <div>
                        <span className="font-medium">
                          Frete grátis à partir de:
                        </span>{" "}
                        <span className="text-blue-600 font-semibold">
                          {formatPrice(parseFloat(store.freeShippingThreshold))}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col">
                    {/* Product Image */}
                    <div className="w-full h-48 flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">🍽️</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {item.product.name}
                          </h3>
                          {item.product.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.product.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating}
                          className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50 ml-2"
                          title="Remover item"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity Controls - Now below image */}
                      <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={updating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-white text-gray-700 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={
                              editingQuantity &&
                              editingQuantity.itemId === item.id
                                ? editingQuantity.value
                                : item.quantity
                            }
                            onFocus={(e) => {
                              setEditingQuantity({
                                itemId: item.id,
                                value: item.quantity.toString(),
                              });
                            }}
                            onChange={(e) => {
                              setEditingQuantity({
                                itemId: item.id,
                                value: e.target.value,
                              });
                            }}
                            onBlur={(e) => {
                              if (
                                editingQuantity &&
                                editingQuantity.itemId === item.id
                              ) {
                                const newQuantity =
                                  parseInt(editingQuantity.value) || 1;
                                if (
                                  newQuantity >= 1 &&
                                  newQuantity !== item.quantity
                                ) {
                                  updateQuantity(item.id, newQuantity);
                                }
                              }
                              setEditingQuantity(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.target.blur(); // Trigger onBlur
                              } else if (e.key === "Escape") {
                                setEditingQuantity(null);
                              }
                            }}
                            disabled={updating}
                            className="w-16 h-8 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={updating}
                            className="w-8 h-8 flex items-center justify-center bg-white text-gray-700 rounded-full hover:bg-gray-100 disabled:opacity-50 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          {formatPrice(parseFloat(item.product.price))} cada
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(
                            parseFloat(item.product.price) * item.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={clearCart}
                disabled={updating}
                className="w-full py-3 text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
              >
                Limpar Carrinho
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Resumo do Pedido
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Subtotal ({cart.items.length}{" "}
                      {cart.items.length === 1 ? "item" : "itens"})
                    </span>
                    <span>{formatPrice(calculateSubtotal())}</span>
                  </div>

                  {calculateDeliveryFee() > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de Entrega</span>
                      <span>{formatPrice(calculateDeliveryFee())}</span>
                    </div>
                  )}
                  {calculateDeliveryFee() === 0 &&
                    store?.freeShippingThreshold &&
                    parseFloat(store.freeShippingThreshold) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Frete Grátis</span>
                        <span>Grátis</span>
                      </div>
                    )}

                  {calculateDeliveryFee() > 0 &&
                    store?.freeShippingThreshold &&
                    parseFloat(store.freeShippingThreshold) > 0 &&
                    calculateAmountForFreeShipping() > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          🚚 Adicione{" "}
                          {formatPrice(calculateAmountForFreeShipping())} para
                          frete grátis!
                        </p>
                      </div>
                    )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-green-600">
                        {formatPrice(calculateTotal())}
                      </span>
                    </div>
                  </div>

                  {store.minimumOrder &&
                    calculateSubtotal() < parseFloat(store.minimumOrder) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Valor mínimo de pedido:{" "}
                          {formatPrice(parseFloat(store.minimumOrder))}
                          <br />
                          Faltam:{" "}
                          {formatPrice(
                            parseFloat(store.minimumOrder) -
                              calculateSubtotal(),
                          )}
                        </p>
                      </div>
                    )}
                </div>

                {/* Delivery Type Selection */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Tipo de Entrega
                  </h4>

                  <div className="space-y-3">
                    {/* Delivery */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={deliveryType === "delivery"}
                        onChange={(e) => setDeliveryType(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        🚚 Entrega em domicílio
                      </span>
                    </label>

                    {/* Pickup */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={deliveryType === "pickup"}
                        onChange={(e) => setDeliveryType(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        🏪 Retirada na loja
                      </span>
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        (Sem taxa de entrega)
                      </span>
                    </label>
                  </div>

                  {/* Address Selection - Only show if delivery is selected */}
                  {deliveryType === "delivery" && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Endereço de Entrega
                      </h5>

                      {userAddresses.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 mb-2">
                            Você ainda não cadastrou nenhum endereço.
                          </p>
                          <Link
                            href="/painel/addresses"
                            className="inline-block bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Cadastrar Endereço
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {userAddresses.map((address) => (
                            <label
                              key={address.id}
                              className="flex items-start"
                            >
                              <input
                                type="radio"
                                name="selectedAddress"
                                value={address.id}
                                checked={selectedAddress?.id === address.id}
                                onChange={() => setSelectedAddress(address)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                              />
                              <div className="ml-3 flex-1">
                                <div className="text-sm text-gray-900">
                                  {address.street}, {address.number}
                                  {address.complement &&
                                    ` - ${address.complement}`}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {address.neighborhood}, {address.city} -{" "}
                                  {getStateDisplay(address.state)}
                                </div>
                                {address.reference && (
                                  <div className="text-xs text-gray-500">
                                    Referência: {address.reference}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                          <div className="pt-2 border-t">
                            <Link
                              href="/painel/addresses"
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              + Adicionar novo endereço
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Options */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Forma de Pagamento
                  </h4>

                  <div className="space-y-3">
                    {/* PIX */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="pix"
                        checked={paymentMethod === "pix"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        📱 PIX
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (Pagamento instantâneo)
                      </span>
                    </label>

                    {/* Credit Card */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit"
                        checked={paymentMethod === "credit"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        💳 Cartão de Crédito
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (Entregador leva a maquininha)
                      </span>
                    </label>

                    {/* Debit Card */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="debit"
                        checked={paymentMethod === "debit"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        💳 Cartão de Débito
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (Entregador leva a maquininha)
                      </span>
                    </label>

                    {/* Cash */}
                    <label className="flex items-start">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setNeedsChange(false); // Reset quando muda para dinheiro
                          setChangeAmount(""); // Limpar valor
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-gray-700">
                          💵 Dinheiro
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          (Entregador leva o troco)
                        </span>
                        {paymentMethod === "cash" && (
                          <div className="mt-2">
                            <div className="mb-2">
                              <label className="block text-xs text-gray-600 mb-2">
                                Precisa de troco?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="needsChange"
                                    checked={!needsChange}
                                    onChange={() => {
                                      setNeedsChange(false);
                                      setChangeAmount("");
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Não
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="needsChange"
                                    checked={needsChange}
                                    onChange={() => setNeedsChange(true)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Sim
                                  </span>
                                </label>
                              </div>
                            </div>
                            {needsChange && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Trazer troco para:
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                    R$
                                  </span>
                                  <input
                                    type="number"
                                    min={calculateTotal()}
                                    step="0.01"
                                    value={changeAmount}
                                    onChange={(e) =>
                                      setChangeAmount(e.target.value)
                                    }
                                    placeholder={`Mínimo ${formatPrice(calculateTotal())}`}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  />
                                </div>
                                {changeAmount &&
                                  parseFloat(changeAmount) >
                                    calculateTotal() && (
                                    <p className="mt-1 text-xs text-green-600 font-medium">
                                      💰 O seu troco é de{" "}
                                      {formatPrice(
                                        parseFloat(changeAmount) -
                                          calculateTotal(),
                                      )}
                                    </p>
                                  )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleFinalizarPedido}
                  disabled={
                    creatingOrder ||
                    (store.minimumOrder &&
                      calculateSubtotal() < parseFloat(store.minimumOrder)) ||
                    store.isOwner
                  }
                  className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingOrder ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Criando pedido...
                    </span>
                  ) : store.isOwner ? (
                    "Não é possível finalizar pedidos da própria loja"
                  ) : (
                    "Finalizar Pedido"
                  )}
                </button>

                <Link
                  href={`/lojas/${slug}`}
                  className="block w-full text-center py-3 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Continuar Comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
