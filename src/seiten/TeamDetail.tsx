import { useParams } from 'react-router-dom';
import { useSeitentitel } from '../hooks/useSeitentitel';

function TeamDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  useSeitentitel('Team');
  return (
    <section>
      <h1>Team {id}</h1>
      <p>Hier erscheinen Statistik und KI-Formanalyse des Teams.</p>
    </section>
  );
}

export default TeamDetail;
