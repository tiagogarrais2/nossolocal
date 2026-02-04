"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ProductForm from "../../../components/ProductForm";

function NewProductPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  // Buscar dados da loja
  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;

      try {
        const response = await fetch("/api/stores");
        if (response.ok) {
          const data = await response.json();
          const foundStore = data.stores?.find((s) => s.id === storeId);
          setStore(foundStore);
        }
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
      }
    };

    if (session) {
      fetchStore();
    }
  }, [storeId, session]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId,
          ...formData,
        }),
      });

      if (response.ok) {
        setSuccessMessage("Produto cadastrado com sucesso!");
        setTimeout(() => {
          router.push(`/products?storeId=${storeId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || ["Erro ao salvar produto"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno do servidor"]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/products?storeId=${storeId}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Loja não especificada
          </h1>
          <Link
            href="/painel?tab=stores"
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar para lojas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Store Info */}
        {store && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {store.name}
            </h2>
            {store.description && (
              <p className="text-gray-600">{store.description}</p>
            )}
          </div>
        )}

        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          errors={errors}
          successMessage={successMessage}
          isEditMode={false}
        />
      </main>

      <Footer />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-lg">Carregando...</p>
        </div>
      }
    >
      <NewProductPageContent />
    </Suspense>
  );
}
