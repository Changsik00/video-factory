// 모음 영상에 넣을 대표 조합 선택과 ffmpeg concat 목록. 외부 도구를 호출하지 않는 순수 함수만 둔다.

// 스타일마다 서로 다른 배경에서 최대 perStyle 개를 고른다.
// - success 이고 scrim 변형이 아닌 것만, exclude(사람이 안 읽힌다고 판정한 조합 key)는 뺀다.
// - 시작 배경을 스타일 순서마다 한 칸씩 돌려 한 배경으로 몰리지 않게 한다.
// - 쓸 수 있는 조합이 하나도 없는 스타일은 missing 으로 알려준다.
export function selectReel(rows, { styles, backdrops, perStyle = 2, exclude = [] }) {
  const skip = new Set(exclude);
  const picks = [];
  const missing = [];
  styles.forEach((style, si) => {
    const usable = rows.filter((r) => r.name === style && r.status === 'success' && !r.scrim && !skip.has(r.key));
    const start = backdrops.length ? si % backdrops.length : 0;
    const order = [...backdrops.slice(start), ...backdrops.slice(0, start)];
    const mine = [];
    for (const b of order) {
      const hit = usable.find((r) => r.backdrop === b);
      if (hit && mine.length < perStyle) mine.push(hit);
    }
    if (mine.length === 0) missing.push(style);
    picks.push(...mine);
  });
  return { picks, missing };
}

export const concatList = (paths) => paths.map((p) => `file '${p.replace(/'/g, "'\\''")}'\n`).join('');
