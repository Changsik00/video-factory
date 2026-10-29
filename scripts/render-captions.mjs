#!/usr/bin/env node
// 자막 컴포넌트 × 배경 블록 조합을 같은 SRT 로 조립·검사·렌더하고 결과를 누적 기록한다.
//   node scripts/render-captions.mjs --dry-run                       SRT 검증, 레지스트리 이름 확인만
//   node scripts/render-captions.mjs [--only=a,b] [--backdrops=x,y]  지정한 조합 (기본: 16개 스타일, 배경 없음)
//   옵션: --scrim  --force(끝난 조합 재실행)  --quality=draft  --timeout=300
//   --backdrop=<블록> 은 --backdrops 의 별칭. 배경 이름이 catalog/validation/backdrops.json 에 있으면 길이를 읽어 반복 마운트한다.
// 결과는 runs/phase-01/captions-matrix.json 에 누적되어 중간에 끊겨도 이어서 실행된다.
// 실패는 그대로 기록한다. 모의 성공 결과를 만들지 않는다.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { hostHtml, injectCaptions, readDuration } from './lib/captions-inject.mjs';
import { comboKey, labelFor, outputName, planCombos } from './lib/matrix.mjs';
import { parseSrt, toWords, validateCues } from './lib/srt.mjs';
import { classify, metaMismatches } from './lib/summarize.mjs';
import { assetCopies, backdropVerdict, compositionPath, hasScriptError, inferReason, missingFromRegistry, parseSignalstats, parseYavg, renderWarningCodes, summarizeCheck, tail, visualVerdict } from './lib/diagnose.mjs';

const HF_VERSION = '0.8.206';
const REGISTRY_INDEX = 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/registry.json';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUN_DIR = path.join(ROOT, 'runs', 'phase-01');
const SANDBOX = path.join(RUN_DIR, 'cap-sandbox');
const RESULTS = path.join(RUN_DIR, 'captions-matrix.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const quality = args.quality ?? 'draft';
const timeoutMs = Number(args.timeout ?? 300) * 1000;
const scrim = Boolean(args.scrim);
const list = (v) => (typeof v === 'string' ? v.split(',').filter(Boolean) : []);

const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_SKIP_SKILLS: '1', HYPERFRAMES_NO_UPDATE_CHECK: '1' };

function hf(hfArgs, cwd) {
  const t0 = Date.now();
  const r = spawnSync('npx', ['--yes', `hyperframes@${HF_VERSION}`, ...hfArgs], {
    cwd, env, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024,
  });
  const timedOut = r.error?.code === 'ETIMEDOUT';
  return { status: timedOut ? -1 : (r.status ?? -1), stdout: r.stdout ?? '', stderr: (r.stderr ?? '') + (r.error && !timedOut ? String(r.error) : ''), ms: Date.now() - t0, timedOut };
}

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration,codec_name', '-of', 'json', file], { encoding: 'utf8' });
  if (r.status !== 0) return undefined;
  const s = JSON.parse(r.stdout).streams?.[0];
  return s ? { width: s.width, height: s.height, duration: Number(s.duration), codec: s.codec_name } : undefined;
}

function visualStats(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'signalstats,metadata=print:file=-', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) return undefined;
  const text = (r.stdout ?? '') + (r.stderr ?? '');
  return { ...parseSignalstats(text), yavgMean: parseYavg(text) };
}

const cfg = JSON.parse(readFileSync(path.join(ROOT, 'catalog/validation/caption-styles.json'), 'utf8'));
const backdropMeta = Object.fromEntries(JSON.parse(readFileSync(path.join(ROOT, 'catalog/validation/backdrops.json'), 'utf8')).backdrops.map((b) => [b.name, b]));
const only = list(args.only);
const styles = only.length ? [...cfg.styles, ...cfg.fallbacks].filter((n) => only.includes(n)) : cfg.styles;
const backdrops = list(args.backdrops ?? args.backdrop);
if (styles.length === 0) {
  console.error('대상 스타일이 없습니다.');
  process.exit(2);
}

const cues = parseSrt(readFileSync(path.join(ROOT, 'catalog/validation/captions.srt'), 'utf8'));
const words = toWords(cues);

let registryItems;
try {
  const res = await fetch(REGISTRY_INDEX);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  registryItems = (await res.json()).items;
} catch (e) {
  console.error(`레지스트리 인덱스를 가져오지 못했습니다: ${e.message}`);
  process.exit(2);
}
const missingStyles = missingFromRegistry(styles, registryItems, 'hyperframes:component');
const missingBackdrops = missingFromRegistry(backdrops, registryItems);
console.log(`SRT 구간 ${cues.length}개, 단어 ${words.length}개 / 스타일 ${styles.length}개, 배경 ${backdrops.length}개 / 레지스트리에 없음: 스타일 ${missingStyles.length}${missingStyles.length ? ' (' + missingStyles.join(', ') + ')' : ''}, 배경 ${missingBackdrops.length}${missingBackdrops.length ? ' (' + missingBackdrops.join(', ') + ')' : ''}`);

const prior = existsSync(RESULTS) ? JSON.parse(readFileSync(RESULTS, 'utf8')).rows ?? [] : [];
const plan = planCombos({ styles, backdrops, scrim, done: prior.map((r) => r.key), force: Boolean(args.force) });
console.log(`조합 ${plan.length}개 실행 예정 (이미 끝난 ${styles.length * Math.max(backdrops.length, 1) - plan.length}개 건너뜀)`);

if (args['dry-run']) {
  const errs = validateCues(cues, 8);
  errs.forEach((e) => console.error(`SRT 오류 [${e.code}] 구간 ${e.index}: ${e.message}`));
  process.exit(missingStyles.length || missingBackdrops.length || errs.length ? 1 : 0);
}

mkdirSync(RUN_DIR, { recursive: true });
if (!existsSync(path.join(SANDBOX, 'hyperframes.json'))) {
  const init = hf(['init', 'cap-sandbox', '--non-interactive', '--skip-skills', '--skip-transcribe'], RUN_DIR);
  if (init.status !== 0) {
    console.error(`샌드박스 init 실패:\n${tail(init.stderr, 15)}`);
    process.exit(1);
  }
}
mkdirSync(path.join(SANDBOX, 'renders'), { recursive: true });

const rows = [...prior];
const save = () => writeFileSync(RESULTS, JSON.stringify({ hyperframes: HF_VERSION, quality, srt: cues, rows }, null, 2));

// 스타일은 처음에 한 번만 설치한다.
const installed = {};
for (const name of new Set(plan.map((c) => c.style))) {
  const add = hf(['add', name, '--json', '--no-clipboard'], SANDBOX);
  if (add.status !== 0) installed[name] = { error: { stage: 'add', ms: add.ms, reason: inferReason(add.stderr, add), log: tail(add.stderr || add.stdout, 15) } };
  else installed[name] = { file: JSON.parse(add.stdout).written?.[0] };
}

let currentBackdrop = undefined;
let backdropRef = null;
function useBackdrop(name) {
  if (name === currentBackdrop) return backdropRef;
  currentBackdrop = name;
  backdropRef = null;
  if (!name) return null;
  const add = hf(['add', name, '--json', '--no-clipboard'], SANDBOX);
  if (add.status !== 0) { backdropRef = { error: tail(add.stderr || add.stdout, 15) }; return backdropRef; }
  const written = JSON.parse(add.stdout).written ?? [];
  for (const c of assetCopies(written, SANDBOX)) { mkdirSync(path.dirname(c.to), { recursive: true }); copyFileSync(c.from, c.to); }
  const meta = backdropMeta[name];
  const src = compositionPath(name, written, SANDBOX) ?? `compositions/${name}.html`;
  if (!meta?.repeat) { backdropRef = { id: name, src, duration: meta?.duration }; return backdropRef; }
  // 8초보다 짧은 배경은 블록을 한 번 렌더하고 ffmpeg 로 이어 붙인 영상 파일로 깐다.
  const loopRel = `assets/backdrops/${name}-loop.mp4`;
  if (!existsSync(path.join(SANDBOX, loopRel))) {
    const srcOut = path.join('renders', `${name}-src.mp4`);
    const r = hf(['render', '--composition', src, '--quality', quality, '--output', srcOut, '--quiet'], SANDBOX);
    if (r.status !== 0) { backdropRef = { error: `배경 블록 렌더 실패: ${tail(r.stderr || r.stdout, 10)}` }; return backdropRef; }
    mkdirSync(path.join(SANDBOX, 'assets', 'backdrops'), { recursive: true });
    const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-stream_loop', '-1', '-i', path.join(SANDBOX, srcOut), '-t', '10', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path.join(SANDBOX, loopRel)], { encoding: 'utf8' });
    if (ff.status !== 0) { backdropRef = { error: `배경 반복 영상 생성 실패: ${tail(ff.stderr, 10)}` }; return backdropRef; }
  }
  backdropRef = { id: name, video: loopRel };
  return backdropRef;
}

for (const combo of plan) {
  const key = comboKey(combo);
  const record = { key, name: combo.style, backdrop: combo.backdrop, scrim: combo.scrim, group: combo.backdrop ?? 'caption', renderExit: -1 };
  const idx = rows.findIndex((r) => r.key === key);
  const inst = installed[combo.style];
  const bd = useBackdrop(combo.backdrop);
  if (inst.error) Object.assign(record, inst.error);
  else if (bd?.error) Object.assign(record, { stage: 'backdrop', ms: 0, reason: 'backdrop', log: bd.error });
  else {
    try {
      const src = readFileSync(inst.file, 'utf8');
      const duration = readDuration(src);
      const errs = validateCues(cues, duration);
      if (errs.length) throw new Error(`SRT 오류: ${errs.map((e) => e.code).join(',')}`);
      const rel = `compositions/${combo.style}-ko.html`;
      writeFileSync(path.join(SANDBOX, rel), injectCaptions(src, cues));
      writeFileSync(path.join(SANDBOX, 'index.html'), hostHtml({ id: combo.style, src: rel, duration, backdrop: bd, scrim: combo.scrim, label: labelFor(combo) }));
      record.expected = { width: 1920, height: 1080, duration };

      const check = hf(['check', '--json'], SANDBOX);
      let sum = null;
      try { sum = summarizeCheck(JSON.parse(check.stdout), { own: [`${combo.style}-ko.html`, 'index.html'], backdrop: bd?.src ? path.basename(bd.src) : null }); } catch { /* JSON 이 아니면 요약 없음 */ }
      record.check = sum ? { exit: check.status, ...sum } : { exit: check.status, summary: 'unparsed', raw: tail(check.stdout || check.stderr, 6) };

      const out = path.join('renders', outputName(combo));
      const renderArgs = ['render', '--quality', quality, '--output', out, '--quiet'];
      let r = hf(renderArgs, SANDBOX);
      let attempts = 1;
      if (r.timedOut) { r = hf(renderArgs, SANDBOX); attempts = 2; } // 재시도는 타임아웃일 때만, 1회
      const codes = renderWarningCodes(`${r.stdout}\n${r.stderr}`);
      Object.assign(record, { stage: 'render', attempts, ms: r.ms + check.ms, renderExit: r.status, output: out, renderWarnings: codes });
      if (r.status === 0 && hasScriptError(codes)) {
        // exit 0 이어도 컴포지션 스크립트가 터져 자막이 비어 있다 (script_error_isolated): 성공으로 치지 않는다
        Object.assign(record, { renderExit: 1, reason: 'script_error', log: tail(`${r.stdout}\n${r.stderr}`, 12) });
      } else if (r.status === 0) {
        record.probe = probe(path.join(SANDBOX, out));
        const vs = visualStats(path.join(SANDBOX, out));
        record.visual = vs ? { ...vs, verdict: visualVerdict(vs) } : { verdict: 'unknown' };
      } else Object.assign(record, { reason: inferReason(`${r.stderr}\n${r.stdout}`, r), log: tail(r.stderr || r.stdout, 15) });
    } catch (e) {
      Object.assign(record, { stage: 'assemble', ms: 0, reason: 'assemble', log: String(e.message) });
    }
  }
  record.status = classify(record);
  if (record.status === 'success' && record.visual && record.visual.verdict !== 'ok') {
    record.status = 'partial';
    record.reason = `visual: ${record.visual.verdict}`;
  } else if (record.status === 'success' && record.backdrop && backdropVerdict(record.visual?.yavgMean, backdropMeta[record.backdrop]?.yavg) === 'backdrop_missing') {
    record.status = 'partial';
    record.reason = `backdrop_missing (평균 밝기 ${record.visual.yavgMean.toFixed(0)} < 배경 ${backdropMeta[record.backdrop].yavg} 의 절반)`;
  } else if (record.status === 'success' && record.check && !record.check.ok) {
    record.status = 'partial';
    record.reason = `check: ${record.check.errors ?? '?'} error(s) ${(record.check.codes ?? []).filter((c) => c !== 'negative_z_index').join(',')}`.trim();
  } else if (record.status === 'partial') record.reason = metaMismatches(record).join('; ') || 'no ffprobe result';
  if (idx >= 0) rows[idx] = record; else rows.push(record);
  save();
  console.log(`${record.status.padEnd(7)} ${combo.style} on ${combo.backdrop ?? '-'}${combo.scrim ? ' +scrim' : ''} (${((record.ms ?? 0) / 1000).toFixed(1)}s) check=${record.check ? `${record.check.ok ? 'ok' : 'FAIL'} e${record.check.errors ?? '?'} w${record.check.warnings ?? '?'}` : '-'}${record.reason ? ' ' + record.reason : ''}`);
  if (record.log) console.log(record.log);
}

const lines = ['| 스타일 | 배경 | scrim | 결과 | check | 화면 | 원인 | 시간(초) |', '|---|---|---|---|---|---|---|---|'];
for (const r of rows) lines.push(`| ${r.name} | ${r.backdrop ?? '-'} | ${r.scrim ? 'y' : '-'} | ${r.status} | ${r.check ? `${r.check.ok ? 'ok' : 'FAIL'} e${r.check.errors ?? '?'} w${r.check.warnings ?? '?'}` : '-'} | ${r.visual?.verdict ?? '-'} | ${r.reason ?? '-'} | ${((r.ms ?? 0) / 1000).toFixed(1)} |`);
writeFileSync(path.join(RUN_DIR, 'captions-matrix.md'), lines.join('\n') + '\n');
const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
console.log(`\n누적 ${rows.length}개: ${JSON.stringify(counts)}  → ${path.relative(ROOT, RESULTS)}`);
