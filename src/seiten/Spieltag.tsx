import { Link, useParams } from 'react-router-dom';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import LadeAnzeige from '../komponenten/LadeAnzeige';
import SpielKarte from '../komponenten/SpielKarte';
import { useFetch } from '../hooks/useFetch';
import { useSeitentitel } from '../hooks/useSeitentitel';
import type { ApiSpiel } from '../typen/openligadb';
import { apiUrls } from '../utils/api';
import { ANZAHL_SPIELTAGE, aktuelleSaison, saisonText } from '../utils/konfiguration';

const SAISON = aktuelleSaison();

// Ergebnisse eines Spieltags; die Nummer kommt aus der URL (/spieltag/:nr)
function Spieltag(): React.JSX.Element {
  const { nr } = useParams<{ nr: string }>();
  const spieltag = Number(nr);
  const istGueltig = Number.isInteger(spieltag) && spieltag >= 1 && spieltag <= ANZAHL_SPIELTAGE;

  useSeitentitel(istGueltig ? `${spieltag}. Spieltag` : 'Spieltag');

  // Bei ungültiger Nummer wird nichts geladen (url = null)
  const { daten, isLaden, fehler, neuLaden } = useFetch<ApiSpiel[]>(
    istGueltig ? apiUrls.spieltag(SAISON, spieltag) : null,
  );

  if (!istGueltig) {
    return (
      <section className="karte">
        <h1>Unbekannter Spieltag</h1>
        <p>Eine Bundesliga-Saison hat die Spieltage 1 bis {ANZAHL_SPIELTAGE}.</p>
        <Link to="/spieltag">Zum aktuellen Spieltag</Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="titel-spieltag">
      <div className="seitenkopf">
        <h1 id="titel-spieltag">{spieltag}. Spieltag</h1>
        <p className="untertitel">1. Bundesliga · Saison {saisonText(SAISON)}</p>
      </div>

      <nav className="spieltag-navigation" aria-label="Spieltage blättern">
        {spieltag > 1 ? (
          <Link className="knopf knopf-zweitrangig" to={`/spieltag/${spieltag - 1}`}>
            <span aria-hidden="true">←</span> {spieltag - 1}. Spieltag
          </Link>
        ) : (
          <span />
        )}
        {spieltag < ANZAHL_SPIELTAGE && (
          <Link className="knopf knopf-zweitrangig" to={`/spieltag/${spieltag + 1}`}>
            {spieltag + 1}. Spieltag <span aria-hidden="true">→</span>
          </Link>
        )}
      </nav>

      {isLaden && <LadeAnzeige text="Spiele werden geladen …" />}
      {fehler && <FehlerMeldung meldung={fehler} onNeuVersuch={neuLaden} />}
      {daten && daten.length === 0 && (
        <p className="karte">Für diesen Spieltag sind noch keine Spiele eingetragen.</p>
      )}
      {daten && daten.length > 0 && (
        <div className="spiel-liste">
          {daten.map((spiel) => (
            <SpielKarte key={spiel.matchID} spiel={spiel} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Spieltag;
