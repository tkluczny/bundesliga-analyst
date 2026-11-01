import { Link } from 'react-router-dom';
import type { ApiSpiel, ApiTeam } from '../typen/openligadb';
import { formatiereDatum, formatiereUhrzeit } from '../utils/formatierung';
import { endergebnis, halbzeitergebnis, spielStatus } from '../utils/spiele';
import Wappen from './Wappen';

interface SpielKarteProps {
  spiel: ApiSpiel;
}

const STATUS_TEXT = {
  beendet: 'Beendet',
  laufend: 'Läuft / Ergebnis ausstehend',
  geplant: 'Geplant',
} as const;

interface TeamZeileProps {
  team: ApiTeam;
}

function TeamZeile({ team }: TeamZeileProps): React.JSX.Element {
  return (
    <Link to={`/team/${team.teamId}`} className="team-link">
      <Wappen url={team.teamIconUrl} teamName={team.teamName} groesse={32} />
      <span>{team.teamName}</span>
    </Link>
  );
}

// Karte für ein einzelnes Spiel eines Spieltags
function SpielKarte({ spiel }: SpielKarteProps): React.JSX.Element {
  const status = spielStatus(spiel);
  const ende = endergebnis(spiel);
  const halbzeit = halbzeitergebnis(spiel);
  const beschreibung = ende
    ? `${spiel.team1.teamName} gegen ${spiel.team2.teamName}, Endstand ${ende.tore1} zu ${ende.tore2}`
    : `${spiel.team1.teamName} gegen ${spiel.team2.teamName}, noch kein Endergebnis`;

  return (
    <article className="spiel-karte" aria-label={beschreibung}>
      <p className="spiel-meta">
        <time dateTime={spiel.matchDateTime}>
          {formatiereDatum(spiel.matchDateTime)}, {formatiereUhrzeit(spiel.matchDateTime)} Uhr
        </time>
        <span className={`status status-${status}`}>{STATUS_TEXT[status]}</span>
      </p>

      <div className="spiel-teams">
        <TeamZeile team={spiel.team1} />
        <p className="spiel-ergebnis" aria-hidden="true">
          {ende ? `${ende.tore1} : ${ende.tore2}` : '– : –'}
        </p>
        <TeamZeile team={spiel.team2} />
      </div>

      {halbzeit && <p className="spiel-halbzeit">Halbzeit {halbzeit.tore1}:{halbzeit.tore2}</p>}
    </article>
  );
}

export default SpielKarte;
