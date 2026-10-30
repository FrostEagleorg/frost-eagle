// Builds the 1200x630 share card shown when a page is posted to LinkedIn and elsewhere.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { STAGES, AUTHOR } from '../config';

const require = createRequire(import.meta.url);
const fontDir = require.resolve('@fontsource/schibsted-grotesk/package.json').replace('package.json', 'files/');
const bold = readFileSync(fontDir + 'schibsted-grotesk-latin-700-normal.woff');
const medium = readFileSync(fontDir + 'schibsted-grotesk-latin-500-normal.woff');

const C = { frost: '#EEF3F6', ink: '#14293A', slate: '#536676', glacier: '#1D6A86', talon: '#A2741A', rule: '#C7D4DD' };

const mark = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#14293A"/><path d="M5 11 L16 22 L27 11" fill="none" stroke="#EEF3F6" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 9 L16 14 L21 9" fill="none" stroke="#7FB3C8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
).toString('base64')}`;

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): El => ({
  type,
  props: { style, children, ...extra },
});

export async function renderCard(title: string, kicker: string, stage?: string): Promise<Buffer> {
  const size = title.length > 70 ? 58 : title.length > 45 ? 66 : 76;

  // The pipeline motif, drawn as one small SVG so the layout engine can't distort it.
  const pw = 520, ph = 24, r = 9, step = (pw - 2 * (r + 2)) / (STAGES.length - 1);
  const dots = STAGES.map((s, i) => {
    const x = r + 2 + i * step;
    const on = s.slug === stage;
    return `<circle cx="${x}" cy="${ph / 2}" r="${r}" fill="${on ? C.talon : C.frost}" stroke="${on ? C.talon : C.glacier}" stroke-width="3"/>`;
  }).join('');
  const pipeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}"><line x1="${r + 2}" y1="${ph / 2}" x2="${pw - r - 2}" y2="${ph / 2}" stroke="${C.glacier}" stroke-width="3"/>${dots}</svg>`;
  const pipeline = h('img', { width: pw, height: ph }, undefined, {
    src: `data:image/svg+xml;base64,${Buffer.from(pipeSvg).toString('base64')}`,
    width: pw,
    height: ph,
  });

  const tree = h(
    'div',
    {
      // padding is added to these dimensions, so subtract it to land on 1200x630
      width: 1200 - 152,
      height: 630 - 128,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 76px',
      background: C.frost,
      fontFamily: 'Schibsted',
      color: C.ink,
    },
    [
      h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
        h('img', { width: 52, height: 52 }, undefined, { src: mark, width: 52, height: 52 }),
        h('div', { fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }, 'Frost Eagle'),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        h('div', { fontSize: 26, fontWeight: 500, color: C.glacier }, kicker),
        h('div', { fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: -1.5, maxWidth: 1040 }, title),
      ]),
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        h('div', { fontSize: 26, fontWeight: 500, color: C.slate }, `${AUTHOR.name}, frosteagle.com`),
        pipeline,
      ]),
    ]
  );

  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Schibsted', data: bold, weight: 700, style: 'normal' },
      { name: 'Schibsted', data: medium, weight: 500, style: 'normal' },
    ],
  });
  return new Resvg(svg).render().asPng();
}
