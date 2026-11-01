import { Link } from 'react-router-dom';
import { useSeitentitel } from '../hooks/useSeitentitel';

// Wird für alle unbekannten URLs angezeigt
function NichtGefunden(): React.JSX.Element {
  useSeitentitel('Seite nicht gefunden');
  return (
    <section className="karte">
      <h1>Seite nicht gefunden</h1>
      <p>Diese Seite gibt es leider nicht – vielleicht ein Abseits in der URL?</p>
      <p>
        <Link to="/">Zurück zur Tabelle</Link>
      </p>
    </section>
  );
}

export default NichtGefunden;
