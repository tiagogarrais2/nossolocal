"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getStateDisplay } from "@/lib/utils";

function QRCodeStore({ url }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[200px] h-[200px] bg-gray-200 rounded" />;
  }

  return (
    <QRCodeSVG
      value={url}
      size={300}
      level="H"
      includeMargin={false}
      fgColor="#ffffff"
      bgColor="#000000"
    />
  );
}

function AutoFitTitle({ text }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(96);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    let size = 96;
    textRef.current.style.fontSize = `${size}px`;
    while (
      textRef.current.scrollWidth > containerRef.current.clientWidth &&
      size > 12
    ) {
      size -= 2;
      textRef.current.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [text]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <h1
        ref={textRef}
        className="font-black text-black leading-tight whitespace-nowrap text-center"
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </h1>
    </div>
  );
}

export default function FlyerLoja() {
  const { slug } = useParams();
  const printRef = useRef();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStore() {
      try {
        const response = await fetch(
          `/api/stores?slug=${encodeURIComponent(slug)}`,
        );
        if (!response.ok) throw new Error("Erro ao buscar loja");
        const data = await response.json();
        const found = data.stores?.find((s) => s.slug === slug);
        if (!found) throw new Error("Loja não encontrada");
        setStore(found);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchStore();
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-500">Carregando flyer da loja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  const storeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lojas/${store.slug}`
      : `/lojas/${store.slug}`;

  const storeUrlDisplay = `www.nossolocal.com.br/lojas/${store.slug}`;

  const fullAddress = [
    `${store.street}, ${store.number}`,
    store.complement,
    store.neighborhood,
    `${store.city} - ${getStateDisplay(store.state)}`,
    store.zipCode,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Botão de impressão */}
      <button
        onClick={handlePrint}
        className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition print:hidden"
      >
        Imprimir Flyer
      </button>

      {/* Container A4 */}
      <div
        ref={printRef}
        className="w-[200mm] h-[265mm] bg-white shadow-2xl flex flex-col items-center justify-between p-8 print:shadow-none text-gray-900"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* Nome da loja em destaque */}
        <div className="text-center -mt-2 w-full">
          <AutoFitTitle text={store.name} />
          {store.description && (
            <p className="text-2xl font-semibold text-black mt-1">
              {store.description}
            </p>
          )}
        </div>

        {/* QR Code central */}
        <div className="flex flex-col items-center space-y-2 -mt-2">
          <p className="text-lg font-bold text-gray-700">
            📱 Escaneie e visite nossa vitrine online:
          </p>
          <div className="bg-blue-600 p-3 rounded-lg">
            <QRCodeStore url={storeUrl} />
          </div>
        </div>

        {/* URL escrita */}
        <div className="bg-gray-100 rounded-lg px-6 py-3 text-center -mt-2">
          <p className="text-lg font-bold text-blue-800 break-all">
            {storeUrlDisplay}
          </p>
        </div>

        {/* Logos: Site + Loja */}
        <div className="flex items-center justify-center gap-6 w-full">
          <div className="flex flex-col items-center border-9 border-gray-300 rounded-lg p-2">
            <Image
              src="/logo.png"
              alt="Nosso Local"
              width={300}
              height={300}
              className="w-[300px] h-[300px] object-contain"
            />
          </div>

          {store.image && (
            <>
              <div className="text-4xl text-black font-thin">+</div>
              <div className="flex flex-col items-center border-9 border-gray-300 rounded-lg p-0">
                <Image
                  src={store.image}
                  alt={store.name}
                  width={300}
                  height={300}
                  className="w-[300px] h-[300px] object-contain rounded-lg"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Estilos de impressão */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
