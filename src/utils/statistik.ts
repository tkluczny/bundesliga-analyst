import type {
  Bilanz,
  DuellBilanz,
  DuellSpiel,
  SpielAusgang,
  TeamSpiel,
  TeamStatistik,
  Torschuetze,
} from '../typen/app';
import type { ApiSpiel } from '../typen/openligadb';
import { endergebnis } from './spiele';

const LEERE_BILANZ: Bilanz = {
  spiele: 0,
  siege: 0,
  unentschieden: 0,
  niederlagen: 0,
  tore: 0,
  gegentore: 0,
};

function ausgang(toreEigen: number, toreGegner: number): SpielAusgang {
  if (toreEigen > toreGegner) return 'S';
  if (toreEigen < toreGegner) return 'N';
  return 'U';
}

function nachDatumAufsteigend(a: ApiSpiel, b: ApiSpiel): number {
  return a.matchDateTimeUTC.localeCompare(b.matchDateTimeUTC);
}

/** Alle beendeten Spiele eines Teams aus dessen Sicht, ältestes zuerst */
export function teamSpiele(spiele: ApiSpiel[], teamId: number): TeamSpiel[] {
  return spiele
    .filter((s) => s.matchIsFinished && (s.team1.teamId === teamId || s.team2.teamId === teamId))
    .sort(nachDatumAufsteigend)
    .flatMap((s): TeamSpiel[] => {
      const ende = endergebnis(s);
      if (!ende) return [];
      const heim = s.team1.teamId === teamId;
      const toreEigen = heim ? ende.tore1 : ende.tore2;
      const toreGegner = heim ? ende.tore2 : ende.tore1;
      const gegner = heim ? s.team2 : s.team1;
      return [
        {
          spielId: s.matchID,
          datum: s.matchDateTime,
          spieltag: s.group.groupOrderID,
          gegner: gegner.teamName,
          gegnerId: gegner.teamId,
          heim,
          toreEigen,
          toreGegner,
          ausgang: ausgang(toreEigen, toreGegner),
        },
      ];
    });
}

/** Nächstes noch nicht beendetes Spiel eines Teams */
export function naechstesSpiel(spiele: ApiSpiel[], teamId: number): ApiSpiel | undefined {
  return spiele
    .filter((s) => !s.matchIsFinished && (s.team1.teamId === teamId || s.team2.teamId === teamId))
    .sort(nachDatumAufsteigend)[0];
}

/** Summiert Spiele zu einer Bilanz (reduce, vgl. Modul 02) */
function bilanz(spiele: TeamSpiel[]): Bilanz {
  return spiele.reduce<Bilanz>(
    (summe, s) => ({
      spiele: summe.spiele + 1,
      siege: summe.siege + (s.ausgang === 'S' ? 1 : 0),
      unentschieden: summe.unentschieden + (s.ausgang === 'U' ? 1 : 0),
      niederlagen: summe.niederlagen + (s.ausgang === 'N' ? 1 : 0),
      tore: summe.tore + s.toreEigen,
      gegentore: summe.gegentore + s.toreGegner,
    }),
    LEERE_BILANZ,
  );
}

/** Gesamt-, Heim- und Auswärtsbilanz sowie die Formkurve der letzten fünf Spiele */
export function berechneTeamStatistik(spiele: TeamSpiel[]): TeamStatistik {
  return {
    gesamt: bilanz(spiele),
    heim: bilanz(spiele.filter((s) => s.heim)),
    auswaerts: bilanz(spiele.filter((s) => !s.heim)),
    form: spiele.slice(-5).map((s) => s.ausgang),
  };
}

/**
 * Torschützen eines Teams aus den Tor-Daten der Spiele. Welches Team getroffen hat,
 * wird aus der Veränderung des Spielstands abgeleitet. Eigentore werden nicht gezählt.
 */
export function torschuetzen(spiele: ApiSpiel[], teamId: number, anzahl: number = 5): Torschuetze[] {
  const zaehler = new Map<string, number>();

  for (const spiel of spiele) {
    const istTeam1 = spiel.team1.teamId === teamId;
    const istTeam2 = spiel.team2.teamId === teamId;
    if (!istTeam1 && !istTeam2) continue;

    const tore = [...spiel.goals].sort(
      (a, b) => a.scoreTeam1 + a.scoreTeam2 - (b.scoreTeam1 + b.scoreTeam2),
    );
    let vorher1 = 0;
    for (const tor of tore) {
      const team1HatGetroffen = tor.scoreTeam1 > vorher1;
      vorher1 = tor.scoreTeam1;
      const fuerUnserTeam = istTeam1 ? team1HatGetroffen : !team1HatGetroffen;
      if (!fuerUnserTeam || tor.isOwnGoal || !tor.goalGetterName) continue;
      const name = tor.goalGetterName.trim();
      zaehler.set(name, (zaehler.get(name) ?? 0) + 1);
    }
  }

  return [...zaehler.entries()]
    .map(([name, tore]) => ({ name, tore }))
    .sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name, 'de'))
    .slice(0, anzahl);
}

/**
 * Bilanz der direkten Duelle (Bundesliga) aus Sicht von Team 1.
 * Die OpenLigaDB kann dasselbe Spiel in mehreren Ligen führen – Duplikate werden entfernt.
 */
export function berechneDuell(
  spiele: ApiSpiel[],
  teamId1: number,
  teamId2: number,
  anzahlLetzte: number = 5,
): DuellBilanz {
  const gesehen = new Set<string>();

  const beendet = spiele
    .filter(
      (s) =>
        s.leagueShortcut === 'bl1' &&
        s.matchIsFinished &&
        endergebnis(s) !== null &&
        [s.team1.teamId, s.team2.teamId].includes(teamId1) &&
        [s.team1.teamId, s.team2.teamId].includes(teamId2),
    )
    .filter((s) => {
      const schluessel = `${s.matchDateTime.slice(0, 10)}-${s.team1.teamId}-${s.team2.teamId}`;
      if (gesehen.has(schluessel)) return false;
      gesehen.add(schluessel);
      return true;
    })
    .sort((a, b) => nachDatumAufsteigend(b, a));

  const zaehlung = beendet.reduce(
    (summe, s) => {
      const ende = endergebnis(s)!;
      const toreTeam1 = s.team1.teamId === teamId1 ? ende.tore1 : ende.tore2;
      const toreTeam2 = s.team1.teamId === teamId1 ? ende.tore2 : ende.tore1;
      if (toreTeam1 > toreTeam2) summe.siegeTeam1 += 1;
      else if (toreTeam1 < toreTeam2) summe.siegeTeam2 += 1;
      else summe.unentschieden += 1;
      return summe;
    },
    { siegeTeam1: 0, siegeTeam2: 0, unentschieden: 0 },
  );

  const letzteSpiele = beendet.slice(0, anzahlLetzte).map((s): DuellSpiel => {
    const ende = endergebnis(s)!;
    return {
      spielId: s.matchID,
      datum: s.matchDateTime,
      saison: s.leagueSeason,
      heimTeam: s.team1.teamName,
      gastTeam: s.team2.teamName,
      toreHeim: ende.tore1,
      toreGast: ende.tore2,
    };
  });

  return { spiele: beendet.length, ...zaehlung, letzteSpiele };
}
