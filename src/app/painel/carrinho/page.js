"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { formatPrice } from "../../../lib/utils";

export default function CarrinhoPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [changeAmount, setChangeAmount] = useState("");
  const [needsChange, setNeedsChange] = useState(false);
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [visibleErrors, setVisibleErrors] = useState([]);
  const errorTimeoutRef = useRef(null);

  // Mostrar erros com toast e scroll automático
  useEffect(() => {
    if (errors.length > 0) {
      setVisibleErrors(errors);
      // Scroll suave para o topo
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);

      // Auto-dismiss dos erros após 6 segundos
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setVisibleErrors([]);
      }, 6000);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [errors]);

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

  // Buscar carrinho
  useEffect(() => {
    fetchCart();
  }, []);

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
        setCart(data.cart);
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
        if (data.addresses && data.addresses.length > 0 && !selectedAddress) {
          setSelectedAddress(data.addresses[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    // Guardar o estado anterior para reverter em caso de erro
    const previousCart = cart;
    const itemIndex = cart.items.findIndex((item) => item.id === cartItemId);

    if (itemIndex === -1) return;

    try {
      setUpdating(true);
      setErrors([]);

      // Atualizar o carrinho localmente de forma otimista
      const updatedItems = [...cart.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: newQuantity,
      };
      setCart({ ...cart, items: updatedItems });
      setEditingQuantity(null);

      // Fazer a requisição para o servidor
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        // Reverter em caso de erro
        setCart(previousCart);
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao atualizar quantidade"]);
      }
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      // Reverter em caso de erro
      setCart(previousCart);
      setErrors(["Erro ao atualizar quantidade"]);
    } finally {
      setUpdating(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    // Guardar o estado anterior para reverter em caso de erro
    const previousCart = cart;

    try {
      setUpdating(true);
      setErrors([]);

      // Remover o item localmente de forma otimista
      const updatedItems = cart.items.filter((item) => item.id !== cartItemId);
      setCart({ ...cart, items: updatedItems });

      // Fazer a requisição para o servidor
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Produto removido do carrinho");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        // Reverter em caso de erro
        setCart(previousCart);
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao remover produto"]);
      }
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      // Reverter em caso de erro
      setCart(previousCart);
      setErrors(["Erro ao remover produto"]);
    } finally {
      setUpdating(false);
    }
  };

  const groupItemsByStore = (items) => {
    const grouped = {};
    items.forEach((item) => {
      const storeId = item.product.storeId;
      if (!grouped[storeId]) {
        grouped[storeId] = {
          store: item.product.store,
          items: [],
        };
      }
      grouped[storeId].items.push(item);
    });
    return grouped;
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  };

  const calculateStoreTotal = (storeItems, deliveryFee = 0) => {
    const subtotal = storeItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    return subtotal + deliveryFee;
  };

  // Filtrar endereços que pertencem à cidade da loja
  const getValidAddressesForStore = (store, addresses) => {
    if (!store || !store.city || !addresses) {
      return addresses || [];
    }
    return addresses.filter(
      (address) =>
        address.city && address.city.toLowerCase() === store.city.toLowerCase(),
    );
  };

  const calculateDeliveryFee = (subtotal, store, isPickup = false) => {
    // Se for retirada na loja, não cobra taxa de entrega
    if (isPickup) {
      return 0;
    }

    // Se o subtotal atingiu o valor mínimo para frete grátis, retorna 0
    if (
      store.freeShippingThreshold &&
      subtotal >= store.freeShippingThreshold
    ) {
      return 0;
    }
    // Caso contrário, retorna a taxa de entrega padrão
    return store.deliveryFee || 0;
  };

  const handleCreateOrder = async (storeIdToProcess = null) => {
    if (!cart || !cart.items || cart.items.length === 0) {
      setErrors(["Carrinho vazio"]);
      return;
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (deliveryType === "delivery" && !selectedAddress) {
      setErrors(["Selecione um endereço de entrega"]);
      return;
    }

    // Validar se o endereço está na mesma cidade da loja
    if (deliveryType === "delivery" && selectedAddress) {
      const groupedItems = groupItemsByStore(cart.items);
      const storeIdToValidate =
        storeIdToProcess || Object.keys(groupedItems)[0];
      const store = groupedItems[storeIdToValidate].store;

      if (
        store.city &&
        selectedAddress.city &&
        selectedAddress.city.toLowerCase() !== store.city.toLowerCase()
      ) {
        setErrors([
          `O endereço selecionado está em ${selectedAddress.city}, mas entregamos apenas em ${store.city}.`,
        ]);
        return;
      }
    }

    if (paymentMethod === "cash" && needsChange && changeAmount) {
      const changeValue = parseFloat(changeAmount);
      // Obter o total da compra
      const groupedItems = groupItemsByStore(cart.items);
      const storeIdForValidation =
        storeIdToProcess || Object.keys(groupedItems)[0];
      const { items } = groupedItems[storeIdForValidation];
      const subtotal = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const store = groupedItems[storeIdForValidation].store;
      const deliveryFee = calculateDeliveryFee(
        subtotal,
        store,
        deliveryType === "pickup",
      );
      const total = subtotal + deliveryFee;

      if (changeValue <= total) {
        setErrors([
          "O valor a pagar deve ser maior que o total da compra para gerar troco",
        ]);
        return;
      }
    }

    try {
      setCreatingOrder(true);
      setErrors([]);

      // Agrupar itens por loja para criar um pedido por loja
      const groupedItems = groupItemsByStore(cart.items);

      // Se storeIdToProcess foi fornecido, processa apenas essa loja
      // Caso contrário, processa todas
      const storesToProcess = storeIdToProcess
        ? { [storeIdToProcess]: groupedItems[storeIdToProcess] }
        : groupedItems;

      const processedStoreIds = [];
      let firstOrderId = null;
      let firstStoreSlug = null;

      for (const storeId in storesToProcess) {
        const { store, items } = groupedItems[storeId];
        const subtotal = items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );
        const deliveryFee = calculateDeliveryFee(
          subtotal,
          store,
          deliveryType === "pickup",
        );
        const total = subtotal + deliveryFee;

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: store.id,
            items: items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            })),
            subtotal,
            deliveryFee,
            total,
            paymentMethod,
            deliveryType,
            deliveryAddress:
              deliveryType === "delivery" ? selectedAddress : null,
            needsChange: paymentMethod === "cash" && needsChange,
            changeAmount:
              paymentMethod === "cash" && needsChange
                ? parseFloat(changeAmount)
                : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao criar pedido");
        }

        const orderData = await response.json();
        if (!firstOrderId) {
          firstOrderId = orderData.order?.id;
          firstStoreSlug = store.slug;
        }

        processedStoreIds.push(storeId);
      }

      // Remover apenas os itens das lojas processadas do carrinho
      if (processedStoreIds.length > 0) {
        const updatedItems = cart.items.filter(
          (item) => !processedStoreIds.includes(item.product.storeId),
        );
        setCart({
          ...cart,
          items: updatedItems,
        });
      }

      // Redirecionar para o checkout da primeira loja processada
      if (firstOrderId && firstStoreSlug) {
        router.push(
          `/lojas/${firstStoreSlug}/checkout?orderId=${firstOrderId}`,
        );
      } else {
        throw new Error("Não foi possível obter as informações do pedido");
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      setErrors([error.message || "Erro ao criar pedido"]);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando carrinho...</p>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              Seu carrinho está vazio
            </p>
            <Link href="/lojas" className="text-blue-600 hover:text-blue-800">
              Voltar para lojas
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const groupedItems = groupItemsByStore(cart.items);
  const total = calculateTotal();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meu Carrinho</h1>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* Toast de Erro Flutuante */}
        {visibleErrors.length > 0 && (
          <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-red-500 text-white rounded-lg shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <svg
                      className="w-6 h-6 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Erro na compra</h3>
                      <ul className="text-sm space-y-1">
                        {visibleErrors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setVisibleErrors([])}
                    className="flex-shrink-0 text-red-200 hover:text-white ml-2 pt-0.5"
                    aria-label="Fechar notificação"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
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
              <div className="h-1 bg-red-600 animate-pulse"></div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Seção de cada loja com seus itens e resumo */}
          {Object.entries(groupedItems).map(([storeId, { store, items }]) => {
            const storeSubtotal = items.reduce(
              (sum, item) => sum + item.product.price * item.quantity,
              0,
            );
            const storeDeliveryFee = calculateDeliveryFee(
              storeSubtotal,
              store,
              deliveryType === "pickup",
            );
            const storeTotal = calculateStoreTotal(items, storeDeliveryFee);

            return (
              <div key={storeId} className="border rounded-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Coluna de itens */}
                  <div className="lg:col-span-2">
                    <Link href={`/lojas/${store.slug}`}>
                      <h2 className="text-xl font-semibold mb-4 text-blue-600 hover:text-blue-800">
                        {store.name}
                      </h2>
                    </Link>

                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="border-b pb-4">
                          <div className="mb-3">
                            <Link href={`/products/${item.product.id}`}>
                              <p className="font-semibold text-blue-600 hover:text-blue-800">
                                {item.product.name}
                              </p>
                            </Link>
                            <p className="text-gray-600 text-sm mb-2">
                              {formatPrice(item.product.price)} cada
                            </p>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={updating}
                                className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={
                                  editingQuantity?.itemId === item.id
                                    ? editingQuantity.value
                                    : item.quantity
                                }
                                onChange={(e) =>
                                  setEditingQuantity({
                                    itemId: item.id,
                                    value: parseInt(e.target.value),
                                  })
                                }
                                onBlur={() => {
                                  if (editingQuantity?.itemId === item.id) {
                                    updateQuantity(
                                      item.id,
                                      editingQuantity.value,
                                    );
                                  }
                                }}
                                className="w-12 text-center border rounded py-1"
                              />
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={updating}
                                className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center justify-between md:w-auto">
                              <span className="md:hidden text-sm text-gray-600 mr-2">
                                Subtotal:
                              </span>
                              <p className="font-semibold min-w-fit">
                                {formatPrice(
                                  item.product.price * item.quantity,
                                )}
                              </p>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              disabled={updating}
                              className="w-full md:w-auto px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm md:text-base"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resumo da loja */}
                <div className="lg:col-span-1">
                  <div className="space-y-6">
                    <div>
                      {/* Aviso de frete grátis */}
                      {store.freeShippingThreshold &&
                        storeSubtotal < store.freeShippingThreshold && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800">
                              Frete grátis a partir de{" "}
                              <span className="font-semibold">
                                {formatPrice(store.freeShippingThreshold)}
                              </span>
                              . Faltam{" "}
                              <span className="font-semibold">
                                {formatPrice(
                                  store.freeShippingThreshold - storeSubtotal,
                                )}
                              </span>
                            </p>
                          </div>
                        )}

                      <div className="space-y-3 pb-4 border-b">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatPrice(storeSubtotal)}</span>
                        </div>
                        {deliveryType === "delivery" ? (
                          <div className="flex justify-between text-sm">
                            <span>Taxa de entrega:</span>
                            <span>
                              {storeDeliveryFee > 0 ? (
                                formatPrice(storeDeliveryFee)
                              ) : store.freeShippingThreshold &&
                                storeSubtotal >= store.freeShippingThreshold ? (
                                <span className="text-green-600 font-semibold">
                                  Grátis!
                                </span>
                              ) : (
                                formatPrice(0)
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span>Retirada na loja:</span>
                            <span className="text-green-600 font-semibold">
                              Sem taxa
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold pt-2">
                          <span>Total:</span>
                          <span>{formatPrice(storeTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informações de Entrega e Pagamento */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Tipo de Entrega
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`deliveryType-${storeId}`}
                              value="delivery"
                              checked={deliveryType === "delivery"}
                              onChange={(e) => setDeliveryType(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm">Entrega</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`deliveryType-${storeId}`}
                              value="pickup"
                              checked={deliveryType === "pickup"}
                              onChange={(e) => setDeliveryType(e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm">Retirar na Loja</span>
                          </label>
                        </div>
                      </div>

                      {/* Informações da loja para retirada */}
                      {deliveryType === "pickup" && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded space-y-3">
                          <h4 className="font-semibold text-sm text-blue-900">
                            Informações para Retirada
                          </h4>
                          {store.address && (
                            <div className="flex items-start">
                              <svg
                                className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0"
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
                              <div>
                                <p className="text-sm text-blue-900">
                                  {store.address}
                                  {store.number && ` nº ${store.number}`}
                                  {store.complement && ` - ${store.complement}`}
                                </p>
                                {store.city && (
                                  <p className="text-xs text-blue-800">
                                    {store.city}
                                    {store.state && `, ${store.state}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {store.phone && (
                            <div className="flex items-start">
                              <svg
                                className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.048 1.029a1 1 0 001.047-1.6l-2.048-1.029a1 1 0 00-.756-.502L9.474 3.32a1 1 0 00-.684-.948H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-3.28a1 1 0 00-.948.684l-1.498-4.493a1 1 0 00-.502-.756L7.952 2.32a1 1 0 00-1.047 1.6l2.048 1.029a1 1 0 00.756.502l1.498 4.493a1 1 0 00.684.948H19a2 2 0 002 2H5a2 2 0 002-2V5z"
                                />
                              </svg>
                              <p className="text-sm text-blue-900">
                                {store.phone}
                              </p>
                            </div>
                          )}
                          {store.latitude && store.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                              </svg>
                              Ver no mapa
                            </a>
                          )}
                        </div>
                      )}

                      {deliveryType === "delivery" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold">
                              Endereço de Entrega
                            </label>
                            <Link
                              href="/painel/addresses"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
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
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              Cadastrar endereço
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            📍 Estão listados apenas endereços em{" "}
                            <strong>
                              {store.city}/{stateCodeToUF[store.state]}
                            </strong>
                            , cidade onde esta loja entrega.
                          </p>
                          {getValidAddressesForStore(store, userAddresses)
                            .length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                              <p className="font-semibold mb-2">
                                ⚠️ Nenhum endereço válido
                              </p>
                              <p>
                                Você não possui endereços cadastrados em{" "}
                                <strong>{store.city}</strong>, cidade onde esta
                                loja entrega.
                              </p>
                              <p className="mt-2 text-xs">
                                Por favor, cadastre um endereço em {store.city}{" "}
                                para continuar a compra.
                              </p>
                            </div>
                          ) : (
                            <select
                              value={selectedAddress?.id || ""}
                              onChange={(e) => {
                                const address = userAddresses.find(
                                  (a) => a.id === e.target.value,
                                );
                                setSelectedAddress(address);
                              }}
                              className="w-full border rounded px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um endereço</option>
                              {getValidAddressesForStore(
                                store,
                                userAddresses,
                              ).map((address) => (
                                <option key={address.id} value={address.id}>
                                  {address.street}, {address.number} -{" "}
                                  {address.city}/{stateCodeToUF[address.state]}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Forma de Pagamento
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full border rounded px-3 py-2 text-sm"
                        >
                          <option value="pix">PIX</option>
                          <option value="credit">Cartão de Crédito</option>
                          <option value="debit">Cartão de Débito</option>
                          <option value="cash">Dinheiro</option>
                        </select>
                      </div>

                      {paymentMethod === "cash" && (
                        <div>
                          <label className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={needsChange}
                              onChange={(e) => setNeedsChange(e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm font-semibold">
                              Precisa de troco para quanto?
                            </span>
                          </label>
                          {needsChange && (
                            <div className="space-y-2">
                              <input
                                type="number"
                                placeholder={`Valor a pagar (mínimo: ${formatPrice(storeTotal + 0.01)})`}
                                value={changeAmount}
                                onChange={(e) =>
                                  setChangeAmount(e.target.value)
                                }
                                className="w-full border rounded px-3 py-2 text-sm"
                              />
                              {changeAmount && (
                                <div>
                                  {parseFloat(changeAmount) > storeTotal ? (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                                      <p className="text-sm text-green-800">
                                        <span className="font-medium">
                                          Valor a pagar:
                                        </span>{" "}
                                        {formatPrice(parseFloat(changeAmount))}
                                      </p>
                                      <p className="text-sm text-green-600 mt-1">
                                        <span className="font-medium">
                                          Troco:
                                        </span>{" "}
                                        <span className="text-green-700 font-bold">
                                          {formatPrice(
                                            parseFloat(changeAmount) -
                                              storeTotal,
                                          )}
                                        </span>
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded">
                                      ⚠️ O valor deve ser maior que{" "}
                                      {formatPrice(storeTotal)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleCreateOrder(storeId)}
                        disabled={creatingOrder || !session?.user}
                        className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 mt-4"
                      >
                        {creatingOrder ? "Processando..." : "Finalizar Compra"}
                      </button>

                      {!session?.user && (
                        <Link
                          href="/login"
                          className="block text-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Faça login para finalizar a compra
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
