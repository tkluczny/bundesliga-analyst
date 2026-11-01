import { useState } from 'react';

interface WappenProps {
  url: string | null;
  teamName: string;
  groesse?: number;
}

/**
 * Vereinswappen. Das Bild ist dekorativ (alt=""), weil der Vereinsname
 * immer daneben als Text steht. Fehlt das Bild, erscheint ein Platzhalter.
 */
function Wappen({ url, teamName, groesse = 28 }: WappenProps): React.JSX.Element {
  const [ladeFehler, setLadeFehler] = useState<boolean>(false);

  if (!url || ladeFehler) {
    return (
      <span
        className="wappen wappen-platzhalter"
        style={{ width: groesse, height: groesse }}
        aria-hidden="true"
      >
        {teamName.charAt(0)}
      </span>
    );
  }

  return (
    <img
      className="wappen"
      src={url}
      alt=""
      width={groesse}
      height={groesse}
      loading="lazy"
      decoding="async"
      onError={() => setLadeFehler(true)}
    />
  );
}

export default Wappen;
