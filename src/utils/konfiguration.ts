// Zentrale Einstellungen der App

/** Kürzel der 1. Bundesliga in der OpenLigaDB */
export const LIGA = 'bl1';

/** Anzahl der Spieltage einer Bundesliga-Saison (18 Teams, Hin- und Rückrunde) */
export const ANZAHL_SPIELTAGE = 34;

/**
 * Ermittelt die laufende Saison. Die OpenLigaDB benennt eine Saison nach
 * ihrem Startjahr (2026 = Saison 2026/27). Neue Saisonen beginnen im Juli.
 */
export function aktuelleSaison(heute: Date = new Date()): number {
  const jahr = heute.getFullYear();
  return heute.getMonth() >= 6 ? jahr : jahr - 1;
}

/** Saison als lesbarer Text, z. B. 2026 → "2026/27" */
export function saisonText(saison: number): string {
  return `${saison}/${String(saison + 1).slice(-2)}`;
}
