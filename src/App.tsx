import { Route, Routes } from 'react-router-dom';
import Layout from './komponenten/Layout';
import AktuellerSpieltag from './seiten/AktuellerSpieltag';
import Duell from './seiten/Duell';
import NichtGefunden from './seiten/NichtGefunden';
import Spieltag from './seiten/Spieltag';
import Tabelle from './seiten/Tabelle';
import TeamDetail from './seiten/TeamDetail';

// Routen der Anwendung – alle Seiten teilen sich das Layout
function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Tabelle />} />
        <Route path="/spieltag" element={<AktuellerSpieltag />} />
        <Route path="/spieltag/:nr" element={<Spieltag />} />
        <Route path="/team/:id" element={<TeamDetail />} />
        <Route path="/duell" element={<Duell />} />
        <Route path="*" element={<NichtGefunden />} />
      </Route>
    </Routes>
  );
}

export default App;
