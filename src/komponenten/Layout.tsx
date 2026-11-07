import { Link, Outlet } from 'react-router-dom';
import Navigation from './Navigation';

// Gemeinsamer Rahmen aller Seiten: Kopfzeile, Inhalt (Outlet) und Fußzeile
function Layout(): React.JSX.Element {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>

      <header className="kopfzeile">
        <div className="kopfzeile-inhalt">
          <Link to="/" className="logo">
            <span aria-hidden="true">⚽</span> Bundesliga-Analyst
          </Link>
          <Navigation />
        </div>
      </header>

      <main id="inhalt" className="inhalt" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="fusszeile">
        <p>
          Daten:{' '}
          <a href="https://www.openligadb.de" target="_blank" rel="noreferrer">
            OpenLigaDB
          </a>{' '}
          (Open Database License) · KI-Analysen: Google Gemini
        </p>
        <p>Einsendeaufgabe 2 · Front-End Development (SED502) · Thomas Kluczny</p>
      </footer>
    </>
  );
}

export default Layout;
