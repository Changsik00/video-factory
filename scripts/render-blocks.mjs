#!/usr/bin/env node
// HyperFrames 블록을 샌드박스에 설치·렌더·ffprobe 하고 결과를 기록한다.
//   node scripts/render-blocks.mjs --dry-run          목록과 레지스트리 이름만 검증
//   node scripts/render-blocks.mjs [--only=a,b] [--quality=draft] [--timeout=300]
//   node scripts/render-blocks.mjs --only=x --variables='{"title":"안녕"}' --suffix=-ko
// 실패는 그대로 기록한다. 모의 성공 결과를 만들지 않는다.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classify, metaMismatches, summarize, toMarkdown } from './lib/summarize.mjs';
import { compositionPath, inferReason, missingFromRegistry, parseSignalstats, tail, visualVerdict } from './lib/diagnose.mjs';

const HF_VERSION = '0.8.206';
const REGISTRY_INDEX = 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/registry.json';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUN_DIR = path.join(ROOT, 'runs', 'phase-01');
const SANDBOX = path.join(RUN_DIR, 'hf-sandbox');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const quality = args.quality ?? 'draft';
const timeoutMs = Number(args.timeout ?? 300) * 1000;
const suffix = args.suffix ?? '';

// 텔레메트리 비활성, 스킬 자동 설치 비활성
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_SKIP_SKILLS: '1' };

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

const list = JSON.parse(readFileSync(path.join(ROOT, 'catalog/validation/blocks.json'), 'utf8')).blocks;
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const targets = only ? list.filter((b) => only.has(b.name)) : list;
if (targets.length === 0) {
  console.error('대상 블록이 없습니다.');
  process.exit(2);
}

let registryItems;
try {
  const res = await fetch(REGISTRY_INDEX);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  registryItems = (await res.json()).items;
} catch (e) {
  console.error(`레지스트리 인덱스를 가져오지 못했습니다: ${e.message}`);
  process.exit(2);
}
const missing = missingFromRegistry(targets.map((b) => b.name), registryItems);
console.log(`대상 ${targets.length}개, 레지스트리에 없음 ${missing.length}개${missing.length ? ': ' + missing.join(', ') : ''}`);
if (args['dry-run']) process.exit(missing.length ? 1 : 0);

mkdirSync(RUN_DIR, { recursive: true });
if (!existsSync(path.join(SANDBOX, 'hyperframes.json'))) {
  const init = hf(['init', 'hf-sandbox', '--non-interactive', '--skip-skills', '--skip-transcribe'], RUN_DIR);
  if (init.status !== 0) {
    console.error(`샌드박스 init 실패:\n${tail(init.stderr, 15)}`);
    process.exit(1);
  }
}
mkdirSync(path.join(SANDBOX, 'renders'), { recursive: true });

const rows = [];
for (const b of targets) {
  const record = { name: b.name, group: b.group, expected: { width: b.width, height: b.height, duration: b.duration }, renderExit: -1 };
  const add = hf(['add', b.name, '--json', '--no-clipboard'], SANDBOX);
  if (add.status !== 0) {
    Object.assign(record, { stage: 'add', ms: add.ms, reason: inferReason(add.stderr, add), log: tail(add.stderr || add.stdout, 15) });
  } else {
    let written = [];
    try { written = JSON.parse(add.stdout).written ?? []; } catch { /* JSON 이 아니면 기본 경로로 시도 */ }
    const comp = compositionPath(b.name, written, SANDBOX) ?? `compositions/${b.name}.html`;
    const out = path.join('renders', `${b.name}${suffix}.mp4`);
    const renderArgs = ['render', '--composition', comp, '--quality', quality, '--output', out, '--quiet'];
    if (typeof args.variables === 'string') renderArgs.push('--variables', args.variables);
    let r = hf(renderArgs, SANDBOX);
    let attempts = 1;
    if (r.timedOut) { r = hf(renderArgs, SANDBOX); attempts = 2; } // 재시도는 타임아웃일 때만, 1회
    Object.assign(record, { stage: 'render', attempts, ms: r.ms, renderExit: r.status, output: out });
    if (r.status === 0) {
      record.probe = probe(path.join(SANDBOX, out));
      const vs = visualStats(path.join(SANDBOX, out));
      record.visual = vs ? { ...vs, verdict: visualVerdict(vs) } : { verdict: 'unknown' };
    }
    else Object.assign(record, { reason: inferReason(r.stderr, r), log: tail(r.stderr || r.stdout, 15) });
  }
  record.status = classify(record);
  if (record.status === 'success' && record.visual && record.visual.verdict !== 'ok') {
    record.status = 'partial';
    record.reason = `visual: ${record.visual.verdict}`;
  } else if (record.status === 'partial') record.reason = metaMismatches(record).join('; ') || 'no ffprobe result';
  rows.push(record);
  console.log(`${record.status.padEnd(7)} ${b.name} (${(record.ms / 1000).toFixed(1)}s)${record.reason ? ' ' + record.reason : ''}`);
  writeFileSync(path.join(RUN_DIR, `results${suffix}.json`), JSON.stringify({ hyperframes: HF_VERSION, quality, rows }, null, 2));
}

const md = toMarkdown(rows);
writeFileSync(path.join(RUN_DIR, `results${suffix}.md`), md + '\n');
const s = summarize(rows);
console.log('\n' + md + '\n');
console.log(JSON.stringify(s));
