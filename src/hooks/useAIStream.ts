import { useCallback, useEffect, useRef, useState } from 'react';
import type { Nachricht } from '../typen/ai';
import { streamChat } from '../utils/aiStream';

export interface UseAIStreamErgebnis {
  text: string;
  isStreaming: boolean;
  fehler: string | null;
  wurdeAbgebrochen: boolean;
  starten: (nachrichten: Nachricht[]) => Promise<void>;
  abbrechen: () => void;
}

/**
 * Wiederverwendbarer Hook für gestreamte KI-Antworten (vgl. Modul 05, Abschnitt 4).
 * Kapselt Zustand, Streaming, Abbruch und Fehlerbehandlung, damit die
 * Komponenten nur noch starten() aufrufen und den Text anzeigen müssen.
 */
export function useAIStream(): UseAIStreamErgebnis {
  const [text, setText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [wurdeAbgebrochen, setWurdeAbgebrochen] = useState<boolean>(false);

  // Der AbortController der laufenden Anfrage (useRef: Änderung löst kein Rendern aus)
  const controllerRef = useRef<AbortController | null>(null);

  // Cleanup: Verlässt man die Seite, wird eine laufende KI-Antwort abgebrochen
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const starten = useCallback(async (nachrichten: Nachricht[]): Promise<void> => {
    controllerRef.current?.abort(); // evtl. laufende Antwort beenden
    const controller = new AbortController();
    controllerRef.current = controller;

    setText('');
    setFehler(null);
    setWurdeAbgebrochen(false);
    setIsStreaming(true);

    try {
      // Funktionale Update-Form: jedes Token baut auf dem aktuellen Text auf
      await streamChat(nachrichten, (token) => setText((alt) => alt + token), controller.signal);
    } catch (err) {
      if (controller.signal.aborted) {
        setWurdeAbgebrochen(true);
      } else {
        setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler bei der KI-Anfrage.');
      }
    } finally {
      // Nur aufräumen, wenn inzwischen keine neuere Anfrage gestartet wurde
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsStreaming(false);
      }
    }
  }, []);

  const abbrechen = useCallback((): void => {
    controllerRef.current?.abort();
  }, []);

  return { text, isStreaming, fehler, wurdeAbgebrochen, starten, abbrechen };
}
