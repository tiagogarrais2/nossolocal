"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IMaskInput } from "react-imask";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    cpf: "",
    whatsapp: "",
    whatsappCountryCode: "55", // Padrão Brasil
    whatsappConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    isPrimary: false,
  });
  const [states, setStates] = useState({});
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [zipCodeLoading, setZipCodeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Mapeamento de UF para código de estado
  const ufToStateCode = {
    RO: "11",
    AC: "12",
    AM: "13",
    RR: "14",
    PA: "15",
    AP: "16",
    TO: "17",
    MA: "21",
    PI: "22",
    CE: "23",
    RN: "24",
    PB: "25",
    PE: "26",
    AL: "27",
    SE: "28",
    BA: "29",
    MG: "31",
    ES: "32",
    RJ: "33",
    SP: "35",
    PR: "41",
    SC: "42",
    RS: "43",
    MS: "50",
    MT: "51",
    GO: "52",
    DF: "53",
  };

  // Mapeamento reverso: código de estado para UF
  const stateCodeToUf = Object.fromEntries(
    Object.entries(ufToStateCode).map(([uf, code]) => [code, uf])
  );

  // Buscar lista de países
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/countries");
        if (res.ok) {
          const data = await res.json();
          setCountries(data.countries);
        }
      } catch (error) {
        console.error("Erro ao buscar países:", error);
      }
    };
    fetchCountries();
  }, []);

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

  // Buscar endereços
  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAddresses();
    }
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");

    // Buscar dados do perfil via API
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            fullName: data.user.fullName || "",
            birthDate: data.user.birthDate || "",
            cpf: data.user.cpf || "",
            whatsapp: data.user.whatsapp || "",
            whatsappCountryCode: data.user.whatsappCountryCode || "55",
            whatsappConsent: data.user.whatsappConsent || false,
          });
        } else {
          // Se não conseguir buscar, usar dados da sessão como fallback
          setFormData({
            fullName: "",
            birthDate: session.user.birthDate
              ? new Date(session.user.birthDate).toISOString().split("T")[0]
              : "",
            cpf: session.user.cpf || "",
            whatsapp: session.user.whatsapp || "",
            whatsappCountryCode: session.user.whatsappCountryCode || "55",
            whatsappConsent: session.user.whatsappConsent || false,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        // Fallback para dados da sessão
        setFormData({
          fullName: "",
          birthDate: session.user.birthDate
            ? new Date(session.user.birthDate).toISOString().split("T")[0]
            : "",
          cpf: session.user.cpf || "",
          whatsapp: session.user.whatsapp || "",
          whatsappConsent: session.user.whatsappConsent || false,
        });
      }
    };

    fetchProfile();
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]); // Limpar erros anteriores

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      setSuccessMessage("Perfil salvo com sucesso!");
    } else {
      try {
        const errorData = await res.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setErrors(errorData.errors);
        } else {
          setErrors(["Erro ao salvar perfil. Tente novamente."]);
        }
      } catch {
        setErrors(["Erro ao salvar perfil. Tente novamente."]);
      }
    }
    setLoading(false);
  };

  // Filtrar cidades baseado no estado selecionado
  useEffect(() => {
    if (addressFormData.state) {
      const stateCities = cities.filter(
        (city) => city.state_id.toString() === addressFormData.state
      );
      setFilteredCities(stateCities);
    } else {
      setFilteredCities([]);
    }
  }, [addressFormData.state, cities]);

  // Funções para gerenciar endereços
  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    const url = editingAddress ? "/api/addresses" : "/api/addresses";
    const method = editingAddress ? "PUT" : "POST";
    const data = editingAddress
      ? { ...addressFormData, id: editingAddress.id }
      : addressFormData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchAddresses();
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressFormData({
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
          isPrimary: false,
        });
      } else {
        alert("Erro ao salvar endereço");
      }
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressFormData({
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isPrimary: address.isPrimary,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Tem certeza de que deseja remover este endereço?")) {
      return;
    }

    try {
      const res = await fetch(`/api/addresses?id=${addressId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchAddresses();
      } else {
        alert("Erro ao remover endereço");
      }
    } catch (error) {
      console.error("Erro ao remover endereço:", error);
      alert("Erro ao remover endereço");
    }
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressFormData({
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      isPrimary: false,
    });
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Tem certeza que deseja remover sua conta? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Conta removida com sucesso!");
        await signOut({ callbackUrl: "/" });
      } else {
        alert("Erro ao remover conta. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao remover conta:", error);
      alert("Erro ao remover conta. Tente novamente.");
    }
    setLoading(false);
  };

  const handleZipCodeChange = async (value) => {
    // Atualizar o valor do CEP
    setAddressFormData({ ...addressFormData, zipCode: value });

    // Remover caracteres não numéricos
    const cleanZipCode = value.replace(/\D/g, "");

    // Se o CEP tiver 8 dígitos, buscar dados do ViaCEP
    if (cleanZipCode.length === 8) {
      setZipCodeLoading(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanZipCode}/json/`
        );
        const data = await response.json();

        if (!data.erro) {
          // Mapear UF para código de estado
          const stateCode = ufToStateCode[data.uf];

          // Encontrar a cidade na lista
          const cityData = cities.find(
            (city) =>
              city.name.toLowerCase() === data.localidade.toLowerCase() &&
              city.state_id.toString() === stateCode
          );

          // Preencher os campos automaticamente
          setAddressFormData((prev) => ({
            ...prev,
            zipCode: value,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: cityData ? cityData.name : data.localidade || prev.city,
            state: stateCode || prev.state,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setZipCodeLoading(false);
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
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
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Início
              </Link>
              <Link href="#profile" className="text-blue-600 font-semibold">
                Perfil
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Meu Painel
            </h1>
            <p className="text-gray-600">
              Gerencie suas informações pessoais e configurações
            </p>
          </div>

          {/* Email (Read-only) */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={session?.user?.email || ""}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">
              Este e-mail foi validado durante o login e não pode ser alterado.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("personal")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "personal"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dados Pessoais
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "addresses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Endereços
              </button>
              <button
                onClick={() => setActiveTab("stores")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "stores"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Lojas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && (
            <div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite seu nome completo"
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF *
              </label>
              <IMaskInput
                mask="000.000.000-00"
                value={formData.cpf}
                onAccept={(value) => setFormData({ ...formData, cpf: value })}
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp (opcional)
              </label>
              <div className="flex gap-3">
                <select
                  value={formData.whatsappCountryCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappCountryCode: e.target.value,
                    })
                  }
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {countries.map((country, index) => (
                    <option key={index} value={country.ddi}>
                      +{country.ddi} {country.pais}
                    </option>
                  ))}
                </select>
                <IMaskInput
                  mask={
                    formData.whatsappCountryCode === "55"
                      ? "(00) 00000-0000"
                      : "000000000000000"
                  }
                  value={formData.whatsapp}
                  onAccept={(value) =>
                    setFormData({ ...formData, whatsapp: value })
                  }
                  placeholder={
                    formData.whatsappCountryCode === "55"
                      ? "(11) 99999-9999"
                      : "Número do telefone"
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Consentimento WhatsApp */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="whatsapp-consent"
                  type="checkbox"
                  checked={formData.whatsappConsent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappConsent: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="whatsapp-consent"
                  className="text-sm text-gray-700"
                >
                  Concordo em receber comunicações via WhatsApp
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Você pode cancelar a qualquer momento nas configurações.
                </p>
              </div>
            </div>

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
                    <div className="mt-4">
                      <Link
                        href="/"
                        className="text-sm font-medium text-green-800 hover:text-green-600"
                      >
                        Retornar para a página inicial →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Salvando..." : "Salvar Perfil"}
              </button>
            </div>
          </form>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Meus Endereços
                  </h2>
                  <p className="text-gray-600">
                    Gerencie seus endereços de entrega
                  </p>
                </div>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  + Novo Endereço
                </button>
              </div>

          {/* Lista de Endereços */}
          <div className="space-y-4 mb-8">
            {addresses.length === 0 ? (
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum endereço cadastrado
                </h3>
                <p className="text-gray-500">
                  Adicione seu primeiro endereço para facilitar suas compras.
                </p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {address.isPrimary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                          Endereço Principal
                        </span>
                      )}
                      <p className="text-lg font-semibold text-gray-900">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-gray-600">
                        {address.neighborhood}, {address.city} -{" "}
                        {stateCodeToUf[address.state] || address.state}
                      </p>
                      <p className="text-gray-600">CEP: {address.zipCode}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="text-blue-600 hover:text-blue-800 p-2"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-800 p-2"
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
                </div>
              ))
            )}
          </div>

          {/* Formulário de Endereço */}
          {showAddressForm && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editingAddress ? "Editar Endereço" : "Novo Endereço"}
              </h3>
              <form onSubmit={handleAddressSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* CEP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP *
                    </label>
                    <div className="relative">
                      <IMaskInput
                        mask="00000-000"
                        value={addressFormData.zipCode}
                        onAccept={handleZipCodeChange}
                        placeholder="12345-678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      {zipCodeLoading && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rua */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rua *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.street}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          street: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da rua"
                    />
                  </div>

                  {/* Número */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.number}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          number: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>

                  {/* Complemento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={addressFormData.complement}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          complement: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Apto 123, Bloco B"
                    />
                  </div>

                  {/* Bairro */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.neighborhood}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          neighborhood: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Centro"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      value={addressFormData.state}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          state: e.target.value,
                          city: "", // Limpar cidade quando estado muda
                        })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione o estado</option>
                      {Object.entries(states).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <select
                      value={addressFormData.city}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          city: e.target.value,
                        })
                      }
                      required
                      disabled={!addressFormData.state}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {addressFormData.state
                          ? "Selecione a cidade"
                          : "Selecione o estado primeiro"}
                      </option>
                      {filteredCities.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Endereço Principal */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is-primary"
                      type="checkbox"
                      checked={addressFormData.isPrimary}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          isPrimary: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="is-primary"
                      className="text-sm text-gray-700"
                    >
                      Definir como endereço principal
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Este será o endereço padrão para suas entregas.
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    {editingAddress ? "Atualizar Endereço" : "Salvar Endereço"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAddressForm}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          )}

          {/* Stores Tab */}
          {activeTab === "stores" && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Minhas Lojas
                </h2>
                <p className="text-gray-600">
                  Gerencie suas lojas e estabelecimentos
                </p>
              </div>
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma loja cadastrada
                </h3>
                <p className="text-gray-500 mb-6">
                  Você ainda não possui lojas cadastradas. Crie sua primeira loja para começar a vender.
                </p>
                <Link
                  href="/store"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-block"
                >
                  Cadastrar Loja
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Zona de Perigo */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Zona de Perigo
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Esta ação não pode ser desfeita. Todos os seus dados serão
              permanentemente removidos.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Removendo..." : "Remover Conta"}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Nosso Local</h4>
              <p className="text-gray-400">
                Conectando você aos melhores produtos das melhores lojas.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Links Úteis</h5>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/" className="hover:text-white">
                    Página Inicial
                  </a>
                </li>
                <li>
                  <a href="#sobre" className="hover:text-white">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#suporte" className="hover:text-white">
                    Suporte
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Conta</h5>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#profile" className="hover:text-white">
                    Meu Perfil
                  </a>
                </li>
                <li>
                  <a href="#pedidos" className="hover:text-white">
                    Meus Pedidos
                  </a>
                </li>
                <li>
                  <a href="#favoritos" className="hover:text-white">
                    Favoritos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Contato</h5>
              <ul className="space-y-2 text-gray-400">
                <li>📧 contato@tiagodelivery.com</li>
                <li>📞 (11) 9999-9999</li>
                <li>📍 São Paulo, SP</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Nosso Local. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
