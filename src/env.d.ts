// Typen für die Umgebungsvariablen aus der Datei .env
// Vite stellt nur Variablen bereit, die mit VITE_ beginnen.
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
