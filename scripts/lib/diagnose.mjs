// 렌더 실패 진단용 순수 함수. 외부 도구를 호출하지 않는다.
import path from 'node:path';
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

// `hyperframes add --json` 의 written 목록에서 블록 본체 html 의 프로젝트 상대 경로를 찾는다.
export function compositionPath(name, written, projectDir) {
  const hit = written.find((f) => path.basename(f) === `${name}.html`);
  return hit ? path.relative(projectDir, hit) : null;
}

// ffmpeg signalstats + metadata=print 출력을 요약한다. (YDIF = 직전 프레임과의 평균 차이)
export function parseSignalstats(text) {
  const nums = (key) => [...text.matchAll(new RegExp(`lavfi\\.signalstats\\.${key}=([\\d.]+)`, 'g'))].map((m) => Number(m[1]));
  const max = nums('YMAX');
  const dif = nums('YDIF');
  if (max.length === 0) return { frames: 0, ymaxMax: 0, ydifMax: 0 };
  return { frames: max.length, ymaxMax: Math.max(...max), ydifMax: dif.length ? Math.max(...dif) : 0 };
}

const BLANK_YMAX = 20; // 가장 밝은 픽셀도 거의 검정
const STATIC_YDIF_MAX = 0.01; // 실측: 빈 프로젝트 0.005, 회전 오브 0.05, 일반 블록 0.25 이상

export function visualVerdict({ frames, ymaxMax, ydifMax }) {
  if (frames === 0) return 'unknown';
  if (ymaxMax <= BLANK_YMAX) return 'blank';
  if (ydifMax < STATIC_YDIF_MAX) return 'static';
  return 'ok';
}
