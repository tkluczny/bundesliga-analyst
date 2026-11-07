// Typen für die Umgebungsvariablen aus der Datei .env
// Vite stellt nur Variablen bereit, die mit VITE_ beginnen.
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
