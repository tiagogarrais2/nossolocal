"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { isAdmin } from "../lib/permissions";

const stateSiglas = {
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

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [states, setStates] = useState({});
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);

  // Carregar localização salva do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("selectedState");
    const savedCity = localStorage.getItem("selectedCity");

    if (savedState && savedCity) {
      setSelectedState(savedState);
      setSelectedCity(savedCity);
    }
  }, []);

  // Salvar localização quando cidade e estado mudarem
  useEffect(() => {
    if (selectedState && selectedCity) {
      // Salvar automaticamente no localStorage
      localStorage.setItem("selectedState", selectedState);
      localStorage.setItem("selectedCity", selectedCity);
    }
  }, [selectedState, selectedCity]);

  // Carregar dados de estados e cidades
  useEffect(() => {
    const loadStatesData = async () => {
      try {
        const response = await fetch("/estados-cidades2.json");
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Erro ao carregar dados de estados:", error);
      }
    };

    loadStatesData();
  }, []);

  // Carregar lojas ativas
  useEffect(() => {
    const loadStores = async () => {
      try {
        const response = await fetch("/api/stores");
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        const data = await response.json();
        setStores(data.stores || []);
      } catch (error) {
        console.error("Erro ao carregar lojas:", error);
        setStores([]);
      }
    };

    loadStores();
  }, []);

  // Atualizar cidades quando o estado mudar
  useEffect(() => {
    if (selectedState && states.cities) {
      // Filtrar cidades pelo state_id
      const stateCities = states.cities
        .filter((city) => city.state_id === parseInt(selectedState))
        .map((city) => city.name);

      console.log("Estado selecionado:", selectedState);
      console.log("Cidades encontradas:", stateCities);
      setCities(stateCities);

      // Não resetar cidade se for carregamento do localStorage
      const savedCity = localStorage.getItem("selectedCity");
      if (!savedCity || savedCity !== selectedCity) {
        // Só resetar se não for a cidade salva
        const isCityInList = stateCities.includes(selectedCity);
        if (!isCityInList && savedCity !== selectedCity) {
          setSelectedCity("");
        }
      }
    } else {
      setCities([]);
    }
  }, [selectedState, states]);

  const isUserAdmin = session && isAdmin(session.user?.email);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Link para Admin (apenas se logado e for admin) */}
      {isUserAdmin && (
        <div className="bg-blue-900 text-white py-2 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
            <Link
              href="/admin"
              className="text-sm font-medium hover:text-blue-200 transition-colors"
            >
              → Ir para o Painel Admin
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Shopping virtual para o comércio local
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Descubra os produtos das melhores lojas da sua região!
            </p>

            {/* Seletor de Localização */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-gray-900 font-semibold text-lg mb-4 text-center">
                  Selecione sua localização
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Seletor de Estado */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Estado
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Selecione o estado</option>
                      {states.states &&
                        Object.entries(states.states)
                          .sort((a, b) => a[1].localeCompare(b[1]))
                          .map(([code, name]) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                    </select>
                  </div>

                  {/* Seletor de Cidade */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Cidade
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedState}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {selectedState
                          ? "Selecione a cidade"
                          : "Primeiro selecione o estado"}
                      </option>
                      {Array.isArray(cities) &&
                        cities.map((city, index) => (
                          <option key={index} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Botão Ver Lojas da Cidade */}
                <div className="text-center">
                  <Link
                    href={selectedCity && selectedState ? "/lojas" : "#"}
                    className={`inline-block px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 transform ${
                      selectedCity && selectedState
                        ? "bg-blue-700 text-white hover:bg-blue-800 hover:scale-105 shadow-md hover:shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={(e) => {
                      if (!selectedCity || !selectedState) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Ver lojas da cidade
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Para Lojistas */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 border-2 border-green-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Conteúdo */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Você é Lojista?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Leve sua loja para o digital! Gerencie seus produtos, receba
                  pedidos e ofereça delivery aos seus clientes - totalmente
                  grátis.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Cadastre sua loja em minutos
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Gerencie produtos e estoque facilmente
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Receba pedidos e configure delivery
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    Nenhuma taxa ou mensalidade
                  </li>
                </ul>
                <Link
                  href="/para-lojistas"
                  className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Saiba Mais →
                </Link>
              </div>

              {/* Ícone */}
              <div className="text-center">
                <div className="text-9xl mb-4">🏪</div>
                <p className="text-gray-600 font-medium">
                  Junte-se a nossos lojistas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Lojas Ativas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Lojas Disponíveis na Plataforma
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores && stores.length > 0 ? (
              stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-gray-50 p-6 rounded-lg shadow-md min-h-80 flex flex-col items-center text-center"
                >
                  <Link href={`/lojas/${store.slug}`} className="w-full block">
                    <div className="w-full aspect-square hover:opacity-80 transition-opacity rounded-md overflow-hidden mb-4">
                      <Image
                        src={store.image || "/no-image.png"}
                        alt={store.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain bg-white"
                      />
                    </div>
                  </Link>
                  <Link
                    href={`/lojas/${store.slug}`}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {store.name}
                  </Link>
                  <p className="text-gray-600 mt-2">
                    {store.city}, {stateSiglas[store.state] || store.state}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  Nenhuma loja disponível no momento
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
