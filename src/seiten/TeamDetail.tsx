import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import BilanzKarte from '../komponenten/BilanzKarte';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import FormKurve from '../komponenten/FormKurve';
import LadeAnzeige from '../komponenten/LadeAnzeige';
import Wappen from '../komponenten/Wappen';
import { useFetch } from '../hooks/useFetch';
import { useSeitentitel } from '../hooks/useSeitentitel';
import type { ApiSpiel, ApiTabellenEintrag } from '../typen/openligadb';
import { apiUrls } from '../utils/api';
import { formatiereDatum, formatiereUhrzeit } from '../utils/formatierung';
import { aktuelleSaison, saisonText } from '../utils/konfiguration';
import { berechneTeamStatistik, naechstesSpiel, teamSpiele, torschuetzen } from '../utils/statistik';

const SAISON = aktuelleSaison();

// Detailseite eines Teams: Tabellenplatz, Bilanz, Form, Torschützen
function TeamDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);

  const tabelle = useFetch<ApiTabellenEintrag[]>(apiUrls.tabelle(SAISON));
  const spiele = useFetch<ApiSpiel[]>(apiUrls.alleSpiele(SAISON));

  const platzIndex = tabelle.daten?.findIndex((e) => e.teamInfoId === teamId) ?? -1;
  const eintrag = platzIndex >= 0 ? tabelle.daten?.[platzIndex] : undefined;

  useSeitentitel(eintrag?.teamName ?? 'Team');

  // Berechnungen nur neu ausführen, wenn sich Daten oder Team ändern
  const auswertung = useMemo(() => {
    if (!spiele.daten) return null;
    const eigeneSpiele = teamSpiele(spiele.daten, teamId);
    return {
      spiele: eigeneSpiele,
      statistik: berechneTeamStatistik(eigeneSpiele),
      torschuetzen: torschuetzen(spiele.daten, teamId),
      naechstes: naechstesSpiel(spiele.daten, teamId),
    };
  }, [spiele.daten, teamId]);

  const fehler = tabelle.fehler ?? spiele.fehler;
  if (fehler) {
    return (
      <FehlerMeldung
        meldung={fehler}
        onNeuVersuch={() => {
          tabelle.neuLaden();
          spiele.neuLaden();
        }}
      />
    );
  }

  if (tabelle.isLaden || spiele.isLaden || !tabelle.daten || !auswertung) {
    return <LadeAnzeige text="Teamdaten werden geladen …" />;
  }

  if (!eintrag) {
    return (
      <section className="karte">
        <h1>Team nicht gefunden</h1>
        <p>Dieses Team spielt in der Saison {saisonText(SAISON)} nicht in der 1. Bundesliga.</p>
        <Link to="/">Zur Tabelle</Link>
      </section>
    );
  }

  const { statistik, naechstes } = auswertung;
  const letzteSpiele = auswertung.spiele.slice(-5).reverse();

  return (
    <article aria-labelledby="titel-team">
      <header className="team-kopf karte">
        <Wappen url={eintrag.teamIconUrl} teamName={eintrag.teamName} groesse={72} />
        <div>
          <h1 id="titel-team">{eintrag.teamName}</h1>
          <p className="untertitel">
            Platz {platzIndex + 1} · {eintrag.points} Punkte · Tordifferenz{' '}
            {eintrag.goalDiff > 0 ? `+${eintrag.goalDiff}` : eintrag.goalDiff} · Saison{' '}
            {saisonText(SAISON)}
          </p>
        </div>
      </header>

      <section className="team-abschnitt" aria-labelledby="titel-bilanz">
        <h2 id="titel-bilanz">Bilanz</h2>
        <div className="bilanz-raster">
          <BilanzKarte titel="Gesamt" bilanz={statistik.gesamt} />
          <BilanzKarte titel="Heim" bilanz={statistik.heim} />
          <BilanzKarte titel="Auswärts" bilanz={statistik.auswaerts} />
        </div>
      </section>

      <div className="team-raster">
        <section className="karte" aria-labelledby="titel-form">
          <h2 id="titel-form">Form</h2>
          <FormKurve form={statistik.form} />
          <h3>Letzte Spiele</h3>
          {letzteSpiele.length === 0 ? (
            <p>Noch keine Spiele beendet.</p>
          ) : (
            <ul className="ergebnis-liste">
              {letzteSpiele.map((s) => (
                <li key={s.spielId}>
                  <span className={`ergebnis-punkt form-${s.ausgang}`} aria-hidden="true">
                    {s.ausgang}
                  </span>
                  <span>
                    {s.spieltag}. ST · {s.heim ? 'vs.' : 'bei'}{' '}
                    <Link to={`/team/${s.gegnerId}`}>{s.gegner}</Link>
                  </span>
                  <strong>
                    {s.toreEigen}:{s.toreGegner}
                  </strong>
                </li>
              ))}
            </ul>
          )}
          {naechstes && (
            <p className="naechstes-spiel">
              <strong>Nächstes Spiel:</strong> {naechstes.team1.teamName} –{' '}
              {naechstes.team2.teamName}, {formatiereDatum(naechstes.matchDateTime)},{' '}
              {formatiereUhrzeit(naechstes.matchDateTime)} Uhr
            </p>
          )}
        </section>

        <section className="karte" aria-labelledby="titel-torschuetzen">
          <h2 id="titel-torschuetzen">Torschützen</h2>
          {auswertung.torschuetzen.length === 0 ? (
            <p>Noch keine Torschützen erfasst.</p>
          ) : (
            <ol className="torschuetzen-liste">
              {auswertung.torschuetzen.map((t) => (
                <li key={t.name}>
                  <span>{t.name}</span>
                  <strong>
                    {t.tore} {t.tore === 1 ? 'Tor' : 'Tore'}
                  </strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </article>
  );
}

export default TeamDetail;
