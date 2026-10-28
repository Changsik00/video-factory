#!/usr/bin/env node
// 자막 컴포넌트를 같은 SRT 로 조립·검사·렌더하고 결과를 기록한다.
//   node scripts/render-captions.mjs --dry-run         SRT 검증과 레지스트리 이름 확인만
//   node scripts/render-captions.mjs [--only=a,b] [--quality=draft] [--timeout=300] [--backdrop=<블록>]
// 실패는 그대로 기록한다. 모의 성공 결과를 만들지 않는다.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cueGroups, hostHtml, injectWords, readDuration } from './lib/captions-inject.mjs';
import { parseSrt, toWords, validateCues } from './lib/srt.mjs';
import { classify, metaMismatches } from './lib/summarize.mjs';
import { assetCopies, compositionPath, inferReason, missingFromRegistry, parseSignalstats, summarizeCheck, tail, visualVerdict } from './lib/diagnose.mjs';

const HF_VERSION = '0.8.206';
const REGISTRY_INDEX = 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/registry.json';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUN_DIR = path.join(ROOT, 'runs', 'phase-01');
const SANDBOX = path.join(RUN_DIR, 'cap-sandbox');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const quality = args.quality ?? 'draft';
const timeoutMs = Number(args.timeout ?? 300) * 1000;
const backdropName = typeof args.backdrop === 'string' ? args.backdrop : null;
const tag = backdropName ? `-on-${backdropName}` : '';

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
  return r.status === 0 ? parseSignalstats((r.stdout ?? '') + (r.stderr ?? '')) : undefined;
}

const cfg = JSON.parse(readFileSync(path.join(ROOT, 'catalog/validation/caption-styles.json'), 'utf8'));
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const targets = (only ? [...cfg.styles, ...cfg.fallbacks].filter((n) => only.has(n)) : cfg.styles);
if (targets.length === 0) {
  console.error('대상 스타일이 없습니다.');
  process.exit(2);
}

const cues = parseSrt(readFileSync(path.join(ROOT, 'catalog/validation/captions.srt'), 'utf8'));
const words = toWords(cues);
const groups = cueGroups(cues);

let registryItems;
try {
  const res = await fetch(REGISTRY_INDEX);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  registryItems = (await res.json()).items;
} catch (e) {
  console.error(`레지스트리 인덱스를 가져오지 못했습니다: ${e.message}`);
  process.exit(2);
}
const missing = missingFromRegistry(targets, registryItems, 'hyperframes:component');
console.log(`SRT 구간 ${cues.length}개, 단어 ${words.length}개 / 대상 ${targets.length}개, 레지스트리에 없음 ${missing.length}개${missing.length ? ': ' + missing.join(', ') : ''}`);
if (args['dry-run']) {
  const errs = validateCues(cues, 8);
  errs.forEach((e) => console.error(`SRT 오류 [${e.code}] 구간 ${e.index}: ${e.message}`));
  process.exit(missing.length || errs.length ? 1 : 0);
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

let backdrop = null;
if (backdropName) {
  const add = hf(['add', backdropName, '--json', '--no-clipboard'], SANDBOX);
  if (add.status !== 0) {
    console.error(`배경 블록 설치 실패 (${backdropName}):\n${tail(add.stderr || add.stdout, 15)}`);
    process.exit(1);
  }
  const written = JSON.parse(add.stdout).written ?? [];
  for (const c of assetCopies(written, SANDBOX)) { mkdirSync(path.dirname(c.to), { recursive: true }); copyFileSync(c.from, c.to); }
  backdrop = { id: backdropName, src: compositionPath(backdropName, written, SANDBOX) ?? `compositions/${backdropName}.html` };
}

const rows = [];
for (const name of targets) {
  const record = { name, group: 'caption', renderExit: -1 };
  const add = hf(['add', name, '--json', '--no-clipboard'], SANDBOX);
  if (add.status !== 0) {
    Object.assign(record, { stage: 'add', ms: add.ms, reason: inferReason(add.stderr, add), log: tail(add.stderr || add.stdout, 15) });
  } else {
    try {
      const written = JSON.parse(add.stdout).written?.[0];
      const src = readFileSync(written, 'utf8');
      const duration = readDuration(src);
      const errs = validateCues(cues, duration);
      if (errs.length) throw new Error(`SRT 오류: ${errs.map((e) => e.code).join(',')}`);
      const rel = `compositions/${name}-ko.html`;
      writeFileSync(path.join(SANDBOX, rel), injectWords(src, words, groups));
      writeFileSync(path.join(SANDBOX, 'index.html'), hostHtml({ id: name, src: rel, duration, backdrop }));
      record.expected = { width: 1920, height: 1080, duration };

      const check = hf(['check', '--json'], SANDBOX);
      let sum = null;
      try { sum = summarizeCheck(JSON.parse(check.stdout)); } catch { /* JSON 이 아니면 요약 없음 */ }
      record.check = sum ? { exit: check.status, ...sum } : { exit: check.status, summary: 'unparsed', raw: tail(check.stdout || check.stderr, 6) };
      record.checkFull = check.stdout;

      const out = path.join('renders', `${name}-ko${tag}.mp4`);
      let r = hf(['render', '--quality', quality, '--output', out, '--quiet'], SANDBOX);
      let attempts = 1;
      if (r.timedOut) { r = hf(['render', '--quality', quality, '--output', out, '--quiet'], SANDBOX); attempts = 2; }
      Object.assign(record, { stage: 'render', attempts, ms: r.ms, renderExit: r.status, output: out });
      if (r.status === 0) {
        record.probe = probe(path.join(SANDBOX, out));
        const vs = visualStats(path.join(SANDBOX, out));
        record.visual = vs ? { ...vs, verdict: visualVerdict(vs) } : { verdict: 'unknown' };
      } else Object.assign(record, { reason: inferReason(r.stderr, r), log: tail(r.stderr || r.stdout, 15) });
    } catch (e) {
      Object.assign(record, { stage: 'assemble', ms: record.ms ?? 0, reason: 'assemble', log: String(e.message) });
    }
  }
  record.status = classify(record);
  if (record.status === 'success' && record.visual && record.visual.verdict !== 'ok') {
    record.status = 'partial';
    record.reason = `visual: ${record.visual.verdict}`;
  } else if (record.status === 'success' && record.check && !record.check.ok) {
    record.status = 'partial';
    record.reason = `check: ${record.check.errors ?? '?'} error(s) ${(record.check.codes ?? []).filter((c) => c !== 'negative_z_index').join(',')}`.trim();
  } else if (record.status === 'partial') record.reason = metaMismatches(record).join('; ') || 'no ffprobe result';
  rows.push(record);
  console.log(`${record.status.padEnd(7)} ${name} (${((record.ms ?? 0) / 1000).toFixed(1)}s) check=${record.check ? `${record.check.ok ? 'ok' : 'FAIL'} e${record.check.errors ?? '?'} w${record.check.warnings ?? '?'}` : '-'}${record.reason ? ' ' + record.reason : ''}`);
  if (record.log) console.log(record.log);
  writeFileSync(path.join(RUN_DIR, `captions-results${tag}.json`), JSON.stringify({ hyperframes: HF_VERSION, quality, backdrop: backdropName, srt: cues, rows }, null, 2));
}

const lines = ['| 스타일 | 결과 | check | 화면 | 원인 | 시간(초) |', '|---|---|---|---|---|---|'];
for (const r of rows) lines.push(`| ${r.name} | ${r.status} | ${r.check ? `${r.check.ok ? 'ok' : 'FAIL'} e${r.check.errors ?? '?'} w${r.check.warnings ?? '?'} ${(r.check.codes ?? []).join(',')}` : '-'} | ${r.visual?.verdict ?? '-'} | ${r.reason ?? '-'} | ${((r.ms ?? 0) / 1000).toFixed(1)} |`);
writeFileSync(path.join(RUN_DIR, `captions-results${tag}.md`), lines.join('\n') + '\n');
console.log('\n' + lines.join('\n'));
