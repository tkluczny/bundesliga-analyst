// App-eigene Typen, die aus den API-Rohdaten berechnet werden

/** S = Sieg, U = Unentschieden, N = Niederlage */
export type SpielAusgang = 'S' | 'U' | 'N';

/** Ein beendetes Spiel aus Sicht eines bestimmten Teams */
export interface TeamSpiel {
  spielId: number;
  datum: string;
  spieltag: number;
  gegner: string;
  gegnerId: number;
  heim: boolean;
  toreEigen: number;
  toreGegner: number;
  ausgang: SpielAusgang;
}

export interface Bilanz {
  spiele: number;
  siege: number;
  unentschieden: number;
  niederlagen: number;
  tore: number;
  gegentore: number;
}

export interface TeamStatistik {
  gesamt: Bilanz;
  heim: Bilanz;
  auswaerts: Bilanz;
  /** Die letzten (bis zu) fünf Ergebnisse, ältestes zuerst */
  form: SpielAusgang[];
}

export interface Torschuetze {
  name: string;
  tore: number;
}

export interface DuellSpiel {
  spielId: number;
  datum: string;
  saison: number;
  heimTeam: string;
  gastTeam: string;
  toreHeim: number;
  toreGast: number;
}

export interface DuellBilanz {
  spiele: number;
  siegeTeam1: number;
  siegeTeam2: number;
  unentschieden: number;
  /** Die jüngsten Begegnungen, neueste zuerst */
  letzteSpiele: DuellSpiel[];
}
