"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { formatPrice } from "../../lib/utils";

function LojasContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statesData, setStatesData] = useState({});
  const [cidade, setCidade] = useState(null);
  const [estado, setEstado] = useState(null);

  // Carregar localização do localStorage
  useEffect(() => {
    // Tentar ler do localStorage
    const savedCity = localStorage.getItem("selectedCity");
    const savedState = localStorage.getItem("selectedState");

    if (savedCity && savedState) {
      setCidade(savedCity);
      setEstado(savedState);
    }
  }, []);

  // Carregar dados de estados para converter código em nome
  useEffect(() => {
    const loadStatesData = async () => {
      try {
        const response = await fetch("/estados-cidades2.json");
        const data = await response.json();
        setStatesData(data);
      } catch (error) {
        console.error("Erro ao carregar dados de estados:", error);
      }
    };

    loadStatesData();
  }, []);

  // Buscar lojas
  useEffect(() => {
    const fetchStores = async () => {
      if (!cidade || !estado) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/stores?city=${encodeURIComponent(
            cidade,
          )}&state=${encodeURIComponent(estado)}`,
        );
        if (response.ok) {
          const data = await response.json();

          console.log("Buscando lojas para:", { cidade, estado });
          console.log("Lojas encontradas:", data.stores?.length);

          setStores(data.stores || []);
        }
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [cidade, estado]);

  if (!cidade || !estado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Localização não selecionada
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Voltar para página inicial
          </Link>
        </div>
      </div>
    );
  }

  const estadoNome = statesData.states?.[estado] || estado;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Location Info */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lojas em {cidade}
            </h1>
            <p className="text-gray-600">
              📍 {cidade}, {estadoNome}
            </p>
          </div>
        </div>

        {/* Stores List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Carregando lojas...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhuma loja encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              Ainda não temos lojas cadastradas em {cidade}.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Buscar em outra cidade
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div
                key={store.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
                  !store.isOpen ? "opacity-75" : ""
                }`}
              >
                {store.image && (
                  <div className="aspect-square">
                    <img
                      src={store.image}
                      alt={`Imagem da loja ${store.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {store.name}
                    </h3>
                    {!store.isOpen && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Delivery fechado
                      </span>
                    )}
                  </div>

                  {store.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {store.description}
                    </p>
                  )}

                  {!store.isOpen && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <span className="text-yellow-600 mr-2">⏰</span>
                        <span className="text-yellow-800 text-sm font-medium">
                          A loja está fechada neste momento.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start">
                      <span className="mr-2">📍</span>
                      <span>
                        {store.street}, {store.number}
                        {store.neighborhood && ` - ${store.neighborhood}`}
                      </span>
                    </div>

                    {store.phone && (
                      <div className="flex items-center">
                        <span className="mr-2">📞</span>
                        <span>{store.phone}</span>
                      </div>
                    )}

                    {store.minimumOrder && (
                      <div className="flex items-center">
                        <span className="mr-2">💰</span>
                        <span>
                          Pedido mínimo: {formatPrice(store.minimumOrder)}
                        </span>
                      </div>
                    )}

                    {store.deliveryFee !== null &&
                      store.deliveryFee !== undefined && (
                        <div className="flex items-center">
                          <span className="mr-2">🚚</span>
                          <span>
                            Taxa de entrega:{" "}
                            {store.deliveryFee === 0
                              ? "Grátis"
                              : formatPrice(store.deliveryFee)}
                          </span>
                        </div>
                      )}
                  </div>

                  <Link
                    href={`/lojas/${store.slug}`}
                    className={`block w-full text-center px-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                      store.isOpen
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {store.isOpen ? "Ver Loja" : "Ver Produtos"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function LojasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-lg">Carregando...</p>
        </div>
      }
    >
      <LojasContent />
    </Suspense>
  );
}
