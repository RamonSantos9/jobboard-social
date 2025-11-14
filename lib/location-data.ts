// Dados estáticos de países e localidades (para países não-Brasil)

export interface Country {
  name: string;
  code: string;
}

export interface State {
  name: string;
  code: string;
}

export interface City {
  name: string;
}

export const countries: Country[] = [
  { name: "Brasil", code: "BR" },
  { name: "Argentina", code: "AR" },
  { name: "Estados Unidos", code: "US" },
  { name: "Portugal", code: "PT" },
  { name: "Espanha", code: "ES" },
  { name: "França", code: "FR" },
  { name: "Reino Unido", code: "GB" },
  { name: "Alemanha", code: "DE" },
  { name: "Itália", code: "IT" },
  { name: "México", code: "MX" },
  { name: "Chile", code: "CL" },
  { name: "Colômbia", code: "CO" },
  { name: "Peru", code: "PE" },
  { name: "Uruguai", code: "UY" },
  { name: "Paraguai", code: "PY" },
];

export const staticLocationData: Record<string, { states: State[]; cities: Record<string, City[]> }> = {
  AR: {
    states: [
      { name: "Buenos Aires", code: "BA" },
      { name: "Córdoba", code: "CB" },
      { name: "Santa Fe", code: "SF" },
      { name: "Mendoza", code: "MZ" },
      { name: "Tucumán", code: "TU" },
    ],
    cities: {
      BA: [{ name: "Buenos Aires" }, { name: "La Plata" }, { name: "Mar del Plata" }],
      CB: [{ name: "Córdoba" }, { name: "Villa María" }],
      SF: [{ name: "Rosário" }, { name: "Santa Fe" }],
      MZ: [{ name: "Mendoza" }],
      TU: [{ name: "San Miguel de Tucumán" }],
    },
  },
  US: {
    states: [
      { name: "California", code: "CA" },
      { name: "New York", code: "NY" },
      { name: "Texas", code: "TX" },
      { name: "Florida", code: "FL" },
      { name: "Illinois", code: "IL" },
    ],
    cities: {
      CA: [{ name: "Los Angeles" }, { name: "San Francisco" }, { name: "San Diego" }],
      NY: [{ name: "New York" }, { name: "Buffalo" }],
      TX: [{ name: "Houston" }, { name: "Dallas" }, { name: "Austin" }],
      FL: [{ name: "Miami" }, { name: "Tampa" }, { name: "Orlando" }],
      IL: [{ name: "Chicago" }],
    },
  },
  PT: {
    states: [
      { name: "Lisboa", code: "LI" },
      { name: "Porto", code: "PO" },
      { name: "Braga", code: "BR" },
      { name: "Coimbra", code: "CO" },
    ],
    cities: {
      LI: [{ name: "Lisboa" }, { name: "Cascais" }, { name: "Sintra" }],
      PO: [{ name: "Porto" }, { name: "Vila Nova de Gaia" }],
      BR: [{ name: "Braga" }],
      CO: [{ name: "Coimbra" }],
    },
  },
  ES: {
    states: [
      { name: "Madrid", code: "MD" },
      { name: "Barcelona", code: "BC" },
      { name: "Valência", code: "VL" },
      { name: "Sevilha", code: "SV" },
    ],
    cities: {
      MD: [{ name: "Madrid" }],
      BC: [{ name: "Barcelona" }],
      VL: [{ name: "Valência" }],
      SV: [{ name: "Sevilha" }],
    },
  },
  FR: {
    states: [
      { name: "Île-de-France", code: "IDF" },
      { name: "Provence-Alpes-Côte d'Azur", code: "PAC" },
      { name: "Auvergne-Rhône-Alpes", code: "ARA" },
    ],
    cities: {
      IDF: [{ name: "Paris" }],
      PAC: [{ name: "Marselha" }, { name: "Nice" }],
      ARA: [{ name: "Lyon" }],
    },
  },
  GB: {
    states: [
      { name: "Inglaterra", code: "EN" },
      { name: "Escócia", code: "SC" },
      { name: "País de Gales", code: "WL" },
    ],
    cities: {
      EN: [{ name: "Londres" }, { name: "Manchester" }, { name: "Birmingham" }],
      SC: [{ name: "Edimburgo" }, { name: "Glasgow" }],
      WL: [{ name: "Cardiff" }],
    },
  },
  DE: {
    states: [
      { name: "Baviera", code: "BY" },
      { name: "Berlim", code: "BE" },
      { name: "Hamburgo", code: "HH" },
    ],
    cities: {
      BY: [{ name: "Munique" }],
      BE: [{ name: "Berlim" }],
      HH: [{ name: "Hamburgo" }],
    },
  },
  IT: {
    states: [
      { name: "Lombardia", code: "LO" },
      { name: "Lácio", code: "LA" },
      { name: "Campânia", code: "CA" },
    ],
    cities: {
      LO: [{ name: "Milão" }],
      LA: [{ name: "Roma" }],
      CA: [{ name: "Nápoles" }],
    },
  },
  MX: {
    states: [
      { name: "Cidade do México", code: "CM" },
      { name: "Jalisco", code: "JA" },
      { name: "Nuevo León", code: "NL" },
    ],
    cities: {
      CM: [{ name: "Cidade do México" }],
      JA: [{ name: "Guadalajara" }],
      NL: [{ name: "Monterrey" }],
    },
  },
  CL: {
    states: [
      { name: "Região Metropolitana de Santiago", code: "RM" },
      { name: "Valparaíso", code: "VA" },
    ],
    cities: {
      RM: [{ name: "Santiago" }],
      VA: [{ name: "Valparaíso" }],
    },
  },
  CO: {
    states: [
      { name: "Cundinamarca", code: "CU" },
      { name: "Antioquia", code: "AN" },
    ],
    cities: {
      CU: [{ name: "Bogotá" }],
      AN: [{ name: "Medellín" }],
    },
  },
  PE: {
    states: [
      { name: "Lima", code: "LI" },
    ],
    cities: {
      LI: [{ name: "Lima" }],
    },
  },
  UY: {
    states: [
      { name: "Montevidéu", code: "MO" },
    ],
    cities: {
      MO: [{ name: "Montevidéu" }],
    },
  },
  PY: {
    states: [
      { name: "Asunción", code: "AS" },
    ],
    cities: {
      AS: [{ name: "Asunción" }],
    },
  },
};

