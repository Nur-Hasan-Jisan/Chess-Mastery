const engineUrl = `${self.location.origin}/stockfish-18-lite-single.js`;

try {
  const engine = new Worker(engineUrl);
  engine.addEventListener('message', (event) => {
    self.postMessage(event.data);
    if (typeof event.data === 'string' && event.data.includes('uciok')) self.postMessage({ type: 'ready' });
  });
  engine.addEventListener('error', (event) => self.postMessage({ type: 'error', reason: event.message || 'Stockfish WASM could not be loaded' }));
  engine.addEventListener('messageerror', () => self.postMessage({ type: 'error', reason: 'Stockfish returned an unreadable worker message' }));
  self.onmessage = (event) => engine.postMessage(event.data);
} catch {
  self.postMessage({ type: 'error', reason: 'Stockfish worker is unavailable in this browser' });
}
