#!/usr/bin/env node
// 매트릭스 결과에서 스타일별 대표 조합을 골라 모음 영상 1편과 프레임 시트를 만든다.
//   node scripts/build-reel.mjs --dry-run                       선택 결과만 출력
//   node scripts/build-reel.mjs [--per-style=2] [--exclude=키,키]   exclude 는 사람이 안 읽힌다고 판정한 조합 key
// 산출물은 runs/phase-01/reel/ (git 제외). 업로드하지 않는다.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { concatList, selectReel } from './lib/reel.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUN_DIR = path.join(ROOT, 'runs', 'phase-01');
const SANDBOX = path.join(RUN_DIR, 'cap-sandbox');
const OUT_DIR = path.join(RUN_DIR, 'reel');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const perStyle = Number(args['per-style'] ?? 2);
const exclude = typeof args.exclude === 'string' ? args.exclude.split(',').filter(Boolean) : [];

const matrixFile = path.join(RUN_DIR, 'captions-matrix.json');
if (!existsSync(matrixFile)) {
  console.error('captions-matrix.json 이 없습니다. 먼저 render-captions 를 실행하세요.');
  process.exit(2);
}
const rows = JSON.parse(readFileSync(matrixFile, 'utf8')).rows;
const styles = JSON.parse(readFileSync(path.join(ROOT, 'catalog/validation/caption-styles.json'), 'utf8')).styles;
const backdrops = JSON.parse(readFileSync(path.join(ROOT, 'catalog/validation/backdrops.json'), 'utf8')).backdrops.map((b) => b.name);

const { picks, missing } = selectReel(rows, { styles, backdrops, perStyle, exclude });
const present = picks.filter((p) => p.output && existsSync(path.join(SANDBOX, p.output)));
const lostFiles = picks.filter((p) => !present.includes(p));
console.log(`대표 조합 ${present.length}개 / 쓸 수 있는 조합이 없는 스타일 ${missing.length}개${missing.length ? ' (' + missing.join(', ') + ')' : ''}${lostFiles.length ? ` / 파일 없음 ${lostFiles.length}개` : ''}`);
present.forEach((p, i) => console.log(`${String(i + 1).padStart(2)}. ${p.name} on ${p.backdrop}`));
if (args['dry-run']) process.exit(present.length === 0 ? 1 : 0);
if (present.length === 0) {
  console.error('모음 영상에 넣을 클립이 없습니다.');
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(path.join(OUT_DIR, 'frames'), { recursive: true });
const files = present.map((p) => path.join(SANDBOX, p.output));
writeFileSync(path.join(OUT_DIR, 'list.txt'), concatList(files));

const reel = path.join(OUT_DIR, 'caption-gallery.mp4');
const cat = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT_DIR, 'list.txt'), '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', reel], { encoding: 'utf8' });
if (cat.status !== 0) {
  console.error(`ffmpeg concat 실패:\n${cat.stderr}`);
  process.exit(1);
}

const probe = (f) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration,codec_name', '-of', 'json', f], { encoding: 'utf8' });
  const s = r.status === 0 ? JSON.parse(r.stdout).streams?.[0] : null;
  return s ? { width: s.width, height: s.height, duration: Number(s.duration), codec: s.codec_name } : null;
};
const clipDurations = files.map((f) => probe(f)?.duration ?? 0);
const expected = clipDurations.reduce((a, b) => a + b, 0);
const info = probe(reel);
const problems = [];
if (!info) problems.push('ffprobe 실패');
else {
  if (info.width !== 1920 || info.height !== 1080) problems.push(`해상도 ${info.width}x${info.height}`);
  if (Math.abs(info.duration - expected) > 1) problems.push(`길이 ${info.duration}초 != 클립 합 ${expected.toFixed(1)}초`);
  if (info.codec !== 'h264') problems.push(`코덱 ${info.codec}`);
}

// 프레임 시트: 클립마다 시작 3.8초 뒤 프레임 (자막이 보이는 시점)
let t = 0;
clipDurations.forEach((d, i) => {
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t + 3.8), '-i', reel, '-frames:v', '1', '-vf', 'scale=480:-1', path.join(OUT_DIR, 'frames', `f${String(i + 1).padStart(2, '0')}.png`)]);
  t += d;
});
const cols = 4;
const sheet = path.join(OUT_DIR, 'caption-gallery-sheet.png');
spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(OUT_DIR, 'frames', 'f%02d.png'), '-vf', `tile=${cols}x${Math.ceil(files.length / cols)}`, '-frames:v', '1', sheet]);

const report = { clips: present.map((p) => ({ name: p.name, backdrop: p.backdrop })), missing, probe: info, expectedDuration: expected, problems, sheet: existsSync(sheet) ? path.relative(ROOT, sheet) : null };
writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${path.relative(ROOT, reel)}  ${info ? `${info.width}x${info.height} ${info.duration.toFixed(1)}s ${info.codec}` : '(검사 실패)'}`);
console.log(problems.length ? `문제: ${problems.join('; ')}` : 'ffprobe 검사 통과');
process.exit(problems.length ? 1 : 0);
