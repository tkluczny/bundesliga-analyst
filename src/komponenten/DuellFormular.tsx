import { useState } from 'react';
import type { ApiTabellenEintrag } from '../typen/openligadb';
import type { Schwerpunkt } from '../utils/prompts';

export interface DuellAuswahl {
  heimId: number;
  gastId: number;
  schwerpunkt: Schwerpunkt;
}

interface DuellFormularProps {
  teams: ApiTabellenEintrag[];
  onAbsenden: (auswahl: DuellAuswahl) => void;
}

interface FormDaten {
  heim: string;
  gast: string;
  schwerpunkt: Schwerpunkt;
}

interface FormFehler {
  heim?: string;
  gast?: string;
}

const SCHWERPUNKTE: Array<{ wert: Schwerpunkt; text: string }> = [
  { wert: 'allgemein', text: 'Allgemein' },
  { wert: 'offensive', text: 'Offensive' },
  { wert: 'defensive', text: 'Defensive' },
];

/** Prüft die Eingaben und liefert ein Objekt mit Fehlermeldungen (leer = alles in Ordnung) */
function validiere(daten: FormDaten): FormFehler {
  const fehler: FormFehler = {};
  if (!daten.heim) fehler.heim = 'Bitte ein Heimteam auswählen.';
  if (!daten.gast) fehler.gast = 'Bitte ein Gastteam auswählen.';
  if (daten.heim && daten.gast && daten.heim === daten.gast) {
    fehler.gast = 'Heim- und Gastteam müssen verschieden sein.';
  }
  return fehler;
}

// Kontrolliertes Formular mit Validierung (vgl. Modul 04, Kapitel 5)
function DuellFormular({ teams, onAbsenden }: DuellFormularProps): React.JSX.Element {
  const [daten, setDaten] = useState<FormDaten>({ heim: '', gast: '', schwerpunkt: 'allgemein' });
  const [fehler, setFehler] = useState<FormFehler>({});
  const [wurdeAbgeschickt, setWurdeAbgeschickt] = useState<boolean>(false);

  // Teams alphabetisch für die Auswahllisten (Kopie, damit die Props unverändert bleiben)
  const sortierteTeams = [...teams].sort((a, b) => a.teamName.localeCompare(b.teamName, 'de'));

  const aktualisiere = (feld: keyof FormDaten, wert: string): void => {
    const neueDaten = { ...daten, [feld]: wert } as FormDaten;
    setDaten(neueDaten);
    // Nach dem ersten Absenden sofort neu prüfen, damit Fehler beim Korrigieren verschwinden
    if (wurdeAbgeschickt) setFehler(validiere(neueDaten));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setWurdeAbgeschickt(true);
    const neueFehler = validiere(daten);
    setFehler(neueFehler);
    if (Object.keys(neueFehler).length > 0) return;

    onAbsenden({
      heimId: Number(daten.heim),
      gastId: Number(daten.gast),
      schwerpunkt: daten.schwerpunkt,
    });
  };

  return (
    <form className="duell-formular karte" onSubmit={handleSubmit} noValidate>
      <div className="formular-zeile">
        <div className="formular-feld">
          <label htmlFor="heim">
            Heimteam <span aria-hidden="true">*</span>
          </label>
          <select
            id="heim"
            value={daten.heim}
            onChange={(e) => aktualisiere('heim', e.target.value)}
            aria-required="true"
            aria-invalid={fehler.heim ? 'true' : 'false'}
            aria-describedby={fehler.heim ? 'heim-fehler' : undefined}
          >
            <option value="">– Team wählen –</option>
            {sortierteTeams.map((t) => (
              <option key={t.teamInfoId} value={t.teamInfoId}>
                {t.teamName}
              </option>
            ))}
          </select>
          {fehler.heim && (
            <p id="heim-fehler" className="feld-fehler">
              {fehler.heim}
            </p>
          )}
        </div>

        <div className="formular-feld">
          <label htmlFor="gast">
            Gastteam <span aria-hidden="true">*</span>
          </label>
          <select
            id="gast"
            value={daten.gast}
            onChange={(e) => aktualisiere('gast', e.target.value)}
            aria-required="true"
            aria-invalid={fehler.gast ? 'true' : 'false'}
            aria-describedby={fehler.gast ? 'gast-fehler' : undefined}
          >
            <option value="">– Team wählen –</option>
            {sortierteTeams.map((t) => (
              <option key={t.teamInfoId} value={t.teamInfoId}>
                {t.teamName}
              </option>
            ))}
          </select>
          {fehler.gast && (
            <p id="gast-fehler" className="feld-fehler">
              {fehler.gast}
            </p>
          )}
        </div>
      </div>

      <fieldset className="schwerpunkt">
        <legend>Schwerpunkt der Analyse</legend>
        {SCHWERPUNKTE.map((s) => (
          <label key={s.wert} className="radio-option">
            <input
              type="radio"
              name="schwerpunkt"
              value={s.wert}
              checked={daten.schwerpunkt === s.wert}
              onChange={(e) => aktualisiere('schwerpunkt', e.target.value)}
            />
            {s.text}
          </label>
        ))}
      </fieldset>

      <p className="formular-hinweis">
        <span aria-hidden="true">*</span> Pflichtfeld
      </p>

      <button type="submit" className="knopf">
        Duell vergleichen
      </button>
    </form>
  );
}

export default DuellFormular;
