import { useEffect } from 'react';

/**
 * Setzt den Titel im Browser-Tab. Hilft bei der Orientierung
 * und wird von Screenreadern beim Seitenwechsel vorgelesen.
 */
export function useSeitentitel(titel: string): void {
  useEffect(() => {
    document.title = `${titel} · Bundesliga-Analyst`;
  }, [titel]);
}
