import { NavLink } from 'react-router-dom';

interface NavEintrag {
  pfad: string;
  text: string;
}

const EINTRAEGE: NavEintrag[] = [
  { pfad: '/', text: 'Tabelle' },
  { pfad: '/spieltag', text: 'Spieltag' },
  { pfad: '/duell', text: 'Duell-Vorschau' },
];

// Hauptnavigation – NavLink markiert den aktiven Eintrag automatisch
function Navigation(): React.JSX.Element {
  return (
    <nav aria-label="Hauptnavigation">
      <ul className="navigation">
        {EINTRAEGE.map((eintrag) => (
          <li key={eintrag.pfad}>
            <NavLink
              to={eintrag.pfad}
              end={eintrag.pfad === '/'}
              className={({ isActive }) => (isActive ? 'nav-link aktiv' : 'nav-link')}
            >
              {eintrag.text}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
