// Hilfsfunktionen zur Anzeige von Datum und Uhrzeit (österreichisches Format)

/** z. B. "Fr., 30.10.2026" */
export function formatiereDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** z. B. "30.10." – kompakt für Listen */
export function formatiereDatumKurz(iso: string): string {
  return new Date(iso).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
}

/** z. B. "20:30" */
export function formatiereUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
}
