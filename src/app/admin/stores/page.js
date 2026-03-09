"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getStateDisplay } from "../../../lib/utils";

function StoresContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [zoomImage, setZoomImage] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "createdAt");
  const [order, setOrder] = useState(searchParams.get("order") || "desc");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  const fetchStores = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          sort,
          order,
        });
        if (search) params.set("search", search);

        const response = await fetch(`/api/admin/stores?${params}`);

        if (response.status === 403) {
          setError("Acesso negado. Você não é administrador do sistema.");
          setLoading(false);
          return;
        }

        if (!response.ok) throw new Error("Erro ao carregar dados");

        const result = await response.json();
        setStores(result.stores);
        setPagination(result.pagination);
        setError(null);
      } catch (err) {
        setError("Erro ao carregar lojas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [search, sort, order],
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchStores(1);
    }
  }, [status, fetchStores]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleSort = (field) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return "—";
    return phone;
  };

  const SortIcon = ({ field }) => {
    if (sort !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return (
      <span className="text-blue-600 ml-1">{order === "asc" ? "↑" : "↓"}</span>
    );
  };

  if (status === "loading" || (loading && !error)) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando lojas...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
            <p className="font-bold">Acesso Negado</p>
            <p>{error}</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Voltar para a página inicial
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Admin
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Todas as Lojas
            </h1>
            <p className="text-sm text-gray-500">
              {pagination.total} loja{pagination.total !== 1 ? "s" : ""}{" "}
              cadastrada{pagination.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nome, slug, cidade, categoria, CNPJ..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  >
                    Nome <SortIcon field="name" />
                  </th>
                  <th
                    onClick={() => handleSort("category")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  >
                    Categoria <SortIcon field="category" />
                  </th>
                  <th
                    onClick={() => handleSort("city")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  >
                    Cidade/Estado <SortIcon field="city" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dono
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Produtos
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  >
                    Cadastro <SortIcon field="createdAt" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Flyer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {store.image && (
                          <img
                            src={store.image}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                            onClick={() =>
                              setZoomImage({
                                src: store.image,
                                name: store.name,
                              })
                            }
                          />
                        )}
                        <div>
                          {store.slug ? (
                            <Link
                              href={`/lojas/${store.slug}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {store.name}
                            </Link>
                          ) : (
                            <p className="font-medium text-gray-900">
                              {store.name}
                            </p>
                          )}
                          {store.slug && (
                            <p className="text-xs text-gray-400">
                              /{store.slug}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {store.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {store.city}/{getStateDisplay(store.state)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatPhone(store.phone)}
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
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {store.user?.name || store.user?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {store._count?.products || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(store.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {store.slug ? (
                        <Link
                          href={`/lojas/${store.slug}/flyer`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          🖨️ Flyer
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {search
                        ? "Nenhuma loja encontrada para essa busca"
                        : "Nenhuma loja cadastrada"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando{" "}
                {Math.min(
                  (pagination.page - 1) * pagination.limit + 1,
                  pagination.total,
                )}
                –
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )}{" "}
                de {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchStores(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                {Array.from(
                  { length: Math.min(pagination.totalPages, 5) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchStores(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          pageNum === pagination.page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() => fetchStores(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Modal de zoom da imagem */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-2 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 text-lg leading-none"
            >
              ✕
            </button>
            <img
              src={zoomImage.src}
              alt={zoomImage.name}
              className="w-full h-auto rounded-xl"
            />
            <p className="text-center text-sm font-medium text-gray-700 mt-2 mb-1">
              {zoomImage.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminStoresPage() {
  return (
    <Suspense>
      <StoresContent />
    </Suspense>
  );
}
