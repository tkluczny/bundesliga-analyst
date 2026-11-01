import { useMemo, useState } from 'react';
import DuellFormular, { type DuellAuswahl } from '../komponenten/DuellFormular';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import FormKurve from '../komponenten/FormKurve';
import KIAnalyse from '../komponenten/KIAnalyse';
import LadeAnzeige from '../komponenten/LadeAnzeige';
import Wappen from '../komponenten/Wappen';
import { useFetch } from '../hooks/useFetch';
import { useSeitentitel } from '../hooks/useSeitentitel';
import type { ApiSpiel, ApiTabellenEintrag } from '../typen/openligadb';
import { apiUrls } from '../utils/api';
import { formatiereDatum } from '../utils/formatierung';
import { aktuelleSaison, saisonText } from '../utils/konfiguration';
import { duellNachrichten, type DuellTeamDaten } from '../utils/prompts';
import { berechneDuell, berechneTeamStatistik, teamSpiele, torschuetzen } from '../utils/statistik';

const SAISON = aktuelleSaison();

/** Fasst die Saisondaten eines Teams für Anzeige und KI zusammen */
function teamDaten(
  tabelle: ApiTabellenEintrag[],
  spiele: ApiSpiel[],
  teamId: number,
): DuellTeamDaten | null {
  const index = tabelle.findIndex((e) => e.teamInfoId === teamId);
  if (index < 0) return null;
  const eigeneSpiele = teamSpiele(spiele, teamId);
  return {
    name: tabelle[index].teamName,
    platz: index + 1,
    punkte: tabelle[index].points,
    statistik: berechneTeamStatistik(eigeneSpiele),
    letzteSpiele: eigeneSpiele.slice(-5),
    torschuetzen: torschuetzen(spiele, teamId, 3),
  };
}

// Duell-Vorschau: Formular → Daten laden → Vergleich → KI-Vorschau
function Duell(): React.JSX.Element {
  useSeitentitel('Duell-Vorschau');
  const [auswahl, setAuswahl] = useState<DuellAuswahl | null>(null);

  const tabelle = useFetch<ApiTabellenEintrag[]>(apiUrls.tabelle(SAISON));
  // Saisonspiele und direkte Duelle werden erst nach dem Absenden geladen
  const saisonSpiele = useFetch<ApiSpiel[]>(auswahl ? apiUrls.alleSpiele(SAISON) : null);
  const duelle = useFetch<ApiSpiel[]>(
    auswahl ? apiUrls.direkteDuelle(auswahl.heimId, auswahl.gastId) : null,
  );

  const vergleich = useMemo(() => {
    if (!auswahl || !tabelle.daten || !saisonSpiele.daten || !duelle.daten) return null;
    const heim = teamDaten(tabelle.daten, saisonSpiele.daten, auswahl.heimId);
    const gast = teamDaten(tabelle.daten, saisonSpiele.daten, auswahl.gastId);
    if (!heim || !gast) return null;
    return { heim, gast, duell: berechneDuell(duelle.daten, auswahl.heimId, auswahl.gastId) };
  }, [auswahl, tabelle.daten, saisonSpiele.daten, duelle.daten]);

  const ladeFehler = saisonSpiele.fehler ?? duelle.fehler;
  const wappen = (id: number): string | null =>
    tabelle.daten?.find((e) => e.teamInfoId === id)?.teamIconUrl ?? null;

  return (
    <section aria-labelledby="titel-duell">
      <div className="seitenkopf">
        <h1 id="titel-duell">Duell-Vorschau</h1>
        <p className="untertitel">
          Zwei Teams auswählen – die App vergleicht Form, Tabelle und direkte Duelle, die KI
          schreibt daraus eine Vorschau.
        </p>
      </div>

      {tabelle.isLaden && <LadeAnzeige text="Teams werden geladen …" />}
      {tabelle.fehler && <FehlerMeldung meldung={tabelle.fehler} onNeuVersuch={tabelle.neuLaden} />}
      {tabelle.daten && <DuellFormular teams={tabelle.daten} onAbsenden={setAuswahl} />}

      {auswahl && (
        <div className="duell-ergebnis">
          {(saisonSpiele.isLaden || duelle.isLaden) && (
            <LadeAnzeige text="Spieldaten werden verglichen …" />
          )}
          {ladeFehler && (
            <FehlerMeldung
              meldung={ladeFehler}
              onNeuVersuch={() => {
                saisonSpiele.neuLaden();
                duelle.neuLaden();
              }}
            />
          )}

          {vergleich && (
            <>
              <section className="karte duell-vergleich" aria-labelledby="titel-vergleich">
                <h2 id="titel-vergleich" className="sr-only">
                  Vergleich {vergleich.heim.name} gegen {vergleich.gast.name}
                </h2>
                <div className="duell-teams">
                  {[
                    { daten: vergleich.heim, id: auswahl.heimId, rolle: 'Heim' },
                    { daten: vergleich.gast, id: auswahl.gastId, rolle: 'Gast' },
                  ].map(({ daten, id, rolle }) => (
                    <div key={rolle} className="duell-team">
                      <Wappen url={wappen(id)} teamName={daten.name} groesse={56} />
                      <h3>{daten.name}</h3>
                      <p className="untertitel">
                        {rolle} · Platz {daten.platz} · {daten.punkte} Punkte · Tore{' '}
                        {daten.statistik.gesamt.tore}:{daten.statistik.gesamt.gegentore}
                      </p>
                      <FormKurve form={daten.statistik.form} />
                    </div>
                  ))}
                </div>

                <h3>Direkte Bundesliga-Duelle</h3>
                {vergleich.duell.spiele === 0 ? (
                  <p>Für diese Paarung sind keine Bundesliga-Duelle in der Datenbank erfasst.</p>
                ) : (
                  <>
                    <p>
                      {vergleich.duell.spiele} Spiele: {vergleich.duell.siegeTeam1} Siege{' '}
                      {vergleich.heim.name}, {vergleich.duell.unentschieden} Remis,{' '}
                      {vergleich.duell.siegeTeam2} Siege {vergleich.gast.name}
                    </p>
                    <ul className="ergebnis-liste">
                      {vergleich.duell.letzteSpiele.map((s) => (
                        <li key={s.spielId}>
                          <span>{formatiereDatum(s.datum)}</span>
                          <span>
                            {s.heimTeam} – {s.gastTeam}
                          </span>
                          <strong>
                            {s.toreHeim}:{s.toreGast}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              {/* key: neue Auswahl → KI-Bereich startet frisch */}
              <KIAnalyse
                key={`${auswahl.heimId}-${auswahl.gastId}-${auswahl.schwerpunkt}`}
                titel="KI-Duellvorschau"
                beschreibung="Die KI fasst die obigen Daten zu einer neutralen Vorschau zusammen – ohne Ergebnistipp."
                knopfText="Vorschau erstellen"
                erstelleNachrichten={() =>
                  duellNachrichten({
                    saison: saisonText(SAISON),
                    team1: vergleich.heim,
                    team2: vergleich.gast,
                    duell: vergleich.duell,
                    schwerpunkt: auswahl.schwerpunkt,
                  })
                }
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default Duell;
