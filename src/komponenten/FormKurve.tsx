import type { SpielAusgang } from '../typen/app';

interface FormKurveProps {
  form: SpielAusgang[];
}

const BEDEUTUNG: Record<SpielAusgang, string> = {
  S: 'Sieg',
  U: 'Unentschieden',
  N: 'Niederlage',
};

/** Die letzten Ergebnisse als farbige Kürzel – Farbe UND Buchstabe, nie nur Farbe */
function FormKurve({ form }: FormKurveProps): React.JSX.Element {
  if (form.length === 0) return <p>Noch keine Spiele in dieser Saison.</p>;

  return (
    <ol className="form-kurve" aria-label="Formkurve der letzten Spiele, ältestes zuerst">
      {form.map((ergebnis, index) => (
        <li key={index} className={`form-${ergebnis}`} title={BEDEUTUNG[ergebnis]}>
          <span aria-hidden="true">{ergebnis}</span>
          <span className="sr-only">{BEDEUTUNG[ergebnis]}</span>
        </li>
      ))}
    </ol>
  );
}

export default FormKurve;
