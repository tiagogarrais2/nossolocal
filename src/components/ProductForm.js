"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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

  const emptyGroup = () => ({
    name: "",
    type: "checkbox",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    dependsOn: null,
    options: [{ name: "", description: "", price: 0, available: true }],
  });

  // Helper: retorna os grupos anteriores a gi que podem ser grupo-pai
  const getParentGroupCandidates = (gi) => {
    return formData.groups
      .map((g, i) => ({ ...g, index: i }))
      .filter((g, i) => i < gi && g.name.trim() !== "");
  };

  // Helper: retorna as opções do grupo-pai referenciado pelo dependsOn
  const getParentGroupOptions = (dependsOn) => {
    if (!dependsOn || dependsOn.groupIndex === undefined) return [];
    const parentGroup = formData.groups[dependsOn.groupIndex];
    if (!parentGroup) return [];
    return parentGroup.options.filter((o) => o.name.trim() !== "");
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    images: initialData?.images || [],
    available: initialData?.available ?? true,
    stock: initialData?.stock?.toString() || "",
    hasStockControl:
      initialData?.stock !== null && initialData?.stock !== undefined,
    isAssemblable: initialData?.isAssemblable || false,
    groups: initialData?.groups || [],
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
        isAssemblable: initialData?.isAssemblable || false,
        groups: initialData?.groups || [],
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
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px]"
            placeholder="Descreva o produto..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.isAssemblable ? "Preço Base (R$)" : "Preço (R$) *"}
          </label>
          {formData.isAssemblable && (
            <p className="text-xs text-gray-500 mb-1">
              Opcional para montáveis — o preço pode vir das opções
            </p>
          )}
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
            required={!formData.isAssemblable}
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
                    <Image
                      src={img || "/no-image.png"}
                      alt={`Imagem ${index + 1}`}
                      width={200}
                      height={200}
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

        {/* Produto Montável */}
        <div className="border-t pt-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isAssemblable"
              checked={formData.isAssemblable}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData({
                  ...formData,
                  isAssemblable: checked,
                  groups:
                    checked && formData.groups.length === 0
                      ? [emptyGroup()]
                      : formData.groups,
                });
              }}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isAssemblable"
              className="ml-2 block text-sm font-medium text-gray-900"
            >
              🧩 Este produto é montável
            </label>
            <span className="ml-2 text-xs text-gray-500">
              (marmita, pizza, açaí, esfirra...)
            </span>
          </div>

          {formData.isAssemblable && (
            <div className="ml-2 space-y-6">
              <p className="text-sm text-gray-600">
                Configure os grupos de personalização. Cada grupo contém opções
                para o cliente escolher.
              </p>

              {formData.groups.map((group, gi) => (
                <div
                  key={gi}
                  className="border border-purple-200 rounded-lg p-4 bg-purple-50/30"
                >
                  {/* Header do grupo */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-purple-800">
                      Grupo {gi + 1}
                    </h4>
                    <div className="flex items-center gap-1">
                      {gi > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newGroups = [...formData.groups];
                            [newGroups[gi - 1], newGroups[gi]] = [
                              newGroups[gi],
                              newGroups[gi - 1],
                            ];
                            setFormData({ ...formData, groups: newGroups });
                          }}
                          className="p-1 text-gray-500 hover:text-purple-700 text-xs"
                          title="Mover para cima"
                        >
                          ▲
                        </button>
                      )}
                      {gi < formData.groups.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newGroups = [...formData.groups];
                            [newGroups[gi], newGroups[gi + 1]] = [
                              newGroups[gi + 1],
                              newGroups[gi],
                            ];
                            setFormData({ ...formData, groups: newGroups });
                          }}
                          className="p-1 text-gray-500 hover:text-purple-700 text-xs"
                          title="Mover para baixo"
                        >
                          ▼
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newGroups = formData.groups.filter(
                            (_, i) => i !== gi,
                          );
                          setFormData({ ...formData, groups: newGroups });
                        }}
                        className="ml-2 p-1 text-red-500 hover:text-red-700 text-sm"
                        title="Remover grupo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Nome do grupo */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        const newGroups = [...formData.groups];
                        newGroups[gi] = {
                          ...newGroups[gi],
                          name: e.target.value,
                        };
                        setFormData({ ...formData, groups: newGroups });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nome do grupo (ex: Tamanho, Sabor, Borda...)"
                    />
                  </div>

                  {/* Configurações do grupo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Tipo
                      </label>
                      <select
                        value={group.type}
                        onChange={(e) => {
                          const newGroups = [...formData.groups];
                          const type = e.target.value;
                          newGroups[gi] = {
                            ...newGroups[gi],
                            type,
                            minSelections:
                              type === "radio"
                                ? 1
                                : newGroups[gi].minSelections,
                            maxSelections:
                              type === "radio"
                                ? 1
                                : newGroups[gi].maxSelections,
                          };
                          setFormData({ ...formData, groups: newGroups });
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="radio">Escolha única</option>
                        <option value="checkbox">Múltipla escolha</option>
                        <option value="quantity">Quantidade</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={group.required}
                          onChange={(e) => {
                            const newGroups = [...formData.groups];
                            newGroups[gi] = {
                              ...newGroups[gi],
                              required: e.target.checked,
                            };
                            setFormData({ ...formData, groups: newGroups });
                          }}
                          className="h-3.5 w-3.5 text-purple-600 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">Obrigatório</span>
                      </label>
                    </div>

                    {group.type !== "radio" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Mín. seleções
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={group.minSelections}
                            onChange={(e) => {
                              const newGroups = [...formData.groups];
                              newGroups[gi] = {
                                ...newGroups[gi],
                                minSelections: parseInt(e.target.value) || 0,
                              };
                              setFormData({ ...formData, groups: newGroups });
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Máx. seleções
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={group.maxSelections}
                            onChange={(e) => {
                              const newGroups = [...formData.groups];
                              newGroups[gi] = {
                                ...newGroups[gi],
                                maxSelections: parseInt(e.target.value) || 1,
                              };
                              setFormData({ ...formData, groups: newGroups });
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dependências do grupo */}
                  {gi > 0 && (
                    <div className="mb-4">
                      <label className="flex items-center gap-1.5 text-xs mb-2">
                        <input
                          type="checkbox"
                          checked={!!group.dependsOn}
                          onChange={(e) => {
                            const newGroups = [...formData.groups];
                            if (e.target.checked) {
                              const candidates = getParentGroupCandidates(gi);
                              const parentIdx =
                                candidates.length > 0 ? candidates[0].index : 0;
                              newGroups[gi] = {
                                ...newGroups[gi],
                                dependsOn: { groupIndex: parentIdx, rules: {} },
                              };
                            } else {
                              newGroups[gi] = {
                                ...newGroups[gi],
                                dependsOn: null,
                              };
                            }
                            setFormData({ ...formData, groups: newGroups });
                          }}
                          className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-gray-700 font-medium">
                          🔗 Depende de outro grupo
                        </span>
                        <span className="text-gray-400">
                          (min/máx dinâmico)
                        </span>
                      </label>

                      {group.dependsOn && (
                        <div className="ml-5 p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Grupo de referência
                            </label>
                            <select
                              value={group.dependsOn.groupIndex ?? 0}
                              onChange={(e) => {
                                const newGroups = [...formData.groups];
                                newGroups[gi] = {
                                  ...newGroups[gi],
                                  dependsOn: {
                                    ...newGroups[gi].dependsOn,
                                    groupIndex: parseInt(e.target.value),
                                    rules: {},
                                  },
                                };
                                setFormData({ ...formData, groups: newGroups });
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            >
                              {getParentGroupCandidates(gi).map((pg) => (
                                <option key={pg.index} value={pg.index}>
                                  Grupo {pg.index + 1}: {pg.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-2">
                              Regras por opção do grupo-pai
                            </label>
                            <div className="space-y-1.5">
                              {getParentGroupOptions(group.dependsOn).map(
                                (parentOpt) => {
                                  const rule =
                                    group.dependsOn.rules?.[parentOpt.name] ||
                                    {};
                                  return (
                                    <div
                                      key={parentOpt.name}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <span
                                        className="w-28 truncate font-medium text-gray-700"
                                        title={parentOpt.name}
                                      >
                                        {parentOpt.name}
                                      </span>
                                      <label className="flex items-center gap-1">
                                        <span className="text-gray-500">
                                          Mín:
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={rule.minSelections ?? ""}
                                          onChange={(e) => {
                                            const newGroups = [
                                              ...formData.groups,
                                            ];
                                            const dep = {
                                              ...newGroups[gi].dependsOn,
                                            };
                                            dep.rules = {
                                              ...dep.rules,
                                              [parentOpt.name]: {
                                                ...dep.rules?.[parentOpt.name],
                                                minSelections:
                                                  parseInt(e.target.value) || 0,
                                              },
                                            };
                                            newGroups[gi] = {
                                              ...newGroups[gi],
                                              dependsOn: dep,
                                            };
                                            setFormData({
                                              ...formData,
                                              groups: newGroups,
                                            });
                                          }}
                                          className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                        />
                                      </label>
                                      <label className="flex items-center gap-1">
                                        <span className="text-gray-500">
                                          Máx:
                                        </span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={rule.maxSelections ?? ""}
                                          onChange={(e) => {
                                            const newGroups = [
                                              ...formData.groups,
                                            ];
                                            const dep = {
                                              ...newGroups[gi].dependsOn,
                                            };
                                            dep.rules = {
                                              ...dep.rules,
                                              [parentOpt.name]: {
                                                ...dep.rules?.[parentOpt.name],
                                                maxSelections:
                                                  parseInt(e.target.value) || 1,
                                              },
                                            };
                                            newGroups[gi] = {
                                              ...newGroups[gi],
                                              dependsOn: dep,
                                            };
                                            setFormData({
                                              ...formData,
                                              groups: newGroups,
                                            });
                                          }}
                                          className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                        />
                                      </label>
                                    </div>
                                  );
                                },
                              )}
                              {getParentGroupOptions(group.dependsOn).length ===
                                0 && (
                                <p className="text-xs text-gray-400 italic">
                                  Adicione opções ao grupo de referência
                                  primeiro
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Opções do grupo */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Opções
                    </label>
                    {group.options.map((option, oi) => (
                      <div key={oi} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              const newGroups = [...formData.groups];
                              const newOptions = [...newGroups[gi].options];
                              newOptions[oi] = {
                                ...newOptions[oi],
                                name: e.target.value,
                              };
                              newGroups[gi] = {
                                ...newGroups[gi],
                                options: newOptions,
                              };
                              setFormData({ ...formData, groups: newGroups });
                            }}
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Nome da opção"
                          />
                          <input
                            type="text"
                            value={option.description || ""}
                            onChange={(e) => {
                              const newGroups = [...formData.groups];
                              const newOptions = [...newGroups[gi].options];
                              newOptions[oi] = {
                                ...newOptions[oi],
                                description: e.target.value,
                              };
                              newGroups[gi] = {
                                ...newGroups[gi],
                                options: newOptions,
                              };
                              setFormData({ ...formData, groups: newGroups });
                            }}
                            className="w-44 lg:w-56 px-2 py-1.5 border border-gray-300 rounded text-sm hidden md:block"
                            placeholder="Descrição"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.price || ""}
                              onChange={(e) => {
                                const newGroups = [...formData.groups];
                                const newOptions = [...newGroups[gi].options];
                                newOptions[oi] = {
                                  ...newOptions[oi],
                                  price: parseFloat(e.target.value) || 0,
                                };
                                newGroups[gi] = {
                                  ...newGroups[gi],
                                  options: newOptions,
                                };
                                setFormData({ ...formData, groups: newGroups });
                              }}
                              className="w-24 pl-7 pr-2 py-1.5 border border-gray-300 rounded text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={option.available !== false}
                              onChange={(e) => {
                                const newGroups = [...formData.groups];
                                const newOptions = [...newGroups[gi].options];
                                newOptions[oi] = {
                                  ...newOptions[oi],
                                  available: e.target.checked,
                                };
                                newGroups[gi] = {
                                  ...newGroups[gi],
                                  options: newOptions,
                                };
                                setFormData({ ...formData, groups: newGroups });
                              }}
                              className="h-3.5 w-3.5 text-green-600 border-gray-300 rounded"
                            />
                            <span className="hidden sm:inline">Disp.</span>
                          </label>

                          {/* Reorder option buttons */}
                          <div className="flex flex-col">
                            {oi > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newGroups = [...formData.groups];
                                  const newOptions = [...newGroups[gi].options];
                                  [newOptions[oi - 1], newOptions[oi]] = [
                                    newOptions[oi],
                                    newOptions[oi - 1],
                                  ];
                                  newGroups[gi] = {
                                    ...newGroups[gi],
                                    options: newOptions,
                                  };
                                  setFormData({
                                    ...formData,
                                    groups: newGroups,
                                  });
                                }}
                                className="text-gray-400 hover:text-purple-600 text-[10px] leading-none"
                              >
                                ▲
                              </button>
                            )}
                            {oi < group.options.length - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newGroups = [...formData.groups];
                                  const newOptions = [...newGroups[gi].options];
                                  [newOptions[oi], newOptions[oi + 1]] = [
                                    newOptions[oi + 1],
                                    newOptions[oi],
                                  ];
                                  newGroups[gi] = {
                                    ...newGroups[gi],
                                    options: newOptions,
                                  };
                                  setFormData({
                                    ...formData,
                                    groups: newGroups,
                                  });
                                }}
                                className="text-gray-400 hover:text-purple-600 text-[10px] leading-none"
                              >
                                ▼
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newGroups = [...formData.groups];
                              const newOptions = newGroups[gi].options.filter(
                                (_, i) => i !== oi,
                              );
                              newGroups[gi] = {
                                ...newGroups[gi],
                                options: newOptions,
                              };
                              setFormData({ ...formData, groups: newGroups });
                            }}
                            className="text-red-400 hover:text-red-600 text-sm"
                            title="Remover opção"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Preço variável por grupo-pai */}
                        {gi > 0 && option.name.trim() !== "" && (
                          <div className="ml-2">
                            <label className="flex items-center gap-1.5 text-xs">
                              <input
                                type="checkbox"
                                checked={!!option.priceMatrix}
                                onChange={(e) => {
                                  const newGroups = [...formData.groups];
                                  const newOptions = [...newGroups[gi].options];
                                  if (e.target.checked) {
                                    const candidates =
                                      getParentGroupCandidates(gi);
                                    const parentIdx =
                                      candidates.length > 0
                                        ? candidates[0].index
                                        : 0;
                                    newOptions[oi] = {
                                      ...newOptions[oi],
                                      priceMatrix: {
                                        groupIndex: parentIdx,
                                        prices: {},
                                      },
                                    };
                                  } else {
                                    newOptions[oi] = {
                                      ...newOptions[oi],
                                      priceMatrix: null,
                                    };
                                  }
                                  newGroups[gi] = {
                                    ...newGroups[gi],
                                    options: newOptions,
                                  };
                                  setFormData({
                                    ...formData,
                                    groups: newGroups,
                                  });
                                }}
                                className="h-3 w-3 text-amber-600 border-gray-300 rounded"
                              />
                              <span className="text-gray-500">
                                💰 Preço variável
                              </span>
                            </label>

                            {option.priceMatrix && (
                              <div className="mt-1.5 ml-4 p-2 bg-amber-50/50 border border-amber-200 rounded space-y-1.5">
                                <select
                                  value={option.priceMatrix.groupIndex ?? 0}
                                  onChange={(e) => {
                                    const newGroups = [...formData.groups];
                                    const newOptions = [
                                      ...newGroups[gi].options,
                                    ];
                                    newOptions[oi] = {
                                      ...newOptions[oi],
                                      priceMatrix: {
                                        ...newOptions[oi].priceMatrix,
                                        groupIndex: parseInt(e.target.value),
                                        prices: {},
                                      },
                                    };
                                    newGroups[gi] = {
                                      ...newGroups[gi],
                                      options: newOptions,
                                    };
                                    setFormData({
                                      ...formData,
                                      groups: newGroups,
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                >
                                  {getParentGroupCandidates(gi).map((pg) => (
                                    <option key={pg.index} value={pg.index}>
                                      Grupo {pg.index + 1}: {pg.name}
                                    </option>
                                  ))}
                                </select>
                                <div className="space-y-1">
                                  {(() => {
                                    const parentGroup =
                                      formData.groups[
                                        option.priceMatrix.groupIndex
                                      ];
                                    if (!parentGroup) return null;
                                    return parentGroup.options
                                      .filter((po) => po.name.trim() !== "")
                                      .map((parentOpt) => (
                                        <div
                                          key={parentOpt.name}
                                          className="flex items-center gap-2 text-xs"
                                        >
                                          <span
                                            className="w-24 truncate text-gray-700"
                                            title={parentOpt.name}
                                          >
                                            {parentOpt.name}
                                          </span>
                                          <div className="relative">
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                                              R$
                                            </span>
                                            <input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              value={
                                                option.priceMatrix.prices?.[
                                                  parentOpt.name
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                const newGroups = [
                                                  ...formData.groups,
                                                ];
                                                const newOptions = [
                                                  ...newGroups[gi].options,
                                                ];
                                                const pm = {
                                                  ...newOptions[oi].priceMatrix,
                                                };
                                                pm.prices = {
                                                  ...pm.prices,
                                                  [parentOpt.name]:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                };
                                                newOptions[oi] = {
                                                  ...newOptions[oi],
                                                  priceMatrix: pm,
                                                };
                                                newGroups[gi] = {
                                                  ...newGroups[gi],
                                                  options: newOptions,
                                                };
                                                setFormData({
                                                  ...formData,
                                                  groups: newGroups,
                                                });
                                              }}
                                              className="w-20 pl-6 pr-1 py-1 border border-gray-300 rounded text-xs"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                      ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newGroups = [...formData.groups];
                        newGroups[gi] = {
                          ...newGroups[gi],
                          options: [
                            ...newGroups[gi].options,
                            {
                              name: "",
                              description: "",
                              price: 0,
                              available: true,
                            },
                          ],
                        };
                        setFormData({ ...formData, groups: newGroups });
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      + Adicionar opção
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    groups: [...formData.groups, emptyGroup()],
                  });
                }}
                className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:text-purple-800 text-sm font-medium transition-colors"
              >
                + Adicionar grupo de personalização
              </button>
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
