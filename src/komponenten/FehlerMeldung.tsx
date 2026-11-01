interface FehlerMeldungProps {
  meldung: string;
  onNeuVersuch?: () => void;
}

// Fehlerzustand – role="alert" wird von Screenreadern sofort vorgelesen
function FehlerMeldung({ meldung, onNeuVersuch }: FehlerMeldungProps): React.JSX.Element {
  return (
    <div className="fehler-meldung" role="alert">
      <p>
        <strong>Da ist etwas schiefgelaufen:</strong> {meldung}
      </p>
      {onNeuVersuch && (
        <button type="button" className="knopf knopf-zweitrangig" onClick={onNeuVersuch}>
          Erneut versuchen
        </button>
      )}
    </div>
  );
}

export default FehlerMeldung;
