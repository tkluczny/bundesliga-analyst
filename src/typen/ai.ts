// Typen für die Kommunikation mit der OpenAI-API (vgl. Modul 05, Abschnitt 2.1)

export type Rolle = 'system' | 'user' | 'assistant';

export interface Nachricht {
  role: Rolle;
  content: string;
}

/** Ein einzelnes Datenpaket (Chunk) der Streaming-Antwort */
export interface StreamChunk {
  choices?: Array<{
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }>;
}

/** Fehlerantwort der OpenAI-API */
export interface OpenAIFehlerAntwort {
  error?: { message?: string; code?: string | null; type?: string };
}
