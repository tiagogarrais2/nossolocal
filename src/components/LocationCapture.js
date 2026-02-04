"use client";

import { useState } from "react";

export default function LocationCapture({
  latitude,
  longitude,
  onLocationChange,
}) {
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  // Função para capturar localização manualmente
  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não disponível no seu navegador");
      return;
    }

    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();

        onLocationChange({
          latitude: lat,
          longitude: lng,
        });

        setLocationCaptured(true);
        setCapturingLocation(false);
      },
      (error) => {
        console.error("Erro ao capturar localização:", error);
        alert(
          "Não foi possível capturar a localização. Verifique as permissões do navegador.",
        );
        setCapturingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleLatitudeChange = (e) => {
    onLocationChange({
      latitude: e.target.value,
      longitude,
    });
  };

  const handleLongitudeChange = (e) => {
    onLocationChange({
      latitude,
      longitude: e.target.value,
    });
  };

  return (
    <div>
      <div className="mb-3">
        <button
          type="button"
          onClick={captureLocation}
          disabled={capturingLocation}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {capturingLocation ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Capturando...</span>
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
              <span>
                {latitude && longitude
                  ? "Atualizar Localização"
                  : "Capturar Localização"}
              </span>
            </>
          )}
        </button>
      </div>

      {locationCaptured && latitude && longitude && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Localização capturada: {parseFloat(latitude).toFixed(6)},{" "}
            {parseFloat(longitude).toFixed(6)}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={handleLatitudeChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="-23.550520"
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={handleLongitudeChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="-46.633308"
          />
        </div>
      </div>
    </div>
  );
}
