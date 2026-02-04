/**
 * Formata um valor monetário no padrão brasileiro (R$ 1.500,00)
 * @param {number} price - O valor a ser formatado
 * @returns {string} O valor formatado
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

/**
 * Converte código de estado numérico para sigla UF
 * @param {number|string} state - Código ou sigla do estado
 * @returns {string} Sigla do estado
 */
export const getStateDisplay = (state) => {
  if (typeof state === "string") return state;

  const stateCodeToUF = {
    11: "RO",
    12: "AC",
    13: "AM",
    14: "RR",
    15: "PA",
    16: "AP",
    17: "TO",
    21: "MA",
    22: "PI",
    23: "CE",
    24: "RN",
    25: "PB",
    26: "PE",
    27: "AL",
    28: "SE",
    29: "BA",
    31: "MG",
    32: "ES",
    33: "RJ",
    35: "SP",
    41: "PR",
    42: "SC",
    43: "RS",
    50: "MS",
    51: "MT",
    52: "GO",
    53: "DF",
  };

  return stateCodeToUF[state] || state;
};
