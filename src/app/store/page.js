"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import StoreForm from "../../components/StoreForm";
import { IMaskInput } from "react-imask";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function StorePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");
  const [states, setStates] = useState({});
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [pixKeys, setPixKeys] = useState([]);
  const [showPixForm, setShowPixForm] = useState(false);
  const [canSelectOwner, setCanSelectOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pixFormData, setPixFormData] = useState({
    type: "cpf",
    key: "",
    isPrimary: false,
  });
  const [editingPixKey, setEditingPixKey] = useState(null);
  const [pixKeyError, setPixKeyError] = useState("");
  const [activeTab, setActiveTab] = useState("cadastro");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  // Verificar se usuário pode selecionar proprietário (gerente/admin)
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch("/api/users/permissions");
        if (response.ok) {
          const data = await response.json();
          setCanSelectOwner(data.canCreateStoresForOthers || false);
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      }
    };

    if (session) {
      checkPermissions();
    }
  }, [session]);

  // Buscar dados de estados e cidades
  useEffect(() => {
    const fetchStatesAndCities = async () => {
      try {
        const res = await fetch("/estados-cidades2.json");
        if (res.ok) {
          const data = await res.json();
          setStates(data.states);
          setCities(data.cities);
        }
      } catch (error) {
        console.error("Erro ao buscar estados e cidades:", error);
      }
    };
    fetchStatesAndCities();
  }, []);
  // Buscar dados da loja se houver ID
  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;

      setLoadingStore(true);
      try {
        const response = await fetch("/api/stores");
        if (response.ok) {
          const data = await response.json();
          const store = data.stores?.find((s) => s.id === storeId);
          console.log("Store data from API:", store);
          console.log("Store image field:", store?.image);

          if (store) {
            setInitialData({
              name: store.name,
              slug: store.slug,
              description: store.description || "",
              image: store.image || "",
              category: store.category,
              cnpj: store.cnpj,
              phone: store.phone,
              email: store.email,
              minimumOrder: store.minimumOrder || "",
              deliveryFee: store.deliveryFee || "",
              freeShippingThreshold: store.freeShippingThreshold || "",
              neighborhoodDeliveryFees: store.neighborhoodDeliveryFees || {},
              userId: store.userId,
              owner: store.owner, // Dados do proprietário
              address: {
                zipCode: store.zipCode,
                street: store.street,
                number: store.number,
                complement: store.complement || "",
                neighborhood: store.neighborhood,
                city: store.city,
                state: store.state,
                latitude: store.latitude,
                longitude: store.longitude,
              },
            });
          } else {
            setErrors(["Loja não encontrada"]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
        setErrors(["Erro ao carregar dados da loja"]);
      } finally {
        setLoadingStore(false);
      }
    };

    if (session) {
      fetchStore();
    }
  }, [storeId]);

  // Funções de validação
  const validateCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const validateCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(cnpj.charAt(12))) return false;

    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(cnpj.charAt(13))) return false;

    return true;
  };

  const validatePhone = (phone) => {
    phone = phone.replace(/\D/g, "");
    if (phone.length !== 10 && phone.length !== 11) return false;
    if (/^(\d)\1+$/.test(phone)) return false;

    const ddd = parseInt(phone.substring(0, 2));
    if (ddd < 11 || ddd > 99) return false;

    if (phone.length === 11 && phone.charAt(2) !== "9") return false;

    return true;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRandomKey = (key) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(key);
  };

  const validatePixKey = (type, key) => {
    if (!key || key.trim() === "") {
      return "Chave PIX é obrigatória";
    }

    switch (type) {
      case "cpf":
        if (!validateCPF(key)) {
          return "CPF inválido";
        }
        break;
      case "cnpj":
        if (!validateCNPJ(key)) {
          return "CNPJ inválido";
        }
        break;
      case "phone":
        if (!validatePhone(key)) {
          return "Telefone inválido. Use formato com DDD: (11) 99999-9999";
        }
        break;
      case "email":
        if (!validateEmail(key)) {
          return "E-mail inválido";
        }
        break;
      case "random":
        if (!validateRandomKey(key)) {
          return "Chave aleatória inválida. Deve ser um UUID";
        }
        break;
    }

    return "";
  };

  // Buscar chaves PIX se estiver editando
  useEffect(() => {
    const fetchPixKeys = async () => {
      if (!storeId) return;

      try {
        const response = await fetch(`/api/pix-keys?storeId=${storeId}`);
        if (response.ok) {
          const data = await response.json();
          setPixKeys(data.pixKeys || []);
        }
      } catch (error) {
        console.error("Erro ao buscar chaves PIX:", error);
      }
    };

    if (session && storeId) {
      fetchPixKeys();
    }
  }, [storeId]);

  const handleStoreSubmit = async (formData) => {
    setLoading(true);
    setErrors([]);

    try {
      const url = storeId ? `/api/stores/${storeId}` : "/api/stores";
      const method = storeId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage(
          storeId
            ? "Loja atualizada com sucesso!"
            : "Loja cadastrada com sucesso!",
        );
        setTimeout(() => {
          router.push("/painel?tab=stores");
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || ["Erro ao salvar loja"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/painel?tab=stores");
  };

  const handleAddPixKey = async () => {
    if (!storeId) {
      setErrors(["Salve a loja primeiro antes de adicionar chaves PIX"]);
      return;
    }

    setLoading(true);
    setErrors([]);
    setPixKeyError("");

    try {
      // Limpar a chave removendo caracteres especiais (apenas para CPF, CNPJ e telefone)
      const cleanKey = ["cpf", "cnpj", "phone"].includes(pixFormData.type)
        ? pixFormData.key.replace(/\D/g, "")
        : pixFormData.key;

      // Validar antes de submeter
      const error = validatePixKey(pixFormData.type, cleanKey);
      if (error) {
        setPixKeyError(error);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/pix-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          type: pixFormData.type,
          key: cleanKey,
          isPrimary: pixFormData.isPrimary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Se a nova chave é principal, desmarcar as outras
        const updatedKeys = data.pixKey.isPrimary
          ? pixKeys.map((pk) => ({ ...pk, isPrimary: false }))
          : pixKeys;
        setPixKeys([...updatedKeys, data.pixKey]);
        setShowPixForm(false);
        setPixFormData({ type: "cpf", key: "", isPrimary: false });
        setSuccessMessage("Chave PIX adicionada com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao adicionar chave PIX"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePixKey = async (id) => {
    setLoading(true);
    setErrors([]);
    setPixKeyError("");

    // Limpar a chave removendo caracteres especiais (apenas para CPF, CNPJ e telefone)
    const cleanKey = ["cpf", "cnpj", "phone"].includes(pixFormData.type)
      ? pixFormData.key.replace(/\D/g, "")
      : pixFormData.key;

    // Validar antes de submeter
    const error = validatePixKey(pixFormData.type, cleanKey);
    if (error) {
      setPixKeyError(error);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/pix-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: pixFormData.type,
          key: cleanKey,
          isPrimary: pixFormData.isPrimary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Se a chave atualizada é principal, desmarcar as outras
        const updatedKeys = data.pixKey.isPrimary
          ? pixKeys.map((pk) =>
              pk.id === id ? data.pixKey : { ...pk, isPrimary: false },
            )
          : pixKeys.map((pk) => (pk.id === id ? data.pixKey : pk));
        setPixKeys(updatedKeys);
        setShowPixForm(false);
        setEditingPixKey(null);
        setPixFormData({ type: "cpf", key: "", isPrimary: false });
        setSuccessMessage("Chave PIX atualizada com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao atualizar chave PIX"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePixKey = async (id) => {
    if (!confirm("Tem certeza que deseja remover esta chave PIX?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/pix-keys/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPixKeys(pixKeys.filter((pk) => pk.id !== id));
        setSuccessMessage("Chave PIX removida com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao remover chave PIX"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryPixKey = async (id) => {
    setLoading(true);

    try {
      const pixKey = pixKeys.find((pk) => pk.id === id);
      const response = await fetch(`/api/pix-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pixKey, isPrimary: true }),
      });

      if (response.ok) {
        // Atualizar a lista de chaves
        const updatedKeys = pixKeys.map((pk) => ({
          ...pk,
          isPrimary: pk.id === id,
        }));
        setPixKeys(updatedKeys);
        setSuccessMessage("Chave PIX principal atualizada!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao definir chave principal"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta loja? Todos os produtos e chaves PIX associados também serão excluídos. Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Loja excluída com sucesso!");
        setTimeout(() => {
          router.push("/painel?tab=stores");
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || "Erro ao excluir loja"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {storeId ? "Editar Loja" : "Cadastrar Nova Loja"}
            </h1>
            <p className="text-gray-600">
              {storeId
                ? "Atualize as informações da sua loja"
                : "Preencha as informações da sua loja para começar a vender"}
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Por favor, corrija os seguintes erros:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
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
                  <p className="text-sm text-green-700 mt-1">
                    Redirecionando para seu painel...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs - apenas na edição */}
          {storeId && (
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("cadastro")}
                  className={`${
                    activeTab === "cadastro"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Cadastro
                </button>
                <button
                  onClick={() => setActiveTab("pix")}
                  className={`${
                    activeTab === "pix"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Chaves PIX
                </button>
                <button
                  onClick={() => setActiveTab("exclusao")}
                  className={`${
                    activeTab === "exclusao"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Exclusão
                </button>
              </nav>
            </div>
          )}

          {/* Conteúdo da aba Cadastro */}
          {(!storeId || activeTab === "cadastro") && (
            <>
              {/* Store Form */}
              <StoreForm
                onSubmit={handleStoreSubmit}
                onCancel={handleCancel}
                states={states}
                cities={cities}
                initialData={initialData}
                canSelectOwner={!storeId && canSelectOwner} // Apenas na criação
                currentUserId={session?.user?.id}
                isAdmin={isAdmin} // Permite admin editar proprietário em lojas existentes
                submitButtonText={
                  loading
                    ? storeId
                      ? "Atualizando..."
                      : "Cadastrando..."
                    : storeId
                      ? "Atualizar Loja"
                      : "Cadastrar Loja"
                }
              />
            </>
          )}

          {/* Conteúdo da aba Chave PIX */}
          {storeId && activeTab === "pix" && (
            <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Chaves PIX para Recebimento
              </h2>

              {pixKeys.length > 0 && (
                <div className="mb-6 space-y-4">
                  {pixKeys
                    .sort((a, b) => {
                      const order = {
                        cpf: 1,
                        cnpj: 2,
                        email: 3,
                        phone: 4,
                        random: 5,
                      };
                      return order[a.type] - order[b.type];
                    })
                    .map((pixKey) => {
                      // Formatar CPF, CNPJ ou telefone para exibição
                      let displayKey = pixKey.key;
                      if (pixKey.type === "cpf" && pixKey.key.length === 11) {
                        displayKey = pixKey.key.replace(
                          /(\d{3})(\d{3})(\d{3})(\d{2})/,
                          "$1.$2.$3-$4",
                        );
                      } else if (
                        pixKey.type === "cnpj" &&
                        pixKey.key.length === 14
                      ) {
                        displayKey = pixKey.key.replace(
                          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                          "$1.$2.$3/$4-$5",
                        );
                      } else if (pixKey.type === "phone") {
                        if (pixKey.key.length === 11) {
                          displayKey = pixKey.key.replace(
                            /(\d{2})(\d{5})(\d{4})/,
                            "($1) $2-$3",
                          );
                        } else if (pixKey.key.length === 10) {
                          displayKey = pixKey.key.replace(
                            /(\d{2})(\d{4})(\d{4})/,
                            "($1) $2-$3",
                          );
                        }
                      }

                      return (
                        <div
                          key={pixKey.id}
                          className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700 uppercase">
                                {pixKey.type === "phone"
                                  ? "TELEFONE"
                                  : pixKey.type === "random"
                                    ? "CHAVE ALEATÓRIA"
                                    : pixKey.type}
                              </span>
                              {pixKey.isPrimary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                  Principal
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 mt-1">{displayKey}</p>
                          </div>
                          <div className="flex gap-2">
                            {!pixKey.isPrimary && (
                              <button
                                onClick={() =>
                                  handleSetPrimaryPixKey(pixKey.id)
                                }
                                className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm rounded border border-blue-600 hover:bg-blue-50"
                                title="Definir como principal"
                              >
                                Tornar Principal
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePixKey(pixKey.id)}
                              className="text-red-600 hover:text-red-800 p-2"
                              title="Remover chave PIX"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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
                        </div>
                      );
                    })}
                </div>
              )}

              {showPixForm ? (
                <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingPixKey ? "Editar Chave PIX" : "Nova Chave PIX"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Chave *
                      </label>
                      <select
                        value={pixFormData.type}
                        onChange={(e) => {
                          setPixFormData({
                            ...pixFormData,
                            type: e.target.value,
                            key: "",
                          });
                          setPixKeyError("");
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chave PIX *
                      </label>
                      {pixFormData.type === "cpf" ? (
                        <IMaskInput
                          mask="000.000.000-00"
                          value={pixFormData.key}
                          onAccept={(value) => {
                            setPixFormData({ ...pixFormData, key: value });
                            const cleanValue = value.replace(/\D/g, "");
                            if (cleanValue.length === 11) {
                              const error = validatePixKey("cpf", cleanValue);
                              setPixKeyError(error);
                            } else {
                              setPixKeyError("");
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="000.000.000-00"
                        />
                      ) : pixFormData.type === "cnpj" ? (
                        <IMaskInput
                          mask="00.000.000/0000-00"
                          value={pixFormData.key}
                          onAccept={(value) => {
                            setPixFormData({ ...pixFormData, key: value });
                            const cleanValue = value.replace(/\D/g, "");
                            if (cleanValue.length === 14) {
                              const error = validatePixKey("cnpj", cleanValue);
                              setPixKeyError(error);
                            } else {
                              setPixKeyError("");
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="00.000.000/0000-00"
                        />
                      ) : pixFormData.type === "phone" ? (
                        <IMaskInput
                          mask="(00) 00000-0000"
                          value={pixFormData.key}
                          onAccept={(value) => {
                            setPixFormData({ ...pixFormData, key: value });
                            const cleanValue = value.replace(/\D/g, "");
                            if (cleanValue.length >= 10) {
                              const error = validatePixKey("phone", cleanValue);
                              setPixKeyError(error);
                            } else {
                              setPixKeyError("");
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                        />
                      ) : pixFormData.type === "random" ? (
                        <IMaskInput
                          mask="HHHHHHHH-HHHH-HHHH-HHHH-HHHHHHHHHHHH"
                          definitions={{
                            H: /[0-9a-fA-F]/,
                          }}
                          value={pixFormData.key}
                          onAccept={(value) => {
                            setPixFormData({ ...pixFormData, key: value });
                            // UUID completo tem 36 caracteres (32 hex + 4 traços)
                            if (value.length === 36) {
                              const error = validatePixKey("random", value);
                              setPixKeyError(error);
                            } else {
                              setPixKeyError("");
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="00000000-0000-0000-0000-000000000000"
                        />
                      ) : (
                        <input
                          type="text"
                          value={pixFormData.key}
                          onChange={(e) => {
                            const newKey =
                              pixFormData.type === "email"
                                ? e.target.value.toLowerCase()
                                : e.target.value;
                            setPixFormData({
                              ...pixFormData,
                              key: newKey,
                            });
                            if (newKey) {
                              const error = validatePixKey(
                                pixFormData.type,
                                newKey,
                              );
                              setPixKeyError(error);
                            } else {
                              setPixKeyError("");
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Digite a chave PIX"
                        />
                      )}
                      {pixKeyError && (
                        <p className="mt-2 text-sm text-red-600">
                          {pixKeyError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={pixFormData.isPrimary}
                        onChange={(e) =>
                          setPixFormData({
                            ...pixFormData,
                            isPrimary: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isPrimary"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Definir como chave principal
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingPixKey) {
                            handleUpdatePixKey(editingPixKey);
                          } else {
                            handleAddPixKey();
                          }
                        }}
                        disabled={loading || !pixFormData.key || pixKeyError}
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading
                          ? "Salvando..."
                          : editingPixKey
                            ? "Atualizar Chave"
                            : "Adicionar Chave"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPixForm(false);
                          setEditingPixKey(null);
                          setPixFormData({
                            type: "cpf",
                            key: "",
                            isPrimary: false,
                          });
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPixForm(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  + Nova Chave PIX
                </button>
              )}
            </div>
          )}

          {/* Conteúdo da aba Exclusão */}
          {storeId && activeTab === "exclusao" && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 text-red-600 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Zona de Perigo
                    </h3>
                    <p className="text-sm text-red-800 mb-4">
                      Excluir esta loja é uma ação permanente e não pode ser
                      desfeita. Todos os dados associados serão perdidos:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1 mb-6">
                      <li>Informações cadastrais da loja</li>
                      <li>Todos os produtos cadastrados</li>
                      <li>Todas as chaves PIX configuradas</li>
                      <li>Histórico e estatísticas</li>
                    </ul>
                    <button
                      type="button"
                      onClick={handleDeleteStore}
                      disabled={loading}
                      className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      {loading
                        ? "Excluindo..."
                        : "Excluir Loja Permanentemente"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-lg">Carregando...</p>
        </div>
      }
    >
      <StorePageContent />
    </Suspense>
  );
}
