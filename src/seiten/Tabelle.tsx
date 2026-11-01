import FehlerMeldung from '../komponenten/FehlerMeldung';
import LadeAnzeige from '../komponenten/LadeAnzeige';
import TabellenAnsicht from '../komponenten/TabellenAnsicht';
import { useFetch } from '../hooks/useFetch';
import { useSeitentitel } from '../hooks/useSeitentitel';
import type { ApiTabellenEintrag } from '../typen/openligadb';
import { apiUrls } from '../utils/api';
import { aktuelleSaison, saisonText } from '../utils/konfiguration';

const SAISON = aktuelleSaison();

// Startseite: aktuelle Tabelle der 1. Bundesliga
function Tabelle(): React.JSX.Element {
  useSeitentitel('Tabelle');
  const { daten, isLaden, fehler, neuLaden } = useFetch<ApiTabellenEintrag[]>(
    apiUrls.tabelle(SAISON),
  );

  return (
    <section aria-labelledby="titel-tabelle">
      <div className="seitenkopf">
        <h1 id="titel-tabelle">Tabelle 1. Bundesliga</h1>
        <p className="untertitel">
          Saison {saisonText(SAISON)} · Klick auf einen Verein öffnet Statistik und KI-Formanalyse.
        </p>
      </div>

      {/* Die drei Zustände: Laden – Fehler – Erfolg */}
      {isLaden && <LadeAnzeige text="Tabelle wird geladen …" />}
      {fehler && <FehlerMeldung meldung={fehler} onNeuVersuch={neuLaden} />}
      {daten && daten.length === 0 && (
        <p className="karte">Für diese Saison liegen noch keine Tabellendaten vor.</p>
      )}
      {daten && daten.length > 0 && (
        <TabellenAnsicht
          eintraege={daten}
          titel={`Tabelle der 1. Bundesliga, Saison ${saisonText(SAISON)}`}
        />
      )}
    </section>
  );
}

export default Tabelle;
