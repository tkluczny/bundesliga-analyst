// Typen für die Antworten der OpenLigaDB-API (https://api.openligadb.de)
// Es sind nur die Felder beschrieben, die diese App tatsächlich verwendet.

export interface ApiTeam {
  teamId: number;
  teamName: string;
  shortName: string;
  teamIconUrl: string | null;
}

/** Eine "Gruppe" entspricht in der Bundesliga einem Spieltag */
export interface ApiGruppe {
  groupName: string;
  groupOrderID: number;
  groupID: number;
}

/** resultTypeID 1 = Halbzeit, 2 = Endergebnis */
export interface ApiErgebnis {
  resultTypeID: number;
  resultOrderID: number;
  resultName: string;
  pointsTeam1: number | null;
  pointsTeam2: number | null;
}

export interface ApiTor {
  goalID: number;
  scoreTeam1: number;
  scoreTeam2: number;
  matchMinute: number | null;
  goalGetterName: string | null;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

export interface ApiSpiel {
  matchID: number;
  matchDateTime: string;
  matchDateTimeUTC: string;
  leagueShortcut: string;
  leagueSeason: number;
  group: ApiGruppe;
  team1: ApiTeam;
  team2: ApiTeam;
  matchIsFinished: boolean;
  matchResults: ApiErgebnis[];
  goals: ApiTor[];
}

export interface ApiTabellenEintrag {
  teamInfoId: number;
  teamName: string;
  shortName: string;
  teamIconUrl: string | null;
  points: number;
  matches: number;
  won: number;
  draw: number;
  lost: number;
  goals: number;
  opponentGoals: number;
  goalDiff: number;
}
