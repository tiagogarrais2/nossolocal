"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { formatPrice } from "../../../lib/utils";

export default function SalesLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
  });
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    storeId: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchLogs();
    }
  }, [status, router, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.storeId && { storeId: filters.storeId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/admin/sales-logs?${params}`);

      if (response.status === 403) {
        setError("Acesso negado. Você não é administrador do sistema.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const result = await response.json();
      setLogs(result.logs);
      setPagination(result.pagination);
      setStats(result.stats);
      setStores(result.stores);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar logs de vendas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteLog = async (logId) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta venda e seu log de registro? Esta ação não pode ser desfeita e deletará tanto a venda quanto o histórico.",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/sales-logs?id=${logId}&deleteOrder=true`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar venda e log");
      }

      // Fechar modal e recarregar lista
      setSelectedLog(null);
      await fetchLogs();
      alert("Venda e log deletados com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar venda e log:", err);
      alert(`Erro ao deletar venda e log: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      storeId: "",
      startDate: "",
      endDate: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchLogs(), 100);
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

  const getPaymentMethodLabel = (method) => {
    const labels = {
      pix: "PIX",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
    };
    return labels[method] || method || "Não informado";
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
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Logs de Vendas</h1>
            <p className="text-gray-600">
              Histórico completo de todas as transações
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Voltar ao Dashboard</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total de Vendas</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalSales}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Receita Total</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(stats.totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Ticket Médio</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(stats.averageTicket)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Nome, email, CPF, pedido..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loja
                </label>
                <select
                  value={filters.storeId}
                  onChange={(e) =>
                    handleFilterChange("storeId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas as lojas</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </form>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedido
                  </th>
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
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {log.orderId.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.storeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.customerName || log.customerEmail}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatPrice(log.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getPaymentMethodLabel(log.paymentMethod)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum log de venda encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalCount,
                )}{" "}
                de {pagination.totalCount} resultados
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Detalhes da Venda
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pedido: {selectedLog.orderId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Info Geral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dados do Cliente */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Dados do Cliente
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Nome:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.customerName || "N/A"}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.customerEmail}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Telefone:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.customerPhone || "N/A"}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">CPF:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.customerCpf || "N/A"}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">WhatsApp:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.customerWhatsapp || "N/A"}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">ID:</span>{" "}
                        <span className="font-mono text-xs">
                          {selectedLog.customerId}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Dados da Loja */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
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
                      Dados da Loja
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Nome:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.storeName}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.storeEmail}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Telefone:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.storePhone}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">CNPJ:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.storeCnpj}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Categoria:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.storeCategory}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Endereço:</span>{" "}
                        <span className="font-medium">
                          {selectedLog.storeAddress}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Endereço de Entrega */}
                {selectedLog.deliveryAddress && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Endereço de Entrega
                    </h3>
                    <p className="text-sm">{selectedLog.deliveryAddress}</p>
                  </div>
                )}

                {/* Itens do Pedido */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-600"
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
                    Itens do Pedido
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      let items = selectedLog.items || [];
                      // Se items for string JSON, fazer parse
                      if (typeof items === "string") {
                        try {
                          items = JSON.parse(items);
                        } catch (e) {
                          console.error("Erro ao fazer parse dos items:", e);
                          items = [];
                        }
                      }
                      return Array.isArray(items) ? items : [];
                    })().map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm bg-white p-2 rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {item.productName || "Produto não especificado"}
                          </span>
                          <span className="text-gray-500 ml-2">
                            x{item.quantity}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Valores */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
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
                    Valores
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Subtotal</p>
                      <p className="font-semibold">
                        {formatPrice(selectedLog.subtotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Taxa de Entrega</p>
                      <p className="font-semibold">
                        {formatPrice(selectedLog.deliveryFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold text-lg text-green-600">
                        {formatPrice(selectedLog.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pagamento</p>
                      <p className="font-semibold">
                        {getPaymentMethodLabel(selectedLog.paymentMethod)}
                      </p>
                      {selectedLog.needsChange && (
                        <p className="text-xs text-gray-500">
                          Troco para: {formatPrice(selectedLog.changeAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadados */}
                <div className="text-xs text-gray-400 border-t pt-4">
                  <p>
                    <strong>Data do Registro:</strong>{" "}
                    {formatDate(selectedLog.createdAt)}
                  </p>
                  <p>
                    <strong>ID do Log:</strong> {selectedLog.id}
                  </p>
                  <p>
                    <strong>Status no momento:</strong>{" "}
                    {selectedLog.orderStatus}
                  </p>
                </div>

                {/* Botão de Exclusão */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => handleDeleteLog(selectedLog.id)}
                    disabled={deleting}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                  >
                    {deleting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
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
                        <span>Excluindo...</span>
                      </>
                    ) : (
                      <>
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Excluir Venda e Log</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    ⚠️ Atenção: Esta ação é permanente, vai deletar a venda e o
                    log, e não pode ser desfeita
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
