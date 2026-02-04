"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

export default function CategoryAutocomplete({ value, onChange, required }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  // Carregar e processar dados do CNAE
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(
          "/CNAE_Subclasses_2_3_Estrutura_Detalhada.json",
        );
        const data = await response.json();

        // Processar o JSON para extrair apenas as subclasses (mais específicas)
        const items = data["Estrutura Det. CNAE Subclass2.3"];
        const processedCategories = [];

        items.forEach((item) => {
          if (item && item.Column6) {
            // Column6 tem a descrição
            processedCategories.push({
              value: item.Column6,
              label: item.Column6,
            });
          }
        });

        setOptions(processedCategories);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar categorias CNAE:", error);
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Sincronizar selectedOption com value (quando editando loja existente)
  useEffect(() => {
    if (value && options.length > 0) {
      const found = options.find((opt) => opt.value === value);
      setSelectedOption(found || null);
    }
  }, [value, options]);

  const handleChange = (selected) => {
    setSelectedOption(selected);
    onChange(selected ? selected.value : "");
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "48px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? "#dbeafe"
          : "white",
      color: state.isSelected ? "white" : "#111827",
      cursor: "pointer",
      padding: "12px",
    }),
  };

  return (
    <div>
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={options}
        isLoading={loading}
        isSearchable
        isClearable
        placeholder="Digite para buscar (ex: restaurante, padaria, comércio...)"
        noOptionsMessage={() => "Nenhuma categoria encontrada"}
        loadingMessage={() => "Carregando categorias..."}
        styles={customStyles}
        required={required}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
}
