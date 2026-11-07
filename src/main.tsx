import { options, render } from 'preact';
import { App } from './App';
import './styles/global.css';

// Normalize React-style camelCase SVG attributes to standard hyphenated SVG DOM attributes
const SVG_CAMEL_ATTRS: Record<string, string> = {
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  strokeMiterlimit: 'stroke-miterlimit',
  strokeOpacity: 'stroke-opacity',
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  clipRule: 'clip-rule',
  clipPath: 'clip-path',
  textAnchor: 'text-anchor',
  dominantBaseline: 'dominant-baseline',
  alignmentBaseline: 'alignment-baseline',
  pointerEvents: 'pointer-events',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontFamily: 'font-family',
  letterSpacing: 'letter-spacing',
};

const prevVNodeHook = options.vnode;
options.vnode = (vnode) => {
  if (typeof vnode.type === 'string' && vnode.props) {
    const props = vnode.props as Record<string, unknown>;
    for (const key in props) {
      const mapped = SVG_CAMEL_ATTRS[key];
      if (mapped && props[key] !== undefined) {
        props[mapped] = props[key];
        delete props[key];
      }
    }
  }
  if (prevVNodeHook) prevVNodeHook(vnode);
};

let lastViewportW = 0;
let stableViewportH = 0;

const syncViewportVars = () => {
  const w = window.innerWidth || document.documentElement.clientWidth || 360;
  const innerH = window.innerHeight || document.documentElement.clientHeight || 640;
  const vvH = window.visualViewport ? Math.round(window.visualViewport.height) : innerH;
  const rawH = Math.min(innerH, vvH);
  const activeTag = document.activeElement?.tagName;
  const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

  if (w !== lastViewportW) {
    lastViewportW = w;
    stableViewportH = rawH;
  } else if (!isTyping || rawH > stableViewportH) {
    stableViewportH = rawH;
  }

  const h = stableViewportH || rawH;
  const boardSize = Math.max(220, Math.min(w - 20, h - 180, 440));
  const docStyle = document.documentElement.style;
  docStyle.setProperty('--app-height', `${h}px`);
  docStyle.setProperty('--board-size', `${boardSize}px`);
};

syncViewportVars();
window.addEventListener('resize', syncViewportVars);
window.addEventListener('orientationchange', syncViewportVars);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncViewportVars);
}

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

