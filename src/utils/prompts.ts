import type { Nachricht } from '../typen/ai';
import type {
  Bilanz,
  DuellBilanz,
  SpielAusgang,
  TeamSpiel,
  TeamStatistik,
  Torschuetze,
} from '../typen/app';
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

export type Schwerpunkt = 'allgemein' | 'offensive' | 'defensive';

const SCHWERPUNKT_AUFTRAG: Record<Schwerpunkt, string> = {
  allgemein: 'Gib einen ausgewogenen Überblick über beide Teams.',
  offensive: 'Lege den Schwerpunkt auf die Offensive beider Teams (erzielte Tore, Torschützen).',
  defensive: 'Lege den Schwerpunkt auf die Defensive beider Teams (Gegentore, Stabilität).',
};

export interface DuellTeamDaten {
  name: string;
  platz: number;
  punkte: number;
  statistik: TeamStatistik;
  letzteSpiele: TeamSpiel[];
  torschuetzen: Torschuetze[];
}

export interface DuellDaten {
  saison: string;
  team1: DuellTeamDaten;
  team2: DuellTeamDaten;
  duell: DuellBilanz;
  schwerpunkt: Schwerpunkt;
}

function teamBlock(t: DuellTeamDaten): string {
  return [
    `${t.name}: Platz ${t.platz}, ${t.punkte} Punkte`,
    bilanzZeile('  Gesamt', t.statistik.gesamt),
    bilanzZeile('  Heim', t.statistik.heim),
    bilanzZeile('  Auswärts', t.statistik.auswaerts),
    `  Formkurve (älteste zuerst): ${t.statistik.form.join(' ') || 'keine Spiele'}`,
    `  Beste Torschützen: ${t.torschuetzen.map((s) => `${s.name} (${s.tore})`).join(', ') || 'keine Daten'}`,
    '  Letzte Spiele:',
    ...t.letzteSpiele.map((s) => `  ${spielZeile(s)}`),
  ].join('\n');
}

/** Baut die Nachrichten für die KI-Duellvorschau (Team 1 hat Heimrecht) */
export function duellNachrichten(d: DuellDaten): Nachricht[] {
  const { duell } = d;
  const begegnungen =
    duell.letzteSpiele.length > 0
      ? duell.letzteSpiele
          .map(
            (s) =>
              `- ${formatiereDatum(s.datum)}: ${s.heimTeam} – ${s.gastTeam} ${s.toreHeim}:${s.toreGast}`,
          )
          .join('\n')
      : '- keine Bundesliga-Duelle in der Datenbank';

  const daten = [
    `Saison: ${d.saison} (1. Bundesliga). Heimteam: ${d.team1.name}, Gastteam: ${d.team2.name}.`,
    '',
    teamBlock(d.team1),
    '',
    teamBlock(d.team2),
    '',
    `Direkte Bundesliga-Duelle laut Datenbank: ${duell.spiele} Spiele, ${duell.siegeTeam1} Siege ${d.team1.name}, ${duell.siegeTeam2} Siege ${d.team2.name}, ${duell.unentschieden} Remis.`,
    'Jüngste Begegnungen:',
    begegnungen,
  ].join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT_ANALYST },
    {
      role: 'user',
      content: `DATEN:\n${daten}\n\nAUFGABE: Schreibe eine neutrale Vorschau auf das Duell ${d.team1.name} gegen ${d.team2.name}. Vergleiche aktuelle Form und Tabellensituation und ordne die direkten Duelle ein. ${SCHWERPUNKT_AUFTRAG[d.schwerpunkt]} Schließe mit einer kurzen Einschätzung, worauf es in dieser Partie ankommen dürfte – ohne Ergebnistipp.`,
    },
  ];
}
