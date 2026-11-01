import { LIGA } from './konfiguration';

const API_BASIS = 'https://api.openligadb.de';

/** Alle verwendeten Endpunkte der OpenLigaDB an einer Stelle */
export const apiUrls = {
  tabelle: (saison: number): string => `${API_BASIS}/getbltable/${LIGA}/${saison}`,
  spieltag: (saison: number, nr: number): string =>
    `${API_BASIS}/getmatchdata/${LIGA}/${saison}/${nr}`,
  alleSpiele: (saison: number): string => `${API_BASIS}/getmatchdata/${LIGA}/${saison}`,
  aktuellerSpieltag: (): string => `${API_BASIS}/getcurrentgroup/${LIGA}`,
  direkteDuelle: (teamId1: number, teamId2: number): string =>
    `${API_BASIS}/getmatchdata/${teamId1}/${teamId2}`,
};

// Kurzzeit-Cache: Die OpenLigaDB wird ehrenamtlich betrieben. Wer zwischen den
// Seiten wechselt, soll dieselben Daten nicht sekündlich neu anfordern.
const CACHE_DAUER_MS = 2 * 60 * 1000;
const cache = new Map<string, { zeitpunkt: number; daten: unknown }>();

/**
 * Generischer Fetch-Wrapper (vgl. Modul 03, Abschnitt 4.4):
 * prüft den HTTP-Status, liefert typisierte Daten und einheitliche Fehlermeldungen.
 */
export async function fetchJSON<T>(
  url: string,
  signal?: AbortSignal,
  nutzeCache: boolean = true,
): Promise<T> {
  const eintrag = cache.get(url);
  if (nutzeCache && eintrag && Date.now() - eintrag.zeitpunkt < CACHE_DAUER_MS) {
    return eintrag.daten as T;
  }

  let antwort: Response;
  try {
    antwort = await fetch(url, { signal });
  } catch (fehler) {
    // Abbruch durch die Komponente unverändert weiterreichen
    if (signal?.aborted) throw fehler;
    throw new Error('Keine Verbindung zur Fußball-Datenbank. Bitte Internetverbindung prüfen.');
  }

  if (!antwort.ok) {
    throw new Error(`Die Fußball-Datenbank meldet einen Fehler (HTTP ${antwort.status}).`);
  }

  const daten = (await antwort.json()) as T;
  cache.set(url, { zeitpunkt: Date.now(), daten });
  return daten;
}
