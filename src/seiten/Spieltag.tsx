import { useParams } from 'react-router-dom';
import { useSeitentitel } from '../hooks/useSeitentitel';

function Spieltag(): React.JSX.Element {
  const { nr } = useParams<{ nr: string }>();
  useSeitentitel(`${nr ?? ''}. Spieltag`);
  return (
    <section>
      <h1>{nr}. Spieltag</h1>
      <p>Hier erscheinen die Ergebnisse des Spieltags.</p>
    </section>
  );
}

export default Spieltag;
