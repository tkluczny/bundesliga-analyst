import { useState } from 'react';
import { useAIStream } from '../hooks/useAIStream';
import type { Nachricht } from '../typen/ai';

interface KIAnalyseProps {
  titel: string;
  beschreibung: string;
  knopfText: string;
  /** Erzeugt die Nachrichten (System-Prompt + Daten) erst beim Klick */
  erstelleNachrichten: () => Nachricht[];
}

/**
 * Wiederverwendbarer KI-Bereich: Start-Knopf, gestreamte Antwort, Abbrechen,
 * Kopieren und Neu-Erstellen. Der Inhalt ist klar als KI-generiert gekennzeichnet.
 */
function KIAnalyse({
  titel,
  beschreibung,
  knopfText,
  erstelleNachrichten,
}: KIAnalyseProps): React.JSX.Element {
  const { text, isStreaming, fehler, wurdeAbgebrochen, starten, abbrechen } = useAIStream();
  const [kopiert, setKopiert] = useState<boolean>(false);

  const handleStart = (): void => {
    setKopiert(false);
    void starten(erstelleNachrichten());
  };

  const handleKopieren = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
    } catch {
      setKopiert(false);
    }
  };

  const hatText = text.length > 0;

  return (
    <section className="ki-analyse karte" aria-labelledby="titel-ki">
      <div className="ki-kopf">
        <h2 id="titel-ki">{titel}</h2>
        <span className="ki-kennzeichnung">KI-generiert</span>
      </div>
      <p className="ki-beschreibung">{beschreibung}</p>

      <div className="ki-steuerung">
        {!isStreaming && (
          <button type="button" className="knopf" onClick={handleStart}>
            {hatText || fehler ? 'Neu erstellen' : knopfText}
          </button>
        )}
        {isStreaming && (
          <button type="button" className="knopf knopf-zweitrangig" onClick={abbrechen}>
            Abbrechen
          </button>
        )}
        {hatText && !isStreaming && (
          <button type="button" className="knopf knopf-zweitrangig" onClick={handleKopieren}>
            {kopiert ? 'Kopiert ✓' : 'Text kopieren'}
          </button>
        )}
      </div>

      {fehler && (
        <div className="fehler-meldung" role="alert">
          <p>{fehler}</p>
        </div>
      )}

      {/* Tipp-Anzeige, bis das erste Wort eintrifft */}
      {isStreaming && !hatText && (
        <div className="tipp-anzeige" role="status">
          <span className="sr-only">Die KI schreibt …</span>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      )}

      {/* aria-busy: Screenreader lesen den Text erst vor, wenn er vollständig ist */}
      <div className="ki-text" aria-live="polite" aria-busy={isStreaming}>
        {text}
        {isStreaming && hatText && <span className="cursor" aria-hidden="true" />}
      </div>

      {wurdeAbgebrochen && <p className="ki-hinweis">Die Analyse wurde abgebrochen.</p>}
      {hatText && !isStreaming && (
        <p className="ki-hinweis">
          Automatisch erstellt auf Basis der angezeigten Daten. KI kann Fehler machen.
        </p>
      )}
    </section>
  );
}

export default KIAnalyse;
