interface LadeAnzeigeProps {
  text?: string;
}

// Ladezustand – role="status" kündigt ihn Screenreadern höflich an
function LadeAnzeige({ text = 'Daten werden geladen …' }: LadeAnzeigeProps): React.JSX.Element {
  return (
    <div className="lade-anzeige" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export default LadeAnzeige;
