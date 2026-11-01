import { useEffect, useState } from 'react';
import { fetchJSON } from '../utils/api';

export interface UseFetchErgebnis<T> {
  daten: T | null;
  isLaden: boolean;
  fehler: string | null;
  neuLaden: () => void;
}

/** Ergebnis einer Anfrage, gemerkt zusammen mit der URL, zu der es gehört */
interface Antwort<T> {
  schluessel: string | null;
  daten: T | null;
  fehler: string | null;
}

/**
 * Wiederverwendbarer Hook zum Laden von API-Daten (vgl. Modul 04, Abschnitt 8.1).
 * Liefert die drei Zustände loading, success und error.
 *
 * - url = null bedeutet: (noch) nichts laden, z. B. bevor ein Formular abgeschickt wurde.
 * - Ändert sich die URL, wird automatisch neu geladen (Abhängigkeits-Array).
 * - Beim Verlassen der Seite wird eine laufende Anfrage abgebrochen (Cleanup).
 */
export function useFetch<T>(url: string | null): UseFetchErgebnis<T> {
  const [versuch, setVersuch] = useState<number>(0);
  const [antwort, setAntwort] = useState<Antwort<T>>({
    schluessel: null,
    daten: null,
    fehler: null,
  });

  // Jede Kombination aus URL und Ladeversuch bekommt einen eigenen Schlüssel
  const schluessel = url ? `${url}#${versuch}` : null;

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const anfrageSchluessel = `${url}#${versuch}`;

    // Beim ersten Versuch darf der Cache genutzt werden, "Neu laden" holt frische Daten
    fetchJSON<T>(url, controller.signal, versuch === 0)
      .then((daten) => {
        setAntwort({ schluessel: anfrageSchluessel, daten, fehler: null });
      })
      .catch((fehler: unknown) => {
        if (controller.signal.aborted) return; // Komponente nicht mehr aktiv
        setAntwort({
          schluessel: anfrageSchluessel,
          daten: null,
          fehler: fehler instanceof Error ? fehler.message : 'Unbekannter Fehler',
        });
      });

    // Cleanup: Anfrage abbrechen, wenn sich die URL ändert oder die Seite verlassen wird
    return () => controller.abort();
  }, [url, versuch]);

  // Gehört die gespeicherte Antwort zur aktuellen Anfrage? Sonst wird noch geladen.
  const istAktuell = antwort.schluessel === schluessel;

  return {
    daten: istAktuell ? antwort.daten : null,
    fehler: istAktuell ? antwort.fehler : null,
    isLaden: schluessel !== null && !istAktuell,
    neuLaden: () => setVersuch((alt) => alt + 1),
  };
}
