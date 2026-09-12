import { AUTHOR_DEMONS } from './author-demons.js';

/** Only cost fields from the explicitly authorized JSON; this module installs no gameplay rules. */
export interface AuthorDemonCostSourceRow {
  readonly sourceName: string;
  readonly normalizedName: string;
  readonly costo: number | null;
  readonly costoTipo: string | null;
  readonly costoTipoMinimo: number | null;
  readonly rawFields: Readonly<{ costo?: unknown; costo_tipo?: unknown; costo_tipo_minimo?: unknown }>;
  readonly source: {
    readonly kind: 'author-authorized-cost-json'; readonly originalPath: string; readonly path: string;
    readonly row: number; readonly jsonPointer: string; readonly locator: string; readonly sha256: string;
  };
}
export interface AuthorDemonCostMatch extends AuthorDemonCostSourceRow {
  readonly authorDemonId: string;
  readonly authorName: string;
  readonly match: 'normalized-name';
}
export interface AuthorDemonCostGap {
  readonly authorDemonId: string;
  readonly name: string;
  readonly status: 'missing' | 'unconfirmed-alias' | 'ambiguous-name';
  readonly candidateSourceNames: readonly string[];
  readonly reason: string;
}
export function normalizeDemonCostName(name: string): string {
  return name.normalize('NFKC').toUpperCase().replace(/[\s'’‘ʼ]+/gu, '');
}

export const AUTHOR_DEMON_COST_SOURCE = Object.freeze({
  "id": "author-demon-costs-2026-09-10",
  "version": "author-demon-costs-2026-09-10-v1",
  "kind": "author-authorized-cost-json",
  "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
  "path": "docs/sources/author-demon-costs-2026-09-10.json",
  "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478",
  "byteLength": 20288,
  "rowCount": 60,
  "importedFields": [
    "costo",
    "costo_tipo",
    "costo_tipo_minimo"
  ],
  "matchingPolicy": "Confronto solo dei nomi: maiuscole/minuscole, spazi e apostrofi normalizzati; nessun confronto di effetti o somiglianza dei nomi.",
  "minimumUnit": "not-specified-in-json",
  "notice": "La fonte è autorizzata esclusivamente per i costi. Nomi, elementi, stelle, timing, note ed effetti della lista TSV restano invariati. Requisiti opzionali assenti rimangono null; un costo zero resta zero."
} as const);
const sourceRows: AuthorDemonCostSourceRow[] = [
  {
    "sourceName": "Badalischio",
    "normalizedName": "BADALISCHIO",
    "costo": 1,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 1,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 1,
      "jsonPointer": "/0",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/0",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Keukegen",
    "normalizedName": "KEUKEGEN",
    "costo": 0,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 0
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 2,
      "jsonPointer": "/1",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/1",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Nemea",
    "normalizedName": "NEMEA",
    "costo": 2,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 3,
      "jsonPointer": "/2",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/2",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Glatisant",
    "normalizedName": "GLATISANT",
    "costo": 2,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 4,
      "jsonPointer": "/3",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/3",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Euridice",
    "normalizedName": "EURIDICE",
    "costo": 2,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 5,
      "jsonPointer": "/4",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/4",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Nefele",
    "normalizedName": "NEFELE",
    "costo": 2,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 6,
      "jsonPointer": "/5",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/5",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Guaeko",
    "normalizedName": "GUAEKO",
    "costo": 2,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 7,
      "jsonPointer": "/6",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/6",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Selkie",
    "normalizedName": "SELKIE",
    "costo": 2,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 8,
      "jsonPointer": "/7",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/7",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Jakalope",
    "normalizedName": "JAKALOPE",
    "costo": 2,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 9,
      "jsonPointer": "/8",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/8",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Babi",
    "normalizedName": "BABI",
    "costo": 2,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 10,
      "jsonPointer": "/9",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/9",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Jinn",
    "normalizedName": "JINN",
    "costo": 2,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 11,
      "jsonPointer": "/10",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/10",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Banshee",
    "normalizedName": "BANSHEE",
    "costo": 3,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 12,
      "jsonPointer": "/11",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/11",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Zin",
    "normalizedName": "ZIN",
    "costo": 3,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 13,
      "jsonPointer": "/12",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/12",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Nekomata",
    "normalizedName": "NEKOMATA",
    "costo": 2,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 14,
      "jsonPointer": "/13",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/13",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Sibilla",
    "normalizedName": "SIBILLA",
    "costo": 2,
    "costoTipo": "ENERGIA_ETERE",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_ETERE",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 15,
      "jsonPointer": "/14",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/14",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Furie",
    "normalizedName": "FURIE",
    "costo": 3,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 16,
      "jsonPointer": "/15",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/15",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Stolas",
    "normalizedName": "STOLAS",
    "costo": 4,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 17,
      "jsonPointer": "/16",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/16",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Golem",
    "normalizedName": "GOLEM",
    "costo": 3,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 18,
      "jsonPointer": "/17",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/17",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Kappa",
    "normalizedName": "KAPPA",
    "costo": 3,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 19,
      "jsonPointer": "/18",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/18",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Humbaba",
    "normalizedName": "HUMBABA",
    "costo": 4,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 20,
      "jsonPointer": "/19",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/19",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Windigo",
    "normalizedName": "WINDIGO",
    "costo": 5,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 21,
      "jsonPointer": "/20",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/20",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Lilith",
    "normalizedName": "LILITH",
    "costo": 5,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 22,
      "jsonPointer": "/21",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/21",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Krampus",
    "normalizedName": "KRAMPUS",
    "costo": 4,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 23,
      "jsonPointer": "/22",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/22",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Glasyabo",
    "normalizedName": "GLASYABO",
    "costo": 3,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 24,
      "jsonPointer": "/23",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/23",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Echidna",
    "normalizedName": "ECHIDNA",
    "costo": 3,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 25,
      "jsonPointer": "/24",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/24",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Kelpie",
    "normalizedName": "KELPIE",
    "costo": 2,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 2,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 26,
      "jsonPointer": "/25",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/25",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Orias",
    "normalizedName": "ORIAS",
    "costo": 3,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 27,
      "jsonPointer": "/26",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/26",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Boto Cor De Rosa",
    "normalizedName": "BOTOCORDEROSA",
    "costo": 3,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 28,
      "jsonPointer": "/27",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/27",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Asmodeo",
    "normalizedName": "ASMODEO",
    "costo": 5,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 29,
      "jsonPointer": "/28",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/28",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Azael",
    "normalizedName": "AZAEL",
    "costo": 5,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 30,
      "jsonPointer": "/29",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/29",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Aamon",
    "normalizedName": "AAMON",
    "costo": 4,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 31,
      "jsonPointer": "/30",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/30",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Mammon",
    "normalizedName": "MAMMON",
    "costo": 5,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 32,
      "jsonPointer": "/31",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/31",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Huli",
    "normalizedName": "HULI",
    "costo": 3,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 33,
      "jsonPointer": "/32",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/32",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Yowie",
    "normalizedName": "YOWIE",
    "costo": 4,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 34,
      "jsonPointer": "/33",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/33",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Orione",
    "normalizedName": "ORIONE",
    "costo": 3,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 35,
      "jsonPointer": "/34",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/34",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Tengu",
    "normalizedName": "TENGU",
    "costo": 4,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 36,
      "jsonPointer": "/35",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/35",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Akerbeltz",
    "normalizedName": "AKERBELTZ",
    "costo": 3,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 3,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 37,
      "jsonPointer": "/36",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/36",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Ora",
    "normalizedName": "ORA",
    "costo": 4,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 38,
      "jsonPointer": "/37",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/37",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Raktabija",
    "normalizedName": "RAKTABIJA",
    "costo": 4,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 4
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 39,
      "jsonPointer": "/38",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/38",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Belzebu'",
    "normalizedName": "BELZEBU",
    "costo": 6,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 4,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 4
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 40,
      "jsonPointer": "/39",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/39",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Tifone",
    "normalizedName": "TIFONE",
    "costo": 6,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 5,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 5
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 41,
      "jsonPointer": "/40",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/40",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Hafgufa",
    "normalizedName": "HAFGUFA",
    "costo": 5,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 42,
      "jsonPointer": "/41",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/41",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Abraxas",
    "normalizedName": "ABRAXAS",
    "costo": 7,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 7,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 43,
      "jsonPointer": "/42",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/42",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Jalandhara",
    "normalizedName": "JALANDHARA",
    "costo": 4,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 44,
      "jsonPointer": "/43",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/43",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Samael",
    "normalizedName": "SAMAEL",
    "costo": 6,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 4,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 4
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 45,
      "jsonPointer": "/44",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/44",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Amy",
    "normalizedName": "AMY",
    "costo": 6,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 46,
      "jsonPointer": "/45",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/45",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Bafometto",
    "normalizedName": "BAFOMETTO",
    "costo": 5,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 47,
      "jsonPointer": "/46",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/46",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Beleth",
    "normalizedName": "BELETH",
    "costo": 5,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 48,
      "jsonPointer": "/47",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/47",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Behemoth",
    "normalizedName": "BEHEMOTH",
    "costo": 6,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 49,
      "jsonPointer": "/48",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/48",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Pazuzu",
    "normalizedName": "PAZUZU",
    "costo": 6,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 50,
      "jsonPointer": "/49",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/49",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Arimane",
    "normalizedName": "ARIMANE",
    "costo": 7,
    "costoTipo": "ENERGIA_ETERE",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 7,
      "costo_tipo": "ENERGIA_ETERE",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 51,
      "jsonPointer": "/50",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/50",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Lucifero",
    "normalizedName": "LUCIFERO",
    "costo": 5,
    "costoTipo": "ENERGIA_ETERE",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 5,
      "costo_tipo": "ENERGIA_ETERE",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 52,
      "jsonPointer": "/51",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/51",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Yaldabaoth",
    "normalizedName": "YALDABAOTH",
    "costo": 6,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 53,
      "jsonPointer": "/52",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/52",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Abaddon",
    "normalizedName": "ABADDON",
    "costo": 7,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 7,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 54,
      "jsonPointer": "/53",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/53",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Valak",
    "normalizedName": "VALAK",
    "costo": 7,
    "costoTipo": "ENERGIA_ARIA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 7,
      "costo_tipo": "ENERGIA_ARIA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 55,
      "jsonPointer": "/54",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/54",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Belfagor",
    "normalizedName": "BELFAGOR",
    "costo": 7,
    "costoTipo": "ENERGIA_TERRA",
    "costoTipoMinimo": 2,
    "rawFields": {
      "costo": 7,
      "costo_tipo": "ENERGIA_TERRA",
      "costo_tipo_minimo": 2
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 56,
      "jsonPointer": "/55",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/55",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Amduscias",
    "normalizedName": "AMDUSCIAS",
    "costo": 6,
    "costoTipo": "ENERGIA_FUOCO",
    "costoTipoMinimo": 3,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_FUOCO",
      "costo_tipo_minimo": 3
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 57,
      "jsonPointer": "/56",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/56",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "El Coco",
    "normalizedName": "ELCOCO",
    "costo": 1,
    "costoTipo": null,
    "costoTipoMinimo": null,
    "rawFields": {
      "costo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 58,
      "jsonPointer": "/57",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/57",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Leviatano",
    "normalizedName": "LEVIATANO",
    "costo": 6,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 4,
    "rawFields": {
      "costo": 6,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 4
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 59,
      "jsonPointer": "/58",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/58",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  },
  {
    "sourceName": "Kraken",
    "normalizedName": "KRAKEN",
    "costo": 4,
    "costoTipo": "ENERGIA_ACQUA",
    "costoTipoMinimo": 1,
    "rawFields": {
      "costo": 4,
      "costo_tipo": "ENERGIA_ACQUA",
      "costo_tipo_minimo": 1
    },
    "source": {
      "kind": "author-authorized-cost-json",
      "originalPath": "G:/Il mio Drive/cutes/2026/demonlord/demoni.json",
      "path": "docs/sources/author-demon-costs-2026-09-10.json",
      "row": 60,
      "jsonPointer": "/59",
      "locator": "docs/sources/author-demon-costs-2026-09-10.json#/59",
      "sha256": "1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478"
    }
  }
];

export const SOURCE_COST_ROWS: readonly AuthorDemonCostSourceRow[] = Object.freeze(sourceRows.map(row => Object.freeze({ ...row, rawFields: Object.freeze(row.rawFields), source: Object.freeze(row.source) })));
export const UNCONFIRMED_AUTHOR_DEMON_COST_ALIASES = Object.freeze([
  {
    "authorDemonId": "author-demon-kukegen",
    "authorName": "KUKEGEN",
    "sourceName": "Keukegen",
    "status": "unconfirmed"
  },
  {
    "authorDemonId": "author-demon-belleth",
    "authorName": "BELLETH",
    "sourceName": "Beleth",
    "status": "unconfirmed"
  }
] as const);
export const AUTHOR_DEMON_COSTS: readonly AuthorDemonCostMatch[] = Object.freeze(AUTHOR_DEMONS.flatMap(demon => {
  const candidates = SOURCE_COST_ROWS.filter(row => row.normalizedName === normalizeDemonCostName(demon.name));
  return candidates.length === 1 ? [Object.freeze({ ...candidates[0], authorDemonId: demon.id, authorName: demon.name, match: 'normalized-name' as const })] : [];
}));
export const AUTHOR_DEMON_COST_GAPS: readonly AuthorDemonCostGap[] = Object.freeze(AUTHOR_DEMONS.filter(demon => !AUTHOR_DEMON_COSTS.some(match => match.authorDemonId === demon.id)).map(demon => {
  const exact = SOURCE_COST_ROWS.filter(row => row.normalizedName === normalizeDemonCostName(demon.name));
  const alias = UNCONFIRMED_AUTHOR_DEMON_COST_ALIASES.find(alias => alias.authorDemonId === demon.id);
  const candidateSourceNames = Object.freeze(exact.length > 1 ? exact.map(row => row.sourceName) : alias ? [alias.sourceName] : []);
  return Object.freeze({ authorDemonId: demon.id, name: demon.name, status: exact.length > 1 ? 'ambiguous-name' as const : alias ? 'unconfirmed-alias' as const : 'missing' as const, candidateSourceNames,
    reason: exact.length > 1 ? 'Più righe della fonte condividono il nome normalizzato; nessun costo assegnato.' : alias ? 'Variante nominale proposta da confermare: nessun costo assegnato automaticamente.' : 'Nessun nome corrispondente nel JSON dei costi autorizzato; nessun valore ricavato da altre carte.',
  });
}));
export const SOURCE_COST_EXTRAS: readonly AuthorDemonCostSourceRow[] = Object.freeze(SOURCE_COST_ROWS.filter(row => !AUTHOR_DEMON_COSTS.some(match => match.source.jsonPointer === row.source.jsonPointer)));
export const AUTHOR_DEMON_COST_MATCH_SUMMARY = Object.freeze({
  authorRows: AUTHOR_DEMONS.length, sourceRows: SOURCE_COST_ROWS.length, matched: AUTHOR_DEMON_COSTS.length,
  gaps: AUTHOR_DEMON_COST_GAPS.length, missing: AUTHOR_DEMON_COST_GAPS.filter(gap => gap.status === 'missing').length,
  unconfirmedAliases: AUTHOR_DEMON_COST_GAPS.filter(gap => gap.status === 'unconfirmed-alias').length,
  ambiguousNames: AUTHOR_DEMON_COST_GAPS.filter(gap => gap.status === 'ambiguous-name').length, sourceExtras: SOURCE_COST_EXTRAS.length,
});
export function findAuthorDemonCost(authorDemonId: string): AuthorDemonCostMatch | undefined {
  return AUTHOR_DEMON_COSTS.find(match => match.authorDemonId === authorDemonId);
}
