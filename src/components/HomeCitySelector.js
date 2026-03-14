"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomeCitySelector() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [states, setStates] = useState({});
  const [cities, setCities] = useState([]);

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

  // Atualizar cidades quando o estado mudar
  useEffect(() => {
    if (selectedState && states.cities) {
      const stateCities = states.cities
        .filter((city) => city.state_id === parseInt(selectedState))
        .map((city) => city.name);
      setCities(stateCities);

      // Não resetar cidade se for carregamento do localStorage
      const savedCity = localStorage.getItem("selectedCity");
      if (!savedCity || savedCity !== selectedCity) {
        const isCityInList = stateCities.includes(selectedCity);
        if (!isCityInList && savedCity !== selectedCity) {
          setSelectedCity("");
        }
      }
    } else {
      setCities([]);
    }
  }, [selectedState, states]);

  return (
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
            href={
              selectedCity && selectedState
                ? `/lojas?city=${encodeURIComponent(selectedCity)}&state=${encodeURIComponent(selectedState)}`
                : "#"
            }
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
  );
}
