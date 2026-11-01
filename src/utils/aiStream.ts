import type { Nachricht, OpenAIFehlerAntwort, StreamChunk } from '../typen/ai';

const API_URL = 'https://api.openai.com/v1/chat/completions';

/** Standardmodell, falls in der .env keines angegeben ist (VITE_OPENAI_MODEL) */
const STANDARD_MODELL = 'gpt-4o-mini';

/** Obergrenze für die Länge einer Antwort – begrenzt auch die Kosten */
const MAX_TOKENS = 1500;

/** Übersetzt Fehlerantworten der API in verständliche deutsche Meldungen */
async function fehlerText(antwort: Response, modell: string): Promise<string> {
  let details: OpenAIFehlerAntwort = {};
  try {
    details = (await antwort.json()) as OpenAIFehlerAntwort;
  } catch {
    // Antwort war kein JSON – dann bleibt es bei der allgemeinen Meldung
  }
  const code = details.error?.code ?? '';
  const meldung = details.error?.message ?? '';

  if (antwort.status === 401) {
    return 'Der OpenAI-API-Key ist ungültig. Bitte den Key in der Datei .env prüfen.';
  }
  if (antwort.status === 429 && code === 'insufficient_quota') {
    return 'Das OpenAI-Guthaben ist aufgebraucht oder das Ausgabenlimit erreicht.';
  }
  if (antwort.status === 429) {
    return 'Zu viele Anfragen in kurzer Zeit. Bitte einen Moment warten und erneut versuchen.';
  }
  if (antwort.status === 404 || code === 'model_not_found') {
    return `Das KI-Modell „${modell}“ ist für diesen API-Key nicht verfügbar. Bitte in der .env unter VITE_OPENAI_MODEL ein verfügbares Modell eintragen.`;
  }
  return `Die KI hat einen Fehler gemeldet (HTTP ${antwort.status})${meldung ? `: ${meldung}` : '.'}`;
}

/**
 * Sendet Nachrichten an die OpenAI-API und liefert die Antwort Token für Token (Streaming).
 *
 * Gegenüber dem Beispiel aus Modul 05 (Abschnitt 3.2) zwei Verbesserungen:
 * 1. Puffer: Ein Chunk kann mitten in einer Zeile enden. Unvollständige Zeilen werden
 *    aufgehoben und mit dem nächsten Chunk zusammengesetzt – sonst gingen Wörter verloren.
 * 2. Abbruch: Über das AbortSignal kann die laufende Antwort jederzeit gestoppt werden.
 */
export async function streamChat(
  nachrichten: Nachricht[],
  onToken: (token: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Kein OpenAI-API-Key gefunden. Bitte VITE_OPENAI_API_KEY in der Datei .env eintragen und den Entwicklungsserver neu starten.',
    );
  }
  const modell = import.meta.env.VITE_OPENAI_MODEL || STANDARD_MODELL;

  let antwort: Response;
  try {
    antwort = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modell,
        messages: nachrichten,
        stream: true,
        max_completion_tokens: MAX_TOKENS,
      }),
      signal,
    });
  } catch (fehler) {
    if (signal.aborted) throw fehler;
    throw new Error('Die KI ist gerade nicht erreichbar. Bitte die Internetverbindung prüfen.');
  }

  if (!antwort.ok) {
    throw new Error(await fehlerText(antwort, modell));
  }

  const reader = antwort.body?.getReader();
  if (!reader) throw new Error('Die KI-Antwort enthält keinen Datenstrom.');

  const decoder = new TextDecoder();
  let puffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    puffer += decoder.decode(value, { stream: true });
    const zeilen = puffer.split('\n');
    puffer = zeilen.pop() ?? ''; // letzte, evtl. unvollständige Zeile aufheben

    for (const zeile of zeilen) {
      const inhalt = zeile.trim();
      if (!inhalt.startsWith('data:')) continue; // Leerzeilen o. Ä. überspringen

      const daten = inhalt.slice(5).trim();
      if (daten === '[DONE]') return; // Ende des Streams

      try {
        const chunk = JSON.parse(daten) as StreamChunk;
        const token = chunk.choices?.[0]?.delta?.content;
        if (token) onToken(token);
      } catch {
        // Defektes Paket ignorieren, der Stream läuft weiter
      }
    }
  }
}
