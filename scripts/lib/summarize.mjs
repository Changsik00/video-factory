// 블록 렌더 결과 레코드를 분류·요약한다. 외부 도구를 호출하지 않는 순수 함수만 둔다.
const DURATION_TOLERANCE_SEC = 0.5;

export function metaMismatches({ probe, expected }) {
  if (!probe || !expected) return [];
  const out = [];
  if (probe.width !== expected.width || probe.height !== expected.height) {
    out.push(`resolution ${probe.width}x${probe.height} != ${expected.width}x${expected.height}`);
  }
  if (Math.abs(probe.duration - expected.duration) > DURATION_TOLERANCE_SEC) {
    out.push(`duration ${probe.duration}s != ${expected.duration}s`);
  }
  return out;
}

export function classify(record) {
  if (record.renderExit !== 0) return 'failed';
  if (!record.probe) return 'partial';
  return metaMismatches(record).length === 0 ? 'success' : 'partial';
}

const emptyCount = () => ({ success: 0, partial: 0, failed: 0, total: 0 });

export function summarize(rows) {
  const counts = emptyCount();
  const byGroup = {};
  for (const r of rows) {
    const g = (byGroup[r.group] ??= emptyCount());
    counts[r.status] += 1;
    counts.total += 1;
    g[r.status] += 1;
    g.total += 1;
  }
  return { counts, byGroup };
}

export function toMarkdown(rows) {
  const lines = ['| 블록 | 그룹 | 결과 | 원인 | 시간(초) |', '|---|---|---|---|---|'];
  for (const r of rows) {
    lines.push(`| ${r.name} | ${r.group} | ${r.status} | ${r.reason ?? '-'} | ${(r.ms / 1000).toFixed(1)} |`);
  }
  return lines.join('\n');
}
