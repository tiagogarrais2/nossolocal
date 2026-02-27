"use client";

import { useState, useEffect, useMemo } from "react";
import { formatPrice } from "../lib/utils";

/**
 * Compute a deterministic hash string from the customizations object.
 * Used as part of the CartItem unique constraint.
 */
function computeCustomizationHash(customizations) {
  if (!customizations || Object.keys(customizations).length === 0) return "";
  // Sort keys for deterministic output
  const sorted = Object.keys(customizations)
    .sort()
    .reduce((acc, key) => {
      const val = customizations[key];
      // Sort arrays of selections within each group
      if (Array.isArray(val)) {
        acc[key] = [...val].sort((a, b) => {
          if (a.optionId && b.optionId)
            return a.optionId.localeCompare(b.optionId);
          if (a.name && b.name) return a.name.localeCompare(b.name);
          return 0;
        });
      } else {
        acc[key] = val;
      }
      return acc;
    }, {});
  // Simple hash based on JSON
  const str = JSON.stringify(sorted);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export { computeCustomizationHash };

export default function AssemblableProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  adding = false,
  editMode = false,
  initialCustomizations = null,
  initialQuantity = 1,
}) {
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");

  // Reset selections when product changes or modal opens
  // If editMode + initialCustomizations, reconstruct selections from saved data
  useEffect(() => {
    if (isOpen && product) {
      if (
        editMode &&
        initialCustomizations &&
        Object.keys(initialCustomizations).length > 0
      ) {
        const restored = {};
        product.groups?.forEach((group) => {
          const saved = initialCustomizations[group.id];
          if (!saved) {
            // No saved data for this group – use default
            if (group.type === "radio") restored[group.id] = null;
            else if (group.type === "checkbox") restored[group.id] = [];
            else if (group.type === "quantity") restored[group.id] = {};
            return;
          }
          if (group.type === "radio") {
            restored[group.id] = saved.selected?.[0]?.optionId || null;
          } else if (group.type === "checkbox") {
            restored[group.id] = (saved.selected || []).map((s) => s.optionId);
          } else if (group.type === "quantity") {
            const qtyMap = {};
            (saved.selected || []).forEach((s) => {
              qtyMap[s.optionId] = s.quantity || 1;
            });
            restored[group.id] = qtyMap;
          }
        });
        setSelections(restored);
        setQuantity(initialQuantity || 1);
        setObservations(initialCustomizations?._observations || "");
      } else {
        const initial = {};
        product.groups?.forEach((group) => {
          if (group.type === "radio") {
            initial[group.id] = null; // single selection
          } else if (group.type === "checkbox") {
            initial[group.id] = []; // array of optionIds
          } else if (group.type === "quantity") {
            initial[group.id] = {}; // { optionId: qty }
          }
        });
        setSelections(initial);
        setQuantity(1);
        setObservations("");
      }
    }
  }, [isOpen, product, editMode, initialCustomizations, initialQuantity]);

  // === Helpers for inter-group dependencies ===

  // Get the selected option name(s) from a parent group
  const getParentSelectionNames = (depConfig) => {
    if (!depConfig || depConfig.groupIndex === undefined) return [];
    const parentGroup = product.groups?.[depConfig.groupIndex];
    if (!parentGroup) return [];
    const parentSel = selections[parentGroup.id];
    if (!parentSel) return [];

    if (parentGroup.type === "radio") {
      const opt = parentGroup.options.find((o) => o.id === parentSel);
      return opt ? [opt.name] : [];
    } else if (parentGroup.type === "checkbox" && Array.isArray(parentSel)) {
      return parentSel
        .map((optId) => parentGroup.options.find((o) => o.id === optId)?.name)
        .filter(Boolean);
    } else if (
      parentGroup.type === "quantity" &&
      typeof parentSel === "object"
    ) {
      return Object.entries(parentSel)
        .filter(([, qty]) => qty > 0)
        .map(([optId]) => parentGroup.options.find((o) => o.id === optId)?.name)
        .filter(Boolean);
    }
    return [];
  };

  // Get effective min/max for a group (considering dependsOn)
  const getEffectiveConstraints = (group) => {
    if (!group.dependsOn?.rules) {
      return {
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
      };
    }
    const parentNames = getParentSelectionNames(group.dependsOn);
    if (parentNames.length === 0) {
      return {
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
      };
    }
    // For multi-select parents, use most permissive (highest max, highest min)
    let effectiveMin = 0;
    let effectiveMax = 1;
    let hasMatch = false;
    parentNames.forEach((name) => {
      const rule = group.dependsOn.rules[name];
      if (rule) {
        hasMatch = true;
        effectiveMin = Math.max(effectiveMin, rule.minSelections || 0);
        effectiveMax = Math.max(effectiveMax, rule.maxSelections || 1);
      }
    });
    return hasMatch
      ? { minSelections: effectiveMin, maxSelections: effectiveMax }
      : {
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
        };
  };

  // Get effective price for an option (considering priceMatrix)
  const getEffectivePrice = (option) => {
    if (!option.priceMatrix?.prices) return option.price || 0;
    const parentNames = getParentSelectionNames(option.priceMatrix);
    if (parentNames.length === 0) return option.price || 0;
    // For multi-select parents, use highest price
    let maxPrice = null;
    parentNames.forEach((name) => {
      if (option.priceMatrix.prices[name] !== undefined) {
        const p = option.priceMatrix.prices[name];
        if (maxPrice === null || p > maxPrice) maxPrice = p;
      }
    });
    return maxPrice !== null ? maxPrice : option.price || 0;
  };

  // Check if a group's parent dependency has a selection
  const isParentSelected = (group) => {
    if (!group.dependsOn) return true;
    return getParentSelectionNames(group.dependsOn).length > 0;
  };

  // Get the parent group name for display
  const getParentGroupName = (group) => {
    if (!group.dependsOn) return "";
    const parentGroup = product.groups?.[group.dependsOn.groupIndex];
    return parentGroup?.name || "";
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let total = product.price || 0;
    product.groups?.forEach((group) => {
      const sel = selections[group.id];
      if (!sel) return;

      if (group.type === "radio" && sel) {
        const opt = group.options.find((o) => o.id === sel);
        if (opt) total += getEffectivePrice(opt);
      } else if (group.type === "checkbox" && Array.isArray(sel)) {
        sel.forEach((optId) => {
          const opt = group.options.find((o) => o.id === optId);
          if (opt) total += getEffectivePrice(opt);
        });
      } else if (group.type === "quantity" && typeof sel === "object") {
        Object.entries(sel).forEach(([optId, qty]) => {
          const opt = group.options.find((o) => o.id === optId);
          if (opt && qty > 0) total += getEffectivePrice(opt) * qty;
        });
      }
    });
    return total * quantity;
  }, [product, selections, quantity]);

  // Validate all required groups
  const validationErrors = useMemo(() => {
    if (!product) return [];
    const errors = [];
    product.groups?.forEach((group) => {
      const sel = selections[group.id];
      const { minSelections, maxSelections } = getEffectiveConstraints(group);
      const parentOk = isParentSelected(group);

      if (group.required) {
        if (group.type === "radio" && !sel) {
          errors.push(`Selecione uma opção em "${group.name}"`);
        } else if (group.type === "checkbox") {
          const count = Array.isArray(sel) ? sel.length : 0;
          const reqMin = Math.max(1, minSelections);
          if (count < reqMin) {
            errors.push(`Selecione pelo menos ${reqMin} em "${group.name}"`);
          }
        } else if (group.type === "quantity") {
          const totalQty = sel
            ? Object.values(sel).reduce((s, q) => s + q, 0)
            : 0;
          const reqMin = Math.max(1, minSelections);
          if (totalQty < reqMin) {
            errors.push(`Selecione pelo menos ${reqMin} em "${group.name}"`);
          }
        }
      }

      // Max selections check (with dynamic max)
      if (
        group.type === "checkbox" &&
        Array.isArray(sel) &&
        sel.length > maxSelections
      ) {
        errors.push(`Máximo de ${maxSelections} seleções em "${group.name}"`);
      }
      if (group.type === "quantity" && sel) {
        const totalQty = Object.values(sel).reduce((s, q) => s + q, 0);
        if (totalQty > maxSelections) {
          errors.push(`Máximo de ${maxSelections} em "${group.name}"`);
        }
      }

      // Parent dependency not met
      if (group.dependsOn && !parentOk && group.required) {
        const parentName = getParentGroupName(group);
        // Only add if no other error for this group yet
        const hasGroupError = errors.some((e) => e.includes(`"${group.name}"`));
        if (!hasGroupError) {
          errors.push(
            `Selecione "${parentName}" primeiro para "${group.name}"`,
          );
        }
      }
    });
    return errors;
  }, [product, selections]);

  const isValid = validationErrors.length === 0;

  // Build customizations object for cart
  const buildCustomizations = () => {
    const customizations = {};
    product.groups?.forEach((group) => {
      const sel = selections[group.id];
      if (!sel) return;

      if (group.type === "radio" && sel) {
        const opt = group.options.find((o) => o.id === sel);
        if (opt) {
          customizations[group.id] = {
            groupName: group.name,
            type: "radio",
            selected: [
              {
                optionId: opt.id,
                name: opt.name,
                price: getEffectivePrice(opt),
              },
            ],
          };
        }
      } else if (
        group.type === "checkbox" &&
        Array.isArray(sel) &&
        sel.length > 0
      ) {
        customizations[group.id] = {
          groupName: group.name,
          type: "checkbox",
          selected: sel.map((optId) => {
            const opt = group.options.find((o) => o.id === optId);
            return {
              optionId: opt.id,
              name: opt.name,
              price: getEffectivePrice(opt),
            };
          }),
        };
      } else if (group.type === "quantity" && typeof sel === "object") {
        const items = Object.entries(sel)
          .filter(([, qty]) => qty > 0)
          .map(([optId, qty]) => {
            const opt = group.options.find((o) => o.id === optId);
            return {
              optionId: opt.id,
              name: opt.name,
              price: getEffectivePrice(opt),
              quantity: qty,
            };
          });
        if (items.length > 0) {
          customizations[group.id] = {
            groupName: group.name,
            type: "quantity",
            selected: items,
          };
        }
      }
    });
    return customizations;
  };

  const handleConfirm = () => {
    if (!isValid) return;
    const customizations = buildCustomizations();
    // Incluir observações nas customizações
    const trimmedObs = observations.trim();
    if (trimmedObs) {
      customizations._observations = trimmedObs;
    }
    const hash = computeCustomizationHash(customizations);
    onAddToCart({
      productId: product.id,
      quantity,
      customizations,
      customizationHash: hash,
    });
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-gray-500 mt-0.5">
                {product.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {product.groups?.map((group) => {
            const availableOptions = group.options.filter(
              (o) => o.available !== false,
            );
            const parentOk = isParentSelected(group);
            const { minSelections, maxSelections } =
              getEffectiveConstraints(group);
            return (
              <div key={group.id} className={!parentOk ? "opacity-50" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {group.name}
                    {group.required ? (
                      <span className="text-red-500 ml-1 text-xs font-normal">(Obrigatório)</span>
                    ) : (
                      <span className="text-gray-400 ml-1 text-xs font-normal">(Opcional)</span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {group.type === "radio" && "Escolha 1"}
                    {group.type === "checkbox" && `Até ${maxSelections}`}
                    {group.type === "quantity" && `Até ${maxSelections}`}
                  </span>
                </div>

                {!parentOk && group.dependsOn && (
                  <p className="text-xs text-amber-600 mb-2">
                    Selecione &quot;{getParentGroupName(group)}&quot; primeiro
                  </p>
                )}

                <div
                  className={`space-y-1.5 ${!parentOk ? "pointer-events-none" : ""}`}
                >
                  {availableOptions.map((option) => {
                    const effectivePrice = getEffectivePrice(option);
                    const hasPriceMatrix = !!option.priceMatrix?.prices;

                    if (group.type === "radio") {
                      const selected = selections[group.id] === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`group-${group.id}`}
                              checked={selected}
                              disabled={!parentOk}
                              onChange={() => {
                                setSelections((prev) => ({
                                  ...prev,
                                  [group.id]: option.id,
                                }));
                              }}
                              className="h-4 w-4 text-purple-600 border-gray-300"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {option.name}
                              </span>
                              {option.description && (
                                <p className="text-xs text-gray-500">
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {effectivePrice > 0 && (
                            <span className="text-sm text-green-600 font-medium whitespace-nowrap">
                              +{formatPrice(effectivePrice)}
                            </span>
                          )}
                          {hasPriceMatrix && !parentOk && (
                            <span className="text-xs text-gray-400 italic">
                              Variável
                            </span>
                          )}
                        </label>
                      );
                    }

                    if (group.type === "checkbox") {
                      const sel = selections[group.id] || [];
                      const checked = sel.includes(option.id);
                      const atMax = sel.length >= maxSelections && !checked;
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            atMax
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          } ${
                            checked
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={atMax || !parentOk}
                              onChange={() => {
                                setSelections((prev) => {
                                  const current = prev[group.id] || [];
                                  if (checked) {
                                    return {
                                      ...prev,
                                      [group.id]: current.filter(
                                        (id) => id !== option.id,
                                      ),
                                    };
                                  }
                                  return {
                                    ...prev,
                                    [group.id]: [...current, option.id],
                                  };
                                });
                              }}
                              className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {option.name}
                              </span>
                              {option.description && (
                                <p className="text-xs text-gray-500">
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {effectivePrice > 0 && (
                            <span className="text-sm text-green-600 font-medium whitespace-nowrap">
                              +{formatPrice(effectivePrice)}
                            </span>
                          )}
                          {hasPriceMatrix && !parentOk && (
                            <span className="text-xs text-gray-400 italic">
                              Variável
                            </span>
                          )}
                        </label>
                      );
                    }

                    if (group.type === "quantity") {
                      const sel = selections[group.id] || {};
                      const currentQty = sel[option.id] || 0;
                      const totalGroupQty = Object.values(sel).reduce(
                        (s, q) => s + q,
                        0,
                      );
                      const atMax = totalGroupQty >= maxSelections;
                      return (
                        <div
                          key={option.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            currentQty > 0
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-800">
                              {option.name}
                            </span>
                            {option.description && (
                              <p className="text-xs text-gray-500">
                                {option.description}
                              </p>
                            )}
                            {effectivePrice > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                +{formatPrice(effectivePrice)} cada
                              </span>
                            )}
                            {hasPriceMatrix && !parentOk && (
                              <span className="text-xs text-gray-400 italic">
                                Preço variável
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (currentQty <= 0) return;
                                setSelections((prev) => ({
                                  ...prev,
                                  [group.id]: {
                                    ...prev[group.id],
                                    [option.id]: currentQty - 1,
                                  },
                                }));
                              }}
                              disabled={currentQty <= 0}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (atMax || !parentOk) return;
                                setSelections((prev) => ({
                                  ...prev,
                                  [group.id]: {
                                    ...prev[group.id],
                                    [option.id]: currentQty + 1,
                                  },
                                }));
                              }}
                              disabled={atMax || !parentOk}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-600 text-white disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            );
          })}

          {/* Observações */}
          <div className="px-5 py-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: sem cebola, bem passado, trocar molho..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer - quantity, total, button */}
        <div className="p-5 border-t bg-gray-50 shrink-0 space-y-3">
          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Quantidade
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-600 text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="text-xs text-red-600 space-y-0.5">
              {validationErrors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || adding}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {adding ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {editMode ? "Atualizando..." : "Adicionando..."}
              </span>
            ) : editMode ? (
              `Atualizar ${formatPrice(totalPrice)}`
            ) : (
              `Adicionar ${formatPrice(totalPrice)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
