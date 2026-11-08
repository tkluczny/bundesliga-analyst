import type {
  GeminiFehlerAntwort,
  GeminiInhalt,
  GeminiStreamChunk,
  Nachricht,
} from '../typen/ai';

const API_BASIS = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Standardmodell, falls in der .env keines angegeben ist (VITE_GEMINI_MODEL).
 * "gemini-flash-latest" ist ein Alias von Google, der immer auf das aktuelle
 * Flash-Modell zeigt – so bleibt die App lauffähig, wenn Google Modelle austauscht.
 */
const STANDARD_MODELL = 'gemini-flash-latest';

/**
 * Ausweichmodelle, falls das gewählte Modell überlastet ist (HTTP 503), das Gratis-Kontingent
 * dieses Modells erschöpft ist (429) oder es nicht existiert (404). Im Test meldete Google für
 * "gemini-flash-latest" zeitweise "high demand" – die kleineren Modelle antworten dann noch.
 */
const AUSWEICH_MODELLE = ['gemini-flash-lite-latest', 'gemini-2.5-flash'];

/** HTTP-Status, bei denen ein anderes Modell versucht wird */
const AUSWEICH_STATUS = [404, 429, 500, 503];

/** Obergrenze für die Länge einer Antwort (inkl. internem "Nachdenken" des Modells) */
const MAX_TOKENS = 4096;

/**
 * Aktuelle Gemini-Modelle "denken" vor der Antwort standardmäßig sehr gründlich –
 * im Test dauerte es so über 20 Sekunden bis zum ersten Wort. Für das Zusammenfassen
 * vorgegebener Statistiken reicht eine niedrige Denkstufe; die Antwort beginnt deutlich früher.
 */
const DENKSTUFE = 'low';

/**
 * Wandelt das anbieterneutrale Nachrichtenformat der App in das Gemini-Format um:
 * - Die System-Nachricht wird zur "systemInstruction".
 * - Die Rolle "assistant" heißt bei Gemini "model".
 */
function inGeminiFormat(nachrichten: Nachricht[]): {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: GeminiInhalt[];
} {
  const systemText = nachrichten
    .filter((n) => n.role === 'system')
    .map((n) => n.content)
    .join('\n\n');

  const contents = nachrichten
    .filter((n) => n.role !== 'system')
    .map(
      (n): GeminiInhalt => ({
        role: n.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: n.content }],
      }),
    );

  return {
    ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
    contents,
  };
}

/** Übersetzt Fehlerantworten der API in verständliche deutsche Meldungen */
async function fehlerText(antwort: Response, modell: string): Promise<string> {
  let details: GeminiFehlerAntwort = {};
  try {
    details = (await antwort.json()) as GeminiFehlerAntwort;
  } catch {
    // Antwort war kein JSON – dann bleibt es bei der allgemeinen Meldung
  }
  const meldung = details.error?.message ?? '';

  if (antwort.status === 400 && /api key/i.test(meldung)) {
    return 'Der Gemini-API-Key ist ungültig. Bitte den Key in der Datei .env prüfen.';
  }
  if (antwort.status === 403) {
    return 'Der Gemini-API-Key hat keine Berechtigung für diese Anfrage. Bitte den Key in Google AI Studio prüfen.';
  }
  if (antwort.status === 429) {
    return 'Das Gratis-Kontingent der Gemini-API ist im Moment ausgeschöpft. Bitte etwas warten und erneut versuchen.';
  }
  if (antwort.status === 503) {
    return 'Die Gemini-Modelle sind gerade überlastet. Bitte in ein paar Minuten erneut versuchen.';
  }
  if (antwort.status === 404) {
    return `Das KI-Modell „${modell}“ ist nicht verfügbar. Bitte in der .env unter VITE_GEMINI_MODEL ein Modell aus Google AI Studio eintragen.`;
  }
  return `Die KI hat einen Fehler gemeldet (HTTP ${antwort.status})${meldung ? `: ${meldung}` : '.'}`;
}

/**
 * Sendet Nachrichten an die Google-Gemini-API und liefert die Antwort Stück für Stück (Streaming).
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Kein Gemini-API-Key gefunden. Bitte VITE_GEMINI_API_KEY in der Datei .env eintragen und den Entwicklungsserver neu starten.',
    );
  }
  const gewaehlt = import.meta.env.VITE_GEMINI_MODEL || STANDARD_MODELL;
  const modelle = [gewaehlt, ...AUSWEICH_MODELLE.filter((m) => m !== gewaehlt)];

  const sende = async (modell: string, mitDenkstufe: boolean): Promise<Response> => {
    // alt=sse: Antwort als Server-Sent Events (Zeilen der Form "data: {...}")
    const url = `${API_BASIS}/${encodeURIComponent(modell)}:streamGenerateContent?alt=sse`;
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Key im Header statt in der URL – so landet er nicht in Logs oder im Verlauf
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          ...inGeminiFormat(nachrichten),
          generationConfig: {
            maxOutputTokens: MAX_TOKENS,
            ...(mitDenkstufe ? { thinkingConfig: { thinkingLevel: DENKSTUFE } } : {}),
          },
        }),
        signal,
      });
    } catch (fehler) {
      if (signal.aborted) throw fehler;
      throw new Error('Die KI ist gerade nicht erreichbar. Bitte die Internetverbindung prüfen.');
    }
  };

  /** Sendet an ein Modell; kennt es die Denkstufe nicht (HTTP 400), wird ohne sie erneut gesendet */
  const versuche = async (modell: string): Promise<Response> => {
    const antwort = await sende(modell, true);
    if (antwort.status === 400) {
      const text = await antwort.clone().text();
      if (/thinking/i.test(text)) return sende(modell, false);
    }
    return antwort;
  };

  // Modelle der Reihe nach probieren, bis eines antwortet
  let modell = modelle[0];
  let antwort = await versuche(modell);
  for (const ersatz of modelle.slice(1)) {
    if (!AUSWEICH_STATUS.includes(antwort.status)) break;
    modell = ersatz;
    antwort = await versuche(modell);
  }

  if (!antwort.ok) {
    throw new Error(await fehlerText(antwort, modell));
  }

  const reader = antwort.body?.getReader();
  if (!reader) throw new Error('Die KI-Antwort enthält keinen Datenstrom.');

  const decoder = new TextDecoder();
  let puffer = '';
  let hatText = false;
  let blockGrund: string | null = null;

  /** Verarbeitet eine vollständige Zeile des Datenstroms */
  const verarbeiteZeile = (zeile: string): void => {
    const inhalt = zeile.trim();
    if (!inhalt.startsWith('data:')) return; // Leerzeilen o. Ä. überspringen

    try {
      const chunk = JSON.parse(inhalt.slice(5).trim()) as GeminiStreamChunk;
      blockGrund = chunk.promptFeedback?.blockReason ?? blockGrund;
      const teile = chunk.candidates?.[0]?.content?.parts ?? [];
      for (const teil of teile) {
        if (teil.text && !teil.thought) {
          hatText = true;
          onToken(teil.text);
        }
      }
    } catch {
      // Defektes Paket ignorieren, der Stream läuft weiter
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    puffer += decoder.decode(value, { stream: true });
    const zeilen = puffer.split('\n');
    puffer = zeilen.pop() ?? ''; // letzte, evtl. unvollständige Zeile aufheben
    zeilen.forEach(verarbeiteZeile);
  }
  verarbeiteZeile(puffer); // Rest nach Ende des Streams

  if (!hatText) {
    throw new Error(
      blockGrund
        ? `Die KI hat die Anfrage aus Sicherheitsgründen abgelehnt (${blockGrund}).`
        : 'Die KI hat keine Antwort geliefert. Bitte erneut versuchen.',
    );
  }
}
