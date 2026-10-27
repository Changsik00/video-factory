// 렌더 실패 진단용 순수 함수. 외부 도구를 호출하지 않는다.
const ANSI = /\u001b\[[0-9;]*m/g;

export function tail(text, lines) {
  if (!text) return '';
  const all = text.replace(ANSI, '').split('\n').filter((l) => l.trim() !== '');
  return all.slice(-lines).join('\n');
}

const RULES = [
  ['gpu', /webgpu|navigator\.gpu|gpu adapter|webgl|gpu process|swiftshader/i],
  ['network', /ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed|network/i],
  ['font', /\bfont\b/i],
];

export function inferReason(stderr, { timedOut = false } = {}) {
  if (timedOut) return 'timeout';
  const text = (stderr ?? '').replace(ANSI, '');
  for (const [reason, re] of RULES) if (re.test(text)) return reason;
  return 'other';
}

export function missingFromRegistry(names, items) {
  const blocks = new Set(items.filter((i) => i.type === 'hyperframes:block').map((i) => i.name));
  return names.filter((n) => !blocks.has(n));
}
