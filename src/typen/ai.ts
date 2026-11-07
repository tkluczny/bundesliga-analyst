// Typen für die Kommunikation mit der KI (vgl. Modul 05, Abschnitt 2.1)

/**
 * Anbieterneutrales Nachrichtenformat der App. Die Umwandlung in das Format
 * der Google-Gemini-API passiert ausschließlich in utils/aiStream.ts.
 */
export type Rolle = 'system' | 'user' | 'assistant';

export interface Nachricht {
  role: Rolle;
  content: string;
}

// ---------- Format der Google-Gemini-API ----------

export interface GeminiTeil {
  text?: string;
  /** true bei internen "Denk"-Teilen des Modells – die zeigen wir nicht an */
  thought?: boolean;
}

export interface GeminiInhalt {
  role: 'user' | 'model';
  parts: GeminiTeil[];
}

/** Ein einzelnes Datenpaket (Chunk) der Streaming-Antwort */
export interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: GeminiTeil[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

/** Fehlerantwort der Gemini-API */
export interface GeminiFehlerAntwort {
  error?: { code?: number; message?: string; status?: string };
}
