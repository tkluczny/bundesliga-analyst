import type { Bilanz } from '../typen/app';

interface BilanzKarteProps {
  titel: string;
  bilanz: Bilanz;
}

/** Kompakte Darstellung einer Bilanz (Siege/Unentschieden/Niederlagen und Tore) */
function BilanzKarte({ titel, bilanz }: BilanzKarteProps): React.JSX.Element {
  return (
    <div className="bilanz-karte">
      <h3>{titel}</h3>
      <dl>
        <div>
          <dt>Spiele</dt>
          <dd>{bilanz.spiele}</dd>
        </div>
        <div>
          <dt>S / U / N</dt>
          <dd>
            {bilanz.siege} / {bilanz.unentschieden} / {bilanz.niederlagen}
          </dd>
        </div>
        <div>
          <dt>Tore</dt>
          <dd>
            {bilanz.tore}:{bilanz.gegentore}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default BilanzKarte;
