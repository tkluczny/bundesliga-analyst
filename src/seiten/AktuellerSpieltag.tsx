import { Navigate } from 'react-router-dom';
import FehlerMeldung from '../komponenten/FehlerMeldung';
import LadeAnzeige from '../komponenten/LadeAnzeige';
import { useFetch } from '../hooks/useFetch';
import { useSeitentitel } from '../hooks/useSeitentitel';
import type { ApiGruppe } from '../typen/openligadb';
import { apiUrls } from '../utils/api';

// Ermittelt den aktuellen Spieltag und leitet auf /spieltag/:nr weiter
function AktuellerSpieltag(): React.JSX.Element {
  useSeitentitel('Aktueller Spieltag');
  const { daten, isLaden, fehler, neuLaden } = useFetch<ApiGruppe>(apiUrls.aktuellerSpieltag());

  if (fehler) return <FehlerMeldung meldung={fehler} onNeuVersuch={neuLaden} />;
  if (isLaden || !daten) return <LadeAnzeige text="Aktueller Spieltag wird ermittelt …" />;
  return <Navigate to={`/spieltag/${daten.groupOrderID}`} replace />;
}

export default AktuellerSpieltag;
