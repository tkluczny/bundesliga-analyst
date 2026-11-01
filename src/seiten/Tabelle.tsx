import { useSeitentitel } from '../hooks/useSeitentitel';

function Tabelle(): React.JSX.Element {
  useSeitentitel('Tabelle');
  return (
    <section>
      <h1>Tabelle</h1>
      <p>Hier erscheint die aktuelle Tabelle der 1. Bundesliga.</p>
    </section>
  );
}

export default Tabelle;
