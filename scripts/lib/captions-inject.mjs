// 레지스트리 자막 컴포넌트(독립 HTML)의 예시 단어·묶음을 우리 데이터로 치환한다.
// 컴포넌트는 `var WORDS = [...]` 또는 `var TRANSCRIPT = [...]` 에 {text,start,end} 를 갖는다.
// 일부는 `var RAW_GROUPS = [[첫,끝], ...]` 리터럴로 묶음을 직접 지정한다.

// 구간마다 단어 인덱스 [첫, 끝] 쌍. 단어 분배(toWords)와 같은 기준(공백)으로 센다.
export function cueGroups(cues) {
  let next = 0;
  return cues.map((c) => {
    const n = c.text.split(/\s+/).filter(Boolean).length;
    const pair = [next, next + n - 1];
    next += n;
    return pair;
  });
}

// `var NAME = [` 부터 짝이 맞는 `]` 와 이어지는 `;` 까지의 범위를 찾는다. 문자열 안의 괄호는 무시한다.
function findLiteral(html, name) {
  const m = new RegExp(`var ${name}\\s*=\\s*\\[`).exec(html);
  if (!m) return null;
  const open = m.index + m[0].length - 1;
  let depth = 0;
  let quote = null;
  for (let i = open; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) {
      const end = html[i + 1] === ';' ? i + 2 : i + 1;
      return { start: m.index, end };
    }
  }
  return null;
}

const q = (s) => JSON.stringify(s); // 따옴표·역슬래시 이스케이프

export function injectWords(html, words, groups) {
  const target = ['WORDS', 'TRANSCRIPT'].find((n) => findLiteral(html, n));
  if (!target) throw new Error('컴포넌트에서 단어 배열(var WORDS / var TRANSCRIPT)을 찾지 못했습니다');
  const body = words.map((w) => `    { text: ${q(w.text)}, start: ${w.start}, end: ${w.end} },`).join('\n');
  const lit = findLiteral(html, target);
  let out = `${html.slice(0, lit.start)}var ${target} = [\n${body}\n  ];${html.slice(lit.end)}`;
  const raw = findLiteral(out, 'RAW_GROUPS');
  if (raw) {
    const pairs = groups.map(([a, b]) => `    [${a}, ${b}],`).join('\n');
    out = `${out.slice(0, raw.start)}var RAW_GROUPS = [\n${pairs}\n  ];${out.slice(raw.end)}`;
  }
  return out;
}

export function readDuration(html) {
  const m = /data-composition-id="[^"]*"[^>]*?data-duration="([\d.]+)"/s.exec(html) ?? /data-duration="([\d.]+)"/.exec(html);
  if (!m) throw new Error('컴포넌트에서 data-duration 을 찾지 못했습니다');
  return Number(m[1]);
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 루트 컴포지션이 자막 컴포넌트를 마운트하는 공식 배선(wiring-blocks). 배경 블록은 자막보다 아래 레이어.
// 기본 바탕은 자막이 보이도록 어두운 단색.
//   backdrop.duration 이 duration 보다 짧으면 이어 붙여 반복 마운트한다 (2초 셰이더 블록 등).
//   scrim: 배경과 자막 사이의 어두운 그라데이션 막.  label: 구석의 작은 표기(모음 영상용).
export function hostHtml({ id, src, duration, backdrop, label, scrim }) {
  const attrs = (compId, compSrc, start, dur, track) =>
    `data-composition-id="${compId}" data-composition-src="${compSrc}" data-start="${start}" data-duration="${dur}" data-track-index="${track}" data-width="1920" data-height="1080"`;
  const layers = [];
  if (backdrop) {
    const len = backdrop.duration > 0 && backdrop.duration < duration ? backdrop.duration : duration;
    for (let start = 0, n = 0; start < duration; start += len, n++) {
      const dur = Math.min(len, duration - start);
      layers.push(`<div id="${n === 0 ? 'backdrop' : `backdrop-${n}`}" ${attrs(backdrop.id, backdrop.src, start, dur, 0)}></div>`);
    }
  }
  if (scrim) {
    layers.push(`<div id="scrim" class="clip" data-start="0" data-duration="${duration}" data-track-index="1" style="position:absolute;left:0;bottom:0;width:1920px;height:460px;background:linear-gradient(to top,rgba(0,0,0,0.72),rgba(0,0,0,0));z-index:5;"></div>`);
  }
  layers.push(`<div id="caption-host" ${attrs(id, src, 0, duration, scrim ? 2 : 1)}></div>`);
  if (label) {
    layers.push(`<div id="label" class="clip" data-start="0" data-duration="${duration}" data-track-index="9" style="position:absolute;left:32px;top:24px;font:600 22px sans-serif;color:#fff;background:rgba(0,0,0,0.55);padding:6px 12px;border-radius:6px;z-index:50;">${esc(label)}</div>`);
  }
  const body = layers.map((l) => `      ${l}`).join('\n');
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #1f2430; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="1920" data-height="1080">
${body}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
}
