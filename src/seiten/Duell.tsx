import { useSeitentitel } from '../hooks/useSeitentitel';

function Duell(): React.JSX.Element {
  useSeitentitel('Duell-Vorschau');
  return (
    <section>
      <h1>Duell-Vorschau</h1>
      <p>Hier entsteht das Formular für die KI-Duellvorschau.</p>
    </section>
  );
}

export default Duell;
