// Converte dist-link/index.html (documento completo) no fragmento aceito pelo publicador
// de Artifacts do claude.ai: sem <!doctype>, <html>, <head> e <body> próprios.
import { readFileSync, writeFileSync } from 'node:fs';

const origem = 'dist-link/index.html';
const html = readFileSync(origem, 'utf8')
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?html[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<\/?body[^>]*>/gi, '')
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .trim();
writeFileSync('dist-link/laboratorio-bytetrack.html', html);
console.log(`dist-link/laboratorio-bytetrack.html (${(html.length / 1024).toFixed(0)} KiB)`);
