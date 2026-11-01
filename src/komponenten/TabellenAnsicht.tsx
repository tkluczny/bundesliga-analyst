import { Link } from 'react-router-dom';
import type { ApiTabellenEintrag } from '../typen/openligadb';
import Wappen from './Wappen';

interface TabellenAnsichtProps {
  eintraege: ApiTabellenEintrag[];
  titel: string;
}

/** Tabellenzonen der Bundesliga – als Text für Screenreader und als Farbmarkierung */
function zoneFuerPlatz(platz: number): { klasse: string; text: string } | null {
  if (platz <= 4) return { klasse: 'zone-cl', text: 'Champions-League-Platz' };
  if (platz <= 6) return { klasse: 'zone-el', text: 'Europa-League- oder Conference-League-Platz' };
  if (platz === 16) return { klasse: 'zone-relegation', text: 'Relegationsplatz' };
  if (platz >= 17) return { klasse: 'zone-abstieg', text: 'Abstiegsplatz' };
  return null;
}

function TabellenAnsicht({ eintraege, titel }: TabellenAnsichtProps): React.JSX.Element {
  return (
    <div className="tabelle-container">
      <table className="tabelle">
        <caption>{titel}</caption>
        <thead>
          <tr>
            <th scope="col">
              <abbr title="Platz">Pl.</abbr>
            </th>
            <th scope="col">Verein</th>
            <th scope="col">
              <abbr title="Spiele">Sp.</abbr>
            </th>
            <th scope="col" className="spalte-optional">
              <abbr title="Siege">S</abbr>
            </th>
            <th scope="col" className="spalte-optional">
              <abbr title="Unentschieden">U</abbr>
            </th>
            <th scope="col" className="spalte-optional">
              <abbr title="Niederlagen">N</abbr>
            </th>
            <th scope="col" className="spalte-optional">
              Tore
            </th>
            <th scope="col">
              <abbr title="Tordifferenz">Diff.</abbr>
            </th>
            <th scope="col">
              <abbr title="Punkte">Pkt.</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map((eintrag, index) => {
            const platz = index + 1;
            const zone = zoneFuerPlatz(platz);
            return (
              <tr key={eintrag.teamInfoId} className={zone?.klasse}>
                <td className="spalte-platz">
                  {platz}
                  {zone && <span className="sr-only"> ({zone.text})</span>}
                </td>
                <td>
                  <Link to={`/team/${eintrag.teamInfoId}`} className="team-link">
                    <Wappen url={eintrag.teamIconUrl} teamName={eintrag.teamName} />
                    <span className="team-name-lang">{eintrag.teamName}</span>
                    <span className="team-name-kurz">{eintrag.shortName}</span>
                  </Link>
                </td>
                <td>{eintrag.matches}</td>
                <td className="spalte-optional">{eintrag.won}</td>
                <td className="spalte-optional">{eintrag.draw}</td>
                <td className="spalte-optional">{eintrag.lost}</td>
                <td className="spalte-optional">
                  {eintrag.goals}:{eintrag.opponentGoals}
                </td>
                <td>{eintrag.goalDiff > 0 ? `+${eintrag.goalDiff}` : eintrag.goalDiff}</td>
                <td className="spalte-punkte">{eintrag.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="legende" aria-label="Legende der Tabellenzonen">
        <li className="zone-cl">Champions League</li>
        <li className="zone-el">Europa / Conference League</li>
        <li className="zone-relegation">Relegation</li>
        <li className="zone-abstieg">Abstieg</li>
      </ul>
    </div>
  );
}

export default TabellenAnsicht;
