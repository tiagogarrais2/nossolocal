"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { formatPrice, getStateDisplay } from "../../lib/utils";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({
    emailOnNewUser: false,
    emailOnNewStore: false,
  });
  const [savingSettings, setSavingSettings] = useState({});
  const [testEmail, setTestEmail] = useState({
    to: "",
    subject: "Teste de E-mail - Sistema de Delivery",
    message: "Este é um e-mail de teste enviado do painel de administração.",
  });
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchAdminData();
      fetchSettings();
    }
  }, [status, router]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin");

      if (response.status === 403) {
        setError("Acesso negado. Você não é administrador do sistema.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar dados de administração");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");

      if (response.ok) {
        const result = await response.json();
        setSettings(result.settings || {});
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    }
  };

  const handleSettingChange = async (key, value) => {
    setSavingSettings((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      } else {
        console.error("Erro ao salvar configuração");
        // Reverter o valor em caso de erro
        setSettings((prev) => ({ ...prev, [key]: !value }));
      }
    } catch (err) {
      console.error("Erro ao salvar configuração:", err);
      // Reverter o valor em caso de erro
      setSettings((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSavingSettings((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.to || !testEmail.message) {
      setTestEmailResult({
        success: false,
        message: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testEmail),
      });

      const result = await response.json();

      if (response.ok) {
        setTestEmailResult({ success: true, message: result.message });
        // Limpar o campo de destinatário após sucesso
        setTestEmail((prev) => ({ ...prev, to: "" }));
      } else {
        setTestEmailResult({
          success: false,
          message: result.error || "Erro ao enviar e-mail.",
        });
      }
    } catch (err) {
      console.error("Erro ao enviar e-mail de teste:", err);
      setTestEmailResult({
        success: false,
        message: "Erro interno do servidor.",
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      delivering: "Entregando",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      delivering: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="text-red-500 text-6xl mb-4">⛔</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Acesso Restrito
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Voltar para Início
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Painel de Administração
            </h1>
            <p className="text-gray-600">
              Bem-vindo, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/sales-logs")}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-md"
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
                strokeWidth="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Ver Logs de Vendas</span>
          </button>
        </div>

        {/* Seção de Configurações */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Configurações de Notificações
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure quando os administradores devem receber notificações por
              e-mail
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Toggle para novo usuário */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">
                  Novo Usuário Cadastrado
                </h3>
                <p className="text-sm text-gray-500">
                  Enviar e-mail para administradores quando um novo usuário se
                  cadastrar no sistema
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    "emailOnNewUser",
                    !settings.emailOnNewUser,
                  )
                }
                disabled={savingSettings.emailOnNewUser}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.emailOnNewUser ? "bg-blue-600" : "bg-gray-200"
                } ${
                  savingSettings.emailOnNewUser ? "opacity-50 cursor-wait" : ""
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailOnNewUser ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200"></div>

            {/* Toggle para nova loja */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">
                  Nova Loja Cadastrada
                </h3>
                <p className="text-sm text-gray-500">
                  Enviar e-mail para administradores quando uma nova loja for
                  cadastrada no sistema
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    "emailOnNewStore",
                    !settings.emailOnNewStore,
                  )
                }
                disabled={savingSettings.emailOnNewStore}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.emailOnNewStore ? "bg-blue-600" : "bg-gray-200"
                } ${
                  savingSettings.emailOnNewStore ? "opacity-50 cursor-wait" : ""
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailOnNewStore ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Teste de E-mail */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Teste de Envio de E-mail
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Envie um e-mail de teste para verificar se a configuração está
              funcionando
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinatário *
              </label>
              <input
                type="email"
                value={testEmail.to}
                onChange={(e) =>
                  setTestEmail((prev) => ({ ...prev, to: e.target.value }))
                }
                placeholder="exemplo@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingTestEmail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assunto
              </label>
              <input
                type="text"
                value={testEmail.subject}
                onChange={(e) =>
                  setTestEmail((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Assunto do e-mail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingTestEmail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem *
              </label>
              <textarea
                value={testEmail.message}
                onChange={(e) =>
                  setTestEmail((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Digite a mensagem do e-mail de teste"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingTestEmail}
              />
            </div>

            {testEmailResult && (
              <div
                className={`p-4 rounded-md ${testEmailResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {testEmailResult.success ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${testEmailResult.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {testEmailResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
                className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                  sendingTestEmail ? "opacity-50 cursor-wait" : ""
                }`}
              >
                {sendingTestEmail ? (
                  <svg
                    className="animate-spin h-4 w-4"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    ></path>
                  </svg>
                )}
                <span>
                  {sendingTestEmail ? "Enviando..." : "Enviar E-mail de Teste"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Usuários */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data?.stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Total de Lojas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de Lojas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data?.stats?.totalStores || 0}
                </p>
                <p className="text-xs text-gray-400">
                  {data?.stats?.openStores || 0} abertas /{" "}
                  {data?.stats?.closedStores || 0} fechadas
                </p>
              </div>
            </div>
          </div>

          {/* Total de Produtos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data?.stats?.totalProducts || 0}
                </p>
                <p className="text-xs text-gray-400">
                  {data?.stats?.availableProducts || 0} disponíveis
                </p>
              </div>
            </div>
          </div>

          {/* Total de Pedidos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data?.stats?.totalOrders || 0}
                </p>
                <p className="text-xs text-gray-400">
                  {data?.stats?.ordersByStatus?.pending || 0} pendentes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Receita Total */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Receita Total</p>
              <p className="text-4xl font-bold">
                {formatPrice(data?.stats?.totalRevenue || 0)}
              </p>
              <p className="text-green-100 text-sm mt-1">
                Baseado em pedidos não cancelados
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Grid de Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pedidos Recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Pedidos Recentes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Loja
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.recentOrders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {order.storeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.customerName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentOrders || data.recentOrders.length === 0) && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhum pedido encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lojas Recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Lojas Recentes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.recentStores?.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {store.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {store.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {store.city}/{getStateDisplay(store.state)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            store.isOpen
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {store.isOpen ? "Aberta" : "Fechada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentStores || data.recentStores.length === 0) && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhuma loja encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usuários Recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Usuários Recentes
              </h2>
              <Link
                href="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todos →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cadastro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.recentUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentUsers || data.recentUsers.length === 0) && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo de Pedidos por Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Pedidos por Status
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    Pendentes
                  </span>
                  <span className="font-semibold">
                    {data?.stats?.ordersByStatus?.pending || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    Concluídos
                  </span>
                  <span className="font-semibold">
                    {data?.stats?.ordersByStatus?.completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                    Cancelados
                  </span>
                  <span className="font-semibold">
                    {data?.stats?.ordersByStatus?.cancelled || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                    Outros
                  </span>
                  <span className="font-semibold">
                    {data?.stats?.ordersByStatus?.other || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
