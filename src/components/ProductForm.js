"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";

export default function ProductForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  errors = [],
  successMessage = "",
  isEditMode = false,
}) {
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadTimeout, setUploadTimeout] = useState(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    images: initialData?.images || [],
    available: initialData?.available ?? true,
    stock: initialData?.stock?.toString() || "",
    hasStockControl:
      initialData?.stock !== null && initialData?.stock !== undefined,
  });

  // Atualizar formData quando initialData mudar (importante para edição)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price?.toString() || "",
        images: initialData.images || [],
        available: initialData.available ?? true,
        stock: initialData?.stock?.toString() || "",
        hasStockControl:
          initialData?.stock !== null && initialData?.stock !== undefined,
      });
    }
  }, [initialData]);

  // Limpar timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
      }
    };
  }, [uploadTimeout]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isEditMode ? "Editar Produto" : "Novo Produto"}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? "Atualize as informações do produto"
            : "Preencha as informações do produto"}
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Por favor, corrija os seguintes erros:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
              <p className="text-sm text-green-700 mt-1">Redirecionando...</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Produto *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Pizza Margherita"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descreva o produto..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preço (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagens do Produto
          </label>
          <div className="space-y-4">
            {/* Lista de imagens carregadas */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = formData.images.filter(
                          (_, i) => i !== index,
                        );
                        setFormData({ ...formData, images: newImages });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botão para adicionar imagem */}
            <CldUploadWidget
              uploadPreset="ml_default"
              options={{
                folder: "tiagodelivery/products",
                maxFiles: 5,
              }}
              onUpload={(result) => {
                if (result.event === "success" && result.info?.secure_url) {
                  setFormData((prev) => ({
                    ...prev,
                    images: [...prev.images, result.info.secure_url],
                  }));
                  setImageUploading(false);
                  if (uploadTimeout) {
                    clearTimeout(uploadTimeout);
                    setUploadTimeout(null);
                  }
                }
              }}
              onQueuesEnd={(result) => {
                if (uploadTimeout) {
                  clearTimeout(uploadTimeout);
                  setUploadTimeout(null);
                }

                let imageUrls = [];

                // Processar múltiplos arquivos
                if (result?.info?.files && result.info.files.length > 0) {
                  imageUrls = result.info.files
                    .map((file) => file?.uploadInfo?.secure_url)
                    .filter((url) => url);
                } else if (result?.info?.secure_url) {
                  imageUrls = [result.info.secure_url];
                } else if (
                  result?.data?.files &&
                  result.data.files.length > 0
                ) {
                  imageUrls = result.data.files
                    .map((file) => file?.uploadInfo?.secure_url)
                    .filter((url) => url);
                }

                if (imageUrls.length > 0) {
                  setFormData((prev) => ({
                    ...prev,
                    images: [...prev.images, ...imageUrls],
                  }));
                }
                setImageUploading(false);
              }}
              onError={(error) => {
                console.error("Upload error:", error);
                if (uploadTimeout) {
                  clearTimeout(uploadTimeout);
                  setUploadTimeout(null);
                }
                setImageUploading(false);
              }}
              onClose={() => {
                setTimeout(() => {
                  if (imageUploading) {
                    setImageUploading(false);
                    if (uploadTimeout) {
                      clearTimeout(uploadTimeout);
                      setUploadTimeout(null);
                    }
                  }
                }, 100);
              }}
            >
              {({ open }) => {
                const handleClick = () => {
                  if (uploadTimeout) {
                    clearTimeout(uploadTimeout);
                  }
                  setImageUploading(true);
                  const timeout = setTimeout(() => {
                    setImageUploading(false);
                  }, 30000);
                  setUploadTimeout(timeout);
                  open();
                };

                return (
                  <button
                    type="button"
                    onClick={handleClick}
                    disabled={imageUploading}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {imageUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="text-gray-600">
                            Enviando imagem...
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <span className="text-gray-600">
                            + Adicionar Imagem
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              }}
            </CldUploadWidget>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Faça upload de até 5 imagens para o produto (PNG, JPG até 10MB cada)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            checked={formData.available}
            onChange={(e) =>
              setFormData({ ...formData, available: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="available"
            className="ml-2 block text-sm text-gray-900"
          >
            Produto disponível para venda
          </label>
        </div>

        {/* Controle de Estoque */}
        <div className="border-t pt-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="hasStockControl"
              checked={formData.hasStockControl}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hasStockControl: e.target.checked,
                  stock: e.target.checked ? formData.stock : "",
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="hasStockControl"
              className="ml-2 block text-sm font-medium text-gray-900"
            >
              Ativar controle de estoque
            </label>
          </div>

          {formData.hasStockControl && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade em Estoque
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-1 text-sm text-gray-500">
                Deixe em branco ou desative o controle para vendas ilimitadas. A
                cada venda, o estoque será reduzido automaticamente.
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading
              ? isEditMode
                ? "Atualizando..."
                : "Cadastrando..."
              : isEditMode
                ? "Atualizar Produto"
                : "Cadastrar Produto"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
