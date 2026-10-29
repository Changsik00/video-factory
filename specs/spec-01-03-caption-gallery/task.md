# Task List: spec-01-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: hostHtml 확장 — 라벨, scrim, 배경 반복 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-03-caption-gallery` (spec 생성 전에 이미 생성됨)

### 1-2. 테스트 작성 (TDD Red)
- [x] `tests/captions-inject.test.mjs`: 라벨 div 존재/이스케이프, scrim 이 배경과 자막 사이 레이어, 2초 배경을 8초로 반복 마운트(시작 시각 0,2,4,6), 옵션 없으면 기존 출력과 동일
- [x] 테스트 실행 → Fail 확인
- [x] Commit: `test(spec-01-03): add failing tests for label, scrim and backdrop repeat`

### 1-3. 구현 (TDD Green)
- [x] `scripts/lib/captions-inject.mjs`
- [x] `npm test` → Pass 확인 (84개, 기존 75개 유지)
- [x] Commit: `feat(spec-01-03): add label, scrim and backdrop repeat to host`

---

## Task 2: W/BLOCKS 구조 조사와 치환 (TDD)

### 2-1. 조사
- [x] `editorial-emphasis`, `parallax-layers` 의 `W`, `BLOCKS` 데이터 모양 확인: `W` 는 `WORDS` 와 같은 모양, `BLOCKS` 는 단어 인덱스 배치(editorial: `{line1,line2}` + 타입 n/i/e, parallax: `{behind,front}`). **강조 단어를 입력으로 받는다.** SRT 에 강조 정보가 없어 임시 규칙(구간에서 가장 긴 단어 = 강조)으로 치환한다. 치환 가능

### 2-2. 테스트 → 구현
- [x] 테스트 작성 → Fail (커밋) → 구현 → Pass (97개). 설치된 16개 컴포넌트 전부 치환 성공 (렌더는 Task 5)
- [x] Commit: `feat(spec-01-03): support W and BLOCKS caption structure`
- [ ] Commit: `test(spec-01-03): ...` / `feat(spec-01-03): support W and BLOCKS caption structure`

---

## Task 3: 배경 선정

### 3-1. 후보 측정
- [x] 후보 블록 15개 설치·렌더·YAVG/YDIF 측정 (15/15 렌더 성공). 렌더 러너에 `--list` 옵션 추가 (기본 동작 불변). 2초 블록 반복 마운트 smoke 는 러너가 배경을 받는 Task 4 로 이동
- [x] `catalog/validation/backdrops.json` 작성 + `tests/backdrops-list.test.mjs` (밝음/중간/어두움/움직임 큼 조건 고정). 선정: mk-background(209), data-chart(222), swirl(139, 2초 반복), gallery-tunnel(YDIF 10.4), canopy-part-title(27)
- [x] Commit: `feat(spec-01-03): select caption backdrops`

---

## Task 4: 러너 확장

### 4-1. 매트릭스 모드
- [ ] `--all`, `--backdrops`, 조합 결과 누적·재개, 라벨·scrim 옵션
- [ ] 2초 배경(swirl) 반복 마운트가 이음새 없이 동작하는지 smoke
- [ ] `caption-styles.json` 16개로 확장, `--dry-run` 으로 레지스트리 확인
- [ ] Commit: `feat(spec-01-03): add caption matrix mode`

---

## Task 5: 실행 및 결과 기록

### 5-1. smoke → 전체
- [ ] 구조 3종 각 1개 smoke 후 전체 매트릭스 실행 (백그라운드)
- [ ] 결과 JSON 점검, 프레임 시트 생성

### 5-2. scrim 시험
- [ ] 밝은 배경에서 묻힌 스타일에 scrim 적용, 전후 프레임 비교

---

## Task 6: 모음 영상

### 6-1. TDD
- [ ] `tests/reel.test.mjs`: 대표 조합 선택 로직 (스타일당 N개, 실패·partial 제외, 배경 다양성)
- [ ] `scripts/build-reel.mjs`, 모음 영상 생성, `ffprobe` 검사, 프레임 시트
- [ ] 사용자 판정 받기
- [ ] Commit: `feat(spec-01-03): build caption gallery reel`

### 6-2. 문서화
- [ ] `docs/tool-findings.md` 갤러리 절 작성
- [ ] Commit: `docs(spec-01-03): record caption gallery findings`

---

## Task N: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-03-caption-gallery`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
