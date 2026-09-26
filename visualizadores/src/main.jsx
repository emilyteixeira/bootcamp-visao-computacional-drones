import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// Fontes embutidas no bundle (subconjunto latin, cobre acentos do português):
// mesma renderização no navegador, no Pages e nos testes visuais da CI.
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import './estilos.css';

createRoot(document.getElementById('raiz')).render(<App />);
