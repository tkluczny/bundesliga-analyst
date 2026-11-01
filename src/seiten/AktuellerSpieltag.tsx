import { Navigate } from 'react-router-dom';

// Platzhalter: leitet vorerst auf den 1. Spieltag weiter
function AktuellerSpieltag(): React.JSX.Element {
  return <Navigate to="/spieltag/1" replace />;
}

export default AktuellerSpieltag;
