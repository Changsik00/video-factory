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
