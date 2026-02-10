"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";

// Componente do QR Code que evita hydration mismatch
function QRCodeComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[150px] h-[150px] bg-gray-200 rounded" />;
  }

  return (
    <QRCodeSVG
      value={`${typeof window !== "undefined" ? window.location.origin : ""}/para-lojistas`}
      size={200}
      level="H"
      includeMargin={false}
      fgColor="#ffffff"
      bgColor="#000000"
    />
  );
}

// Componente do conteúdo do flyer reutilizável
function FlyerContent() {
  return (
    <>
      {/* Logo + Headline em duas colunas */}
      <div className="flex gap-4 w-full items-start">
        {/* Logo à esquerda */}
        <div className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Nosso Local"
            width={500}
            height={500}
            className="w-[250px] h-[250px]"
          />
        </div>

        {/* Texto à direita */}
        <div className="flex-1 flex flex-col justify-start space-y-1">
          <p className="text-5xl font-bold text-gray-700 mt-15">
            NossoLocal.com.br
          </p>
          <h1 className="text-4xl font-black text-blue-600 leading-tight">
            Sua Loja Online{" "}
            <span className="text-4xl font-black text-green-600">Grátis</span>
          </h1>
          <p className="text-2xl font-bold text-gray-600 pt-1">
            Seu shopping local sempre aberto.
          </p>
        </div>
      </div>

      {/* Vantagens principais */}
      <div className="w-full grid grid-cols-2 gap-3 -mt-25 mb-4">
        <div className="bg-blue-50 rounded px-3 py-2 border-l-4 border-blue-600">
          <p className="text-2xl font-black text-blue-600">🌐 Aberto 24/7</p>
          <p className="text-sm text-gray-700">
            Venda mesmo quando está fechado
          </p>
        </div>
        <div className="bg-green-50 rounded px-3 py-2 border-l-4 border-green-600">
          <p className="text-2xl font-black text-green-600">💰 Zero Taxas</p>
          <p className="text-sm text-gray-700">Receba tudo via PIX direto</p>
        </div>
        <div className="bg-blue-50 rounded px-3 py-2 border-l-4 border-blue-600">
          <p className="text-2xl font-black text-blue-600">📱 Total Controle</p>
          <p className="text-sm text-gray-700">Gerencia tudo no seu celular</p>
        </div>
        <div className="bg-green-50 rounded px-3 py-2 border-l-4 border-green-600">
          <p className="text-2xl font-black text-green-600">
            🎯 Clientes Locais
          </p>
          <p className="text-sm text-gray-700">Apareça pra quem está perto</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center space-y-1.5 -mt-20">
        <div className="bg-blue-600 p-3 rounded-lg">
          <QRCodeComponent />
        </div>

        <p className="text-xs font-black text-gray-900">
          ESCANEIE PARA COMEÇAR
        </p>
      </div>

      {/* CTA Final */}
      <div className="text-center space-y-0.5 mt-3">
        <p className="text-3xl font-black text-blue-600">
          Sua loja fica pronta em minutos!
        </p>
        <p className="text-xl text-gray-600">www.nossolocal.com.br</p>
      </div>
    </>
  );
}

export default function FlyerA4() {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Botão de impressão */}
      <button
        onClick={handlePrint}
        className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition print:hidden"
      >
        Imprimir Flyer
      </button>

      {/* Container A4 - Flyer único */}
      <div
        ref={printRef}
        className="w-[200mm] h-[265mm] bg-#F6F6F1 shadow-2xl flex flex-col items-center justify-between p-8 print:shadow-none text-gray-900"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <FlyerContent />
      </div>

      {/* Estilos de impressão */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #f6f6f1;
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
