"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IMaskInput } from "react-imask";
import { CldUploadWidget } from "next-cloudinary";
import LocationCapture from "./LocationCapture";
import CategoryAutocomplete from "./CategoryAutocomplete";

export default function StoreForm({
  onSubmit,
  onCancel,
  initialData = null,
  states = {},
  cities = [],
  submitButtonText = "Cadastrar Loja",
  canSelectOwner = false, // Se true, mostra campo de seleção de proprietário
  currentUserId = null, // ID do usuário logado
  isAdmin = false, // Se true, permite editar proprietário em lojas existentes
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTimeout, setUploadTimeout] = useState(null);
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [zipCodeLoading, setZipCodeLoading] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);

  // Estados para seleção de proprietário
  const [ownerId, setOwnerId] = useState(""); // ID do proprietário selecionado
  const [ownerEmail, setOwnerEmail] = useState(""); // Email para busca
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [ownerFound, setOwnerFound] = useState(null);
  const [ownerError, setOwnerError] = useState("");

  // Handler para mudanças de localização do componente LocationCapture
  const handleLocationChange = ({ latitude: lat, longitude: lng }) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // Função para buscar usuário por email
  const searchOwnerByEmail = async () => {
    if (!ownerEmail.trim()) {
      setOwnerError("Digite um e-mail válido");
      return;
    }

    setSearchingOwner(true);
    setOwnerError("");
    setOwnerFound(null);

    try {
      const response = await fetch(
        `/api/users/search?email=${encodeURIComponent(ownerEmail)}`,
      );
      const data = await response.json();

      if (response.ok && data.user) {
        setOwnerFound(data.user);
        setOwnerId(data.user.id);
      } else {
        setOwnerError(data.error || "Usuário não encontrado");
        setOwnerId("");
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      setOwnerError("Erro ao buscar usuário");
      setOwnerId("");
    } finally {
      setSearchingOwner(false);
    }
  };

  // Função para limpar seleção de proprietário
  const clearOwnerSelection = () => {
    setOwnerEmail("");
    setOwnerFound(null);
    setOwnerId("");
    setOwnerError("");
  };

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

  // Sincronizar valores quando initialData muda (para edição)
  useEffect(() => {
    if (initialData) {
      console.log("StoreForm - initialData:", initialData);
      console.log("StoreForm - initialData.image:", initialData.image);
      setName(initialData.name || "");
      setSlug(initialData.slug || "");
      setDescription(initialData.description || "");
      setImage(initialData.image || "");
      console.log("StoreForm - image state set to:", initialData.image || "");
      setCategory(initialData.category || "");
      setCnpj(initialData.cnpj || "");
      setPhone(initialData.phone || "");
      setEmail(initialData.email || "");
      setMinimumOrder(initialData.minimumOrder || "");
      setDeliveryFee(initialData.deliveryFee || "");
      setFreeShippingThreshold(initialData.freeShippingThreshold || "");
      setZipCode(initialData.address?.zipCode || "");
      setStreet(initialData.address?.street || "");
      setNumber(initialData.address?.number || "");
      setComplement(initialData.address?.complement || "");
      setNeighborhood(initialData.address?.neighborhood || "");
      setCity(initialData.address?.city || "");
      setState(initialData.address?.state || "");
      setLatitude(
        initialData.address?.latitude !== null &&
          initialData.address?.latitude !== undefined
          ? initialData.address.latitude.toString()
          : "",
      );
      setLongitude(
        initialData.address?.longitude !== null &&
          initialData.address?.longitude !== undefined
          ? initialData.address.longitude.toString()
          : "",
      );

      // Carregar dados do proprietário no modo edição
      if (initialData.owner) {
        setOwnerFound(initialData.owner);
        setOwnerId(initialData.userId);
      }
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

  const handleZipCodeChange = async (value) => {
    setZipCode(value);
    const cleanZipCode = value.replace(/\D/g, "");

    if (cleanZipCode.length === 8) {
      setZipCodeLoading(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanZipCode}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          const stateCode = ufToStateCode[data.uf];
          const cityData = cities.find(
            (city) =>
              city.name.toLowerCase() === data.localidade.toLowerCase() &&
              city.state_id.toString() === stateCode,
          );

          // Só atualizar se a API retornar valores
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) {
            setCity(cityData ? cityData.name : data.localidade);
          }
          if (stateCode) setState(stateCode);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setZipCodeLoading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      name,
      slug,
      description,
      image,
      category,
      cnpj,
      phone,
      email,
      minimumOrder: minimumOrder ? parseFloat(minimumOrder) : null,
      deliveryFee: deliveryFee ? parseFloat(deliveryFee) : null,
      freeShippingThreshold: freeShippingThreshold
        ? parseFloat(freeShippingThreshold)
        : null,
      address: {
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    };

    // Adicionar ownerId se for selecionado (gerente/admin criando para outro usuário)
    // Ou se for admin editando loja existente e mudou o proprietário
    if (canSelectOwner && ownerId && ownerId !== currentUserId) {
      formData.ownerId = ownerId;
    } else if (
      isAdmin &&
      initialData &&
      ownerId &&
      ownerId !== initialData.userId
    ) {
      formData.ownerId = ownerId;
    }

    onSubmit(formData);
  };

  const checkSlugAvailability = async () => {
    if (!slug.trim()) return;

    setSlugChecking(true);
    try {
      const response = await fetch(
        `/api/stores/check-slug?slug=${encodeURIComponent(slug)}`,
      );
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch (error) {
      console.error("Erro ao verificar slug:", error);
      setSlugAvailable(false);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSlugChange = (value) => {
    // Permitir apenas letras minúsculas e números
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setSlug(cleanValue);
    setSlugAvailable(null); // Reset availability check when slug changes
  };

  const copyStoreLink = () => {
    if (slug) {
      navigator.clipboard.writeText(`https://nossolocal.com.br/lojas/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
  };

  const formContent = (
    <div className="space-y-6">
      {/* Seleção de Proprietário (apenas para gerentes/admins na criação, ou admin na edição) */}
      {(canSelectOwner || (isAdmin && initialData)) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Proprietário da Loja
          </h3>

          {!ownerFound ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Busque o usuário proprietário da loja pelo e-mail
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), searchOwnerByEmail())
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                  disabled={searchingOwner}
                />
                <button
                  type="button"
                  onClick={searchOwnerByEmail}
                  disabled={searchingOwner || !ownerEmail.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {searchingOwner ? "Buscando..." : "Buscar"}
                </button>
              </div>
              {ownerError && (
                <p className="text-red-600 text-sm mt-2">{ownerError}</p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-green-300 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Proprietário selecionado:
                  </p>
                  <p className="font-semibold text-gray-800">
                    {ownerFound.name || ownerFound.email}
                  </p>
                  <p className="text-sm text-gray-600">{ownerFound.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearOwnerSelection}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Alterar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Nome da Loja */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Loja * - É assim que sua loja aparecerá para os clientes.
            Você pode atualizar este nome a qualquer momento.
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite o nome da sua loja"
            required
          />
        </div>

        {/* Slug da Loja */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identificação Única da Loja * - Esta identificação será usada no
            link da sua loja e não pode ser alterada depois.
          </label>
          {initialData && slug ? (
            // Mostrar link da loja quando estiver editando
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">Link da sua loja:</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-100 p-4 rounded-lg font-mono text-gray-900 break-all">
                  https://nossolocal.com.br/lojas/{slug}
                </div>
                <button
                  type="button"
                  onClick={copyStoreLink}
                  className="bg-blue-600 text-white px-4 py-4 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  title="Copiar link da loja"
                >
                  {copied ? (
                    <span className="flex items-center">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center">
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Link copiado para a área de transferência!
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                A identificação única não pode ser alterada após a criação da
                loja.
              </p>
            </div>
          ) : (
            // Mostrar input e botão verificar quando estiver criando
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    slugAvailable === true
                      ? "border-green-500"
                      : slugAvailable === false
                        ? "border-red-500"
                        : "border-gray-300"
                  }`}
                  placeholder="exemplo-loja123"
                  required
                />
                <button
                  type="button"
                  onClick={checkSlugAvailability}
                  disabled={!slug.trim() || slugChecking}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {slugChecking ? "Verificando..." : "Verificar"}
                </button>
              </div>
              {slugAvailable === true && (
                <p className="text-green-600 text-sm mt-1">
                  ✓ Identificação disponível
                </p>
              )}
              {slugAvailable === false && (
                <p className="text-red-600 text-sm mt-1">
                  ✗ Identificação já em uso
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Use apenas letras minúsculas e números. Esta identificação será
                usada na URL da sua loja.
              </p>
            </>
          )}
        </div>

        {/* Descrição */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descreva sua loja (opcional)"
          />
        </div>

        {/* Imagem da Loja */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagem da Loja
          </label>
          {image && (
            <div className="mb-4">
              <div className="relative inline-block">
                <Image
                  src={image || "/no-image.png"}
                  alt="Pré-visualização da imagem da loja"
                  width={192}
                  height={192}
                  className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
                  title="Remover imagem"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Imagem carregada com sucesso
              </p>
            </div>
          )}
          <CldUploadWidget
            uploadPreset="ml_default"
            options={{
              folder: "tiagodelivery/stores",
              multiple: false,
              maxFiles: 1,
            }}
            onUpload={(result) => {
              console.log("onUpload - Event:", result.event);
              console.log("onUpload - Full result:", result);

              // Resetar loading apenas no evento de sucesso
              if (result.event === "success") {
                console.log("Upload successful! URL:", result.info.secure_url);
                setImage(result.info.secure_url);
                setUploadingImage(false);

                // Limpar timeout
                if (uploadTimeout) {
                  clearTimeout(uploadTimeout);
                  setUploadTimeout(null);
                }
              }
            }}
            onQueuesEnd={(result, { widget }) => {
              console.log("onQueuesEnd called - Full result:", result);
              console.log("result.info:", result?.info);
              console.log("result.data:", result?.data);

              // Limpar timeout
              if (uploadTimeout) {
                clearTimeout(uploadTimeout);
                setUploadTimeout(null);
              }

              // Tentar múltiplas formas de obter a URL da imagem
              let imageUrl = null;

              // 1. Tentar result.info.files[0].uploadInfo.secure_url (estrutura correta baseada nos logs)
              if (
                result?.info?.files &&
                result.info.files.length > 0 &&
                result.info.files[0]?.uploadInfo?.secure_url
              ) {
                imageUrl = result.info.files[0].uploadInfo.secure_url;
                console.log(
                  "Image URL from result.info.files[0].uploadInfo.secure_url:",
                  imageUrl,
                );
              }
              // 2. Tentar result.info.secure_url (estrutura padrão)
              else if (result?.info?.secure_url) {
                imageUrl = result.info.secure_url;
                console.log("Image URL from result.info.secure_url:", imageUrl);
              }
              // 3. Tentar result.data.files (quando há múltiplos arquivos)
              else if (result?.data?.files && result.data.files.length > 0) {
                imageUrl = result.data.files[0]?.uploadInfo?.secure_url;
                console.log("Image URL from result.data.files[0]:", imageUrl);
              }
              // 4. Tentar result.data.info.files (estrutura alternativa)
              else if (
                result?.data?.info?.files &&
                result.data.info.files.length > 0 &&
                result.data.info.files[0]?.uploadInfo?.secure_url
              ) {
                imageUrl = result.data.info.files[0].uploadInfo.secure_url;
                console.log(
                  "Image URL from result.data.info.files[0]:",
                  imageUrl,
                );
              }
              // 5. Tentar result.data.info (estrutura alternativa)
              else if (result?.data?.info?.secure_url) {
                imageUrl = result.data.info.secure_url;
                console.log(
                  "Image URL from result.data.info.secure_url:",
                  imageUrl,
                );
              }

              if (imageUrl) {
                console.log("Setting image from onQueuesEnd:", imageUrl);
                setImage(imageUrl);
                setUploadingImage(false);
              } else {
                console.error(
                  "No image URL found in onQueuesEnd. Full result:",
                  JSON.stringify(result),
                );
                // Resetar loading mesmo sem imagem
                setUploadingImage(false);
              }
            }}
            onError={(error) => {
              console.error("Upload error:", error);
              console.log("Clearing upload timeout due to error");
              if (uploadTimeout) {
                clearTimeout(uploadTimeout);
                setUploadTimeout(null);
              }
              setUploadingImage(false);
            }}
            onClose={() => {
              console.log(
                "Widget closed - uploadingImage:",
                uploadingImage,
                "- image:",
                image,
              );
              // onQueuesEnd já deve ter sido chamado, então apenas garantir reset
              setTimeout(() => {
                if (uploadingImage) {
                  console.log("Force resetting loading state on close");
                  setUploadingImage(false);
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
                console.log("Opening Cloudinary widget");

                // Resetar estado antes de abrir
                if (uploadTimeout) {
                  clearTimeout(uploadTimeout);
                }

                setUploadingImage(true);

                // Timeout de segurança - resetar loading após 30 segundos
                const timeout = setTimeout(() => {
                  console.log("Upload timeout - resetting loading state");
                  setUploadingImage(false);
                }, 30000);
                setUploadTimeout(timeout);

                open();
              };
              return (
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={uploadingImage}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {uploadingImage ? (
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
                          {image ? "Alterar Imagem" : "Selecionar Imagem"}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            }}
          </CldUploadWidget>
          <p className="mt-1 text-sm text-gray-500">
            Faça upload de uma imagem para representar sua loja (PNG, JPG até
            10MB)
          </p>
        </div>

        {/* Tipo de loja */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de loja *
          </label>
          <CategoryAutocomplete
            value={category}
            onChange={setCategory}
            required
          />
        </div>

        {/* CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ *
          </label>
          <IMaskInput
            mask="00.000.000/0000-00"
            value={cnpj}
            onAccept={(value) => setCnpj(value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="00.000.000/0000-00"
            required
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone / WhatsApp *
            <span className="block text-xs text-gray-500 font-normal mt-1">
              Este número será usado como link clicável para mensagens
              direcionadas em várias partes do site
            </span>
          </label>
          <IMaskInput
            mask="(00) 00000-0000"
            value={phone}
            onAccept={(value) => setPhone(value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(11) 99999-9999"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email da loja *
            <p className="text-xs text-gray-500 mt-1">
              Os pedidos chegarão neste e-mail.
            </p>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contato@sualoja.com"
            required
          />
        </div>

        {/* Valor Mínimo de Compras */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mínimo de Compras (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={minimumOrder}
            onChange={(e) => setMinimumOrder(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Taxa de Entrega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taxa de Entrega (R$)
            <p className="text-xs text-gray-500 mt-1">
              Válido apenas para a cidade da loja.
            </p>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Valor Mínimo para Frete Grátis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mínimo para Frete Grátis (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Endereço da Loja */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Endereço da Loja
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Usado para quando os clientes buscam o pedido na loja.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* CEP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP *
            </label>
            <div className="relative">
              <IMaskInput
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
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setCity(""); // Limpar cidade quando estado muda
              }}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione o estado</option>
              {Object.entries(states)
                .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
                .map(([code, name]) => (
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

          {/* Coordenadas Geográficas */}
          <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900">
                Coordenadas Geográficas (Opcional)
              </h5>
              <p className="text-xs text-gray-500 mt-1">
                Usado para direcionar os visitantes do site para a sua loja.
                Capture automaticamente ou insira manualmente.
              </p>
            </div>
            <LocationCapture
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
            />
          </div>
        </div>
      </div>

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

  if (submitButtonText) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {formContent}
      </form>
    );
  }

  return formContent;
}
