"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import AddressForm from "../../../components/AddressForm";
import Footer from "../../../components/Footer";

function AddressFormContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = searchParams.get("id");
  const [states, setStates] = useState({});
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  // Buscar dados de estados e cidades
  useEffect(() => {
    const fetchStatesAndCities = async () => {
      try {
        const res = await fetch("/estados-cidades2.json");
        if (res.ok) {
          const data = await res.json();
          setStates(data.states);
          setCities(data.cities);
        }
      } catch (error) {
        console.error("Erro ao buscar estados e cidades:", error);
      }
    };
    fetchStatesAndCities();
  }, []);

  // Buscar endereço para edição
  useEffect(() => {
    if (addressId && session) {
      const fetchAddress = async () => {
        try {
          const res = await fetch("/api/addresses");
          if (res.ok) {
            const data = await res.json();
            const address = data.addresses.find((a) => a.id === addressId);
            if (address) {
              setEditingAddress(address);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar endereço:", error);
        }
      };
      fetchAddress();
    }
  }, [addressId, session]);

  const handleAddressSubmit = async (formData) => {
    setLoading(true);

    const url = "/api/addresses";
    const method = addressId ? "PUT" : "POST";
    const data = addressId ? { ...formData, id: addressId } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/painel?tab=addresses");
      } else {
        alert("Erro ao salvar endereço");
      }
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/painel?tab=addresses");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Nosso Local
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Início
              </Link>
              <Link href="/painel" className="text-blue-600 font-semibold">
                Painel
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {session?.user?.name}</span>
              <Link
                href="/painel?tab=addresses"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {addressId ? "Editar Endereço" : "Novo Endereço"}
            </h1>
            <p className="text-gray-600">
              {addressId
                ? "Atualize as informações do seu endereço"
                : "Adicione um novo endereço de entrega"}
            </p>
          </div>

          {/* Address Form */}
          <AddressForm
            onSubmit={handleAddressSubmit}
            onCancel={handleCancel}
            initialData={editingAddress}
            states={states}
            cities={cities}
            submitButtonText={
              loading
                ? "Salvando..."
                : addressId
                  ? "Atualizar Endereço"
                  : "Adicionar Endereço"
            }
            showPrimaryCheckbox={true}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AddressFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-lg">Carregando...</p>
        </div>
      }
    >
      <AddressFormContent />
    </Suspense>
  );
}
