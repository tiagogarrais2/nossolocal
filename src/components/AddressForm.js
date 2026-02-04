"use client";

import { useState, useRef, useEffect } from "react";
import { IMaskInput } from "react-imask";
import LocationCapture from "./LocationCapture";

export default function AddressForm({
  onSubmit,
  onCancel,
  initialData = null,
  states = {},
  cities = [],
  submitButtonText = "Salvar Endereço",
  showPrimaryCheckbox = true,
}) {
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [zipCodeLoading, setZipCodeLoading] = useState(false);

  // Ref para controlar requisições simultâneas
  const isFetchingRef = useRef(false);
  const lastFetchedZipCodeRef = useRef("");

  // Sincronizar valores quando initialData muda (para edição)
  useEffect(() => {
    if (initialData) {
      setZipCode(initialData.zipCode || "");
      setStreet(initialData.street || "");
      setNumber(initialData.number || "");
      setComplement(initialData.complement || "");
      setNeighborhood(initialData.neighborhood || "");
      setCity(initialData.city || "");
      setState(initialData.state || "");
      setLatitude(
        initialData.latitude !== null && initialData.latitude !== undefined
          ? initialData.latitude.toString()
          : "",
      );
      setLongitude(
        initialData.longitude !== null && initialData.longitude !== undefined
          ? initialData.longitude.toString()
          : "",
      );
      setIsPrimary(initialData.isPrimary || false);
    }
  }, [initialData]);

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

  const handleZipCodeChange = async (value) => {
    setZipCode(value);

    // Remover caracteres não numéricos
    const cleanZipCode = value.replace(/\D/g, "");

    // Só fazer requisição se:
    // 1. CEP tem 8 dígitos
    // 2. Não há requisição em andamento
    // 3. CEP é diferente do último buscado
    if (
      cleanZipCode.length === 8 &&
      !isFetchingRef.current &&
      cleanZipCode !== lastFetchedZipCodeRef.current
    ) {
      isFetchingRef.current = true;
      lastFetchedZipCodeRef.current = cleanZipCode;
      setZipCodeLoading(true);

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanZipCode}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          // Mapear UF para código de estado
          const stateCode = ufToStateCode[data.uf];

          // Encontrar a cidade na lista
          const cityData = cities.find(
            (city) =>
              city.name.toLowerCase() === data.localidade.toLowerCase() &&
              city.state_id.toString() === stateCode,
          );

          // Preencher os campos automaticamente
          setStreet(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(cityData ? cityData.name : data.localidade || "");
          setState(stateCode || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setZipCodeLoading(false);
        isFetchingRef.current = false;
      }
    }
  };

  const handleLocationChange = ({ latitude: lat, longitude: lng }) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      isPrimary,
    });
  };

  // Renderizar o conteúdo do formulário
  const formContent = (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP *
          </label>
          <div className="relative">
            <IMaskInput
              key="zipcode-input"
              mask="00000-000"
              value={zipCode}
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
            key="street-input"
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
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
            key="number-input"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
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
            key="complement-input"
            type="text"
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
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
            key="neighborhood-input"
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
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
            key="state-select"
            value={state}
            onChange={(e) => setState(e.target.value)}
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
            key="city-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            disabled={!state}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {state ? "Selecione a cidade" : "Selecione o estado primeiro"}
            </option>
            {cities
              .filter((cityItem) => cityItem.state_id.toString() === state)
              .map((cityItem) => (
                <option key={cityItem.id} value={cityItem.name}>
                  {cityItem.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Coordenadas Geográficas */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-900">
            Coordenadas Geográficas (Opcional)
          </h5>
          <p className="text-xs text-gray-500 mt-1">
            Capture automaticamente ou insira manualmente
          </p>
        </div>
        <LocationCapture
          latitude={latitude}
          longitude={longitude}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* Endereço Principal */}
      {showPrimaryCheckbox && (
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              key="primary-checkbox"
              id="is-primary"
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="is-primary" className="text-sm text-gray-700">
              Definir como endereço principal
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Este será o endereço padrão para suas entregas.
            </p>
          </div>
        </div>
      )}

      {/* Botões */}
      {submitButtonText && (
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            {submitButtonText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );

  // Se tiver submitButtonText, renderizar com form wrapper
  // Caso contrário, renderizar apenas os campos (para uso dentro de outro form)
  if (submitButtonText) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {formContent}
      </form>
    );
  }

  return formContent;
}
