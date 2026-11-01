import type { Nachricht } from '../typen/ai';
import type { Bilanz, SpielAusgang, TeamSpiel, TeamStatistik, Torschuetze } from '../typen/app';
import { formatiereDatum } from './formatierung';

/**
 * System-Prompt nach dem Schema aus Modul 05 (Abschnitt 5.2):
 * Persona, Aufgabe, Format und Einschränkungen.
 *
 * Wichtigste Regel: Die KI darf nur die mitgelieferten Daten verwenden.
 * So werden erfundene Fakten (Halluzinationen) möglichst vermieden.
 */
export const SYSTEM_PROMPT_ANALYST = `
Du bist ein sachlicher, gut verständlicher Fußball-Analyst für die 1. Bundesliga.

AUFGABE:
- Du interpretierst die Statistiken, die dir im Abschnitt DATEN übergeben werden.

FORMAT:
- Antworte auf Deutsch in 3 bis 4 kurzen Absätzen, insgesamt höchstens 220 Wörter.
- Schreibe reinen Fließtext ohne Markdown (keine Sternchen, Rauten, Aufzählungszeichen oder Tabellen).

EINSCHRÄNKUNGEN:
- Verwende ausschließlich Fakten aus dem Abschnitt DATEN.
- Erfinde keine Spieler, Verletzungen, Sperren, Transfers, Trainer oder Taktiken.
- Reichen die Daten für eine Aussage nicht aus, sage das offen.
- Gib keine Wett-Tipps, keine Quoten und keine Prozent-Wahrscheinlichkeiten an.
`.trim();

const AUSGANG_TEXT: Record<SpielAusgang, string> = { S: 'Sieg', U: 'Remis', N: 'Niederlage' };

function bilanzZeile(titel: string, b: Bilanz): string {
  return `${titel}: ${b.spiele} Spiele, ${b.siege} Siege, ${b.unentschieden} Remis, ${b.niederlagen} Niederlagen, Tore ${b.tore}:${b.gegentore}`;
}

function spielZeile(s: TeamSpiel): string {
  return `- ${s.spieltag}. Spieltag (${formatiereDatum(s.datum)}): ${s.heim ? 'Heim' : 'Auswärts'} gegen ${s.gegner} ${s.toreEigen}:${s.toreGegner} (${AUSGANG_TEXT[s.ausgang]})`;
}

export interface FormanalyseDaten {
  teamName: string;
  saison: string;
  platz: number;
  punkte: number;
  statistik: TeamStatistik;
  spiele: TeamSpiel[];
  torschuetzen: Torschuetze[];
}

/** Baut die Nachrichten für die KI-Formanalyse eines Teams */
export function formanalyseNachrichten(d: FormanalyseDaten): Nachricht[] {
  const torschuetzenText =
    d.torschuetzen.length > 0
      ? d.torschuetzen.map((t) => `${t.name} (${t.tore})`).join(', ')
      : 'keine Daten';

  const daten = [
    `Team: ${d.teamName}`,
    `Saison: ${d.saison} (1. Bundesliga)`,
    `Tabellenplatz: ${d.platz} von 18, ${d.punkte} Punkte`,
    bilanzZeile('Gesamt', d.statistik.gesamt),
    bilanzZeile('Heim', d.statistik.heim),
    bilanzZeile('Auswärts', d.statistik.auswaerts),
    `Formkurve (älteste zuerst): ${d.statistik.form.join(' ') || 'keine Spiele'}`,
    `Beste Torschützen: ${torschuetzenText}`,
    'Alle Saisonspiele:',
    ...d.spiele.map(spielZeile),
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT_ANALYST },
    {
      role: 'user',
      content: `DATEN:\n${daten}\n\nAUFGABE: Analysiere die aktuelle Form von ${d.teamName}. Gehe auf Stärken und Schwächen (Offensive, Defensive, Heim und Auswärts) und den Trend der letzten Spiele ein und schließe mit einem kurzen Fazit.`,
    },
  ];
}
