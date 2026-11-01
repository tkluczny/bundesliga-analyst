import type { ApiSpiel } from '../typen/openligadb';

export interface Spielstand {
  tore1: number;
  tore2: number;
}

const ERGEBNIS_TYP_HALBZEIT = 1;
const ERGEBNIS_TYP_ENDE = 2;

/** Sucht ein Ergebnis eines bestimmten Typs (laut OpenLigaDB-Doku über resultTypeID) */
function ergebnisNachTyp(spiel: ApiSpiel, typ: number): Spielstand | null {
  const ergebnis = spiel.matchResults.find((e) => e.resultTypeID === typ);
  if (!ergebnis || ergebnis.pointsTeam1 === null || ergebnis.pointsTeam2 === null) return null;
  return { tore1: ergebnis.pointsTeam1, tore2: ergebnis.pointsTeam2 };
}

/** Endergebnis eines Spiels, oder null wenn noch keines vorliegt */
export function endergebnis(spiel: ApiSpiel): Spielstand | null {
  return ergebnisNachTyp(spiel, ERGEBNIS_TYP_ENDE);
}

/** Halbzeitergebnis eines Spiels, oder null */
export function halbzeitergebnis(spiel: ApiSpiel): Spielstand | null {
  return ergebnisNachTyp(spiel, ERGEBNIS_TYP_HALBZEIT);
}

export type SpielStatus = 'beendet' | 'laufend' | 'geplant';

/** Ein Spiel gilt als laufend, wenn es begonnen hat, aber noch nicht beendet ist */
export function spielStatus(spiel: ApiSpiel, jetzt: Date = new Date()): SpielStatus {
  if (spiel.matchIsFinished) return 'beendet';
  return new Date(spiel.matchDateTimeUTC) <= jetzt ? 'laufend' : 'geplant';
}
