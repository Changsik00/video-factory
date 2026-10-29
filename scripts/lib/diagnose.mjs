// 렌더 실패 진단용 순수 함수. 외부 도구를 호출하지 않는다.
import path from 'node:path';
const ANSI = /\u001b\[[0-9;]*m/g;

export function tail(text, lines) {
  if (!text) return '';
  const all = text.replace(ANSI, '').split('\n').filter((l) => l.trim() !== '');
  return all.slice(-lines).join('\n');
}

// 순서가 중요하다: 구체적인 원인을 먼저 본다. 정상 로그에도 "WebGL renderer ..." 정보 줄이 나오므로
// gpu 는 실제 실패 문구(어댑터 없음, 컨텍스트 생성 실패 등)에만 반응한다.
const RULES = [
  ['navigation_timeout', /Navigation timeout/i],
  ['script_error', /sub_timeline_script_failure|script_error_isolated/i],
  ['gpu', /No WebGPU adapter|navigator\.gpu (is )?undefined|gpu adapter|WebGL context (creation )?(failed|lost)|gpu process|swiftshader/i],
  ['network', /ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed|network/i],
  ['font', /\bfont\b/i],
];

export function inferReason(stderr, { timedOut = false } = {}) {
  if (timedOut) return 'timeout';
  const text = (stderr ?? '').replace(ANSI, '');
  for (const [reason, re] of RULES) if (re.test(text)) return reason;
  return 'other';
}

export function missingFromRegistry(names, items, type = 'hyperframes:block') {
  const found = new Set(items.filter((i) => i.type === type).map((i) => i.name));
  return names.filter((n) => !found.has(n));
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

// 하위 폴더에 설치된 블록의 assets 를 렌더러가 찾는 프로젝트 루트 assets 로 복사할 목록.
// (렌더러는 `/assets/...` 를 프로젝트 루트에서 찾는다 — canopy-part-title 에서 404 로 확인)
export function assetCopies(written, projectDir) {
  const rootAssets = path.join(projectDir, 'assets') + path.sep;
  const out = [];
  for (const f of written) {
    const rel = path.relative(path.join(projectDir, 'compositions'), f);
    const m = rel.split(path.sep);
    const i = m.indexOf('assets');
    if (!rel.startsWith('..') && i > 0 && f.startsWith(path.join(projectDir, 'compositions'))) {
      out.push({ from: f, to: rootAssets + m.slice(i + 1).join(path.sep) });
    }
  }
  return out;
}

// `hyperframes check --json` 결과를 요약한다. 형태를 모르면 null (통과로 간주하지 않는다).
// check 는 샌드박스 프로젝트 전체를 린트하므로 이전 조합의 파일 결과가 섞인다. scope 를 주면
//   own      이번 조합의 자막 파일·index.html (sourceFile 이 없는 결과도 보수적으로 여기에 센다)
//   backdrop 배경 블록 파일: 따로 센다
//   그 밖     foreign 개수로만 세고 무시한다.
// scope 가 없으면 섹션 합계(기존 동작).
const CHECK_SECTIONS = ['lint', 'runtime', 'layout', 'motion', 'contrast'];

export function summarizeCheck(json, scope) {
  if (!json || typeof json !== 'object' || !CHECK_SECTIONS.some((k) => json[k])) return null;
  const disabled = CHECK_SECTIONS.filter((k) => json[k]?.enabled === false);
  const c = json.contrast;
  const contrast = c?.enabled ? { checked: c.checked, passed: c.passed } : undefined;
  if (!scope) {
    let errors = 0;
    let warnings = 0;
    for (const k of CHECK_SECTIONS) {
      errors += json[k]?.errorCount ?? 0;
      warnings += json[k]?.warningCount ?? 0;
    }
    const codes = [...new Set((json.lint?.findings ?? []).map((f) => f.code))];
    return { ok: json.ok === true, errors, warnings, codes, disabled, contrast };
  }
  const own = new Set(scope.own ?? []);
  const own$ = { errors: 0, warnings: 0, codes: new Set() };
  const back = { errors: 0, warnings: 0 };
  let foreign = 0;
  for (const k of CHECK_SECTIONS) {
    for (const f of json[k]?.findings ?? json[k]?.issues ?? []) {
      const file = f.sourceFile ? path.basename(f.sourceFile) : null;
      const bucket = file === null || own.has(file) ? own$ : file === scope.backdrop ? back : null;
      if (!bucket) { foreign += 1; continue; }
      if (f.severity === 'error') bucket.errors += 1;
      else if (f.severity === 'warning') bucket.warnings += 1;
      if (bucket === own$) own$.codes.add(f.code);
    }
  }
  return { ok: own$.errors === 0, errors: own$.errors, warnings: own$.warnings, codes: [...own$.codes], backdrop: back, foreign, disabled, contrast };
}

// 렌더 출력에서 `"warningCodes":[...]` 를 모은다. exit 0 이어도 스크립트 오류가 격리된 렌더를 걸러내기 위함.
export function renderWarningCodes(text) {
  const out = new Set();
  for (const m of (text ?? '').matchAll(/"warningCodes":\[([^\]]*)\]/g)) {
    for (const c of m[1].matchAll(/"([^"]+)"/g)) out.add(c[1]);
  }
  return [...out];
}

export const hasScriptError = (codes) => codes.some((c) => c === 'script_error_isolated' || c === 'sub_timeline_script_failure');

// 렌더 영상 전체의 평균 밝기(YAVG 평균). 값이 없으면 null.
export function parseYavg(text) {
  const v = [...text.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// 배경이 중간에 사라진 렌더(예: 2초 블록이 끝난 뒤 검은 화면)를 걸러낸다.
// 렌더 평균 밝기가 배경 측정 밝기의 절반 미만이면 의심한다. 원래 어두운 배경(60 미만)은 판정하지 않는다.
const BACKDROP_JUDGE_MIN_YAVG = 60;
const BACKDROP_MISSING_RATIO = 0.5;

export function backdropVerdict(renderYavg, expectedYavg) {
  if (renderYavg == null || expectedYavg == null) return 'unknown';
  if (expectedYavg < BACKDROP_JUDGE_MIN_YAVG) return 'ok';
  return renderYavg < expectedYavg * BACKDROP_MISSING_RATIO ? 'backdrop_missing' : 'ok';
}
