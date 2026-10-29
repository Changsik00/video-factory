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
- [x] `--backdrops`(`--backdrop` 별칭), 조합 결과 누적·재개(`captions-matrix.json`), 라벨·`--scrim` 옵션, `--force`
- [x] 2초 배경(swirl) smoke: **반복 마운트는 2초 이후 검은 화면(거짓 success 였음)**. 영상 이어 붙이기로 변경, 테스트·`backdropVerdict` 추가, 8초 내내 배경 확인 (이음새 여부는 눈으로 판정 필요)
- [x] `caption-styles.json` 16개로 확장, `--dry-run` 으로 레지스트리 확인 (스타일 16, 배경 5, 80조합)
- [x] Commit: `feat(spec-01-03): add caption matrix mode`

---

## Task 5: 실행 및 결과 기록

### 5-1. smoke → 전체
- [x] 구조 4종 smoke 후 전체 매트릭스 1차 실행 (80조합, 약 70분). **결과 무효**: check 가 다른 조합 파일까지 린트해 72개가 partial 로 오염, 자막 스크립트가 터진 렌더가 exit 0 으로 성공 처리됨(gradient-fill 등), 실패 5건은 원인이 gpu 로 오분류. 원인 수정 후 `--force` 로 전체 재실행 (1차 결과는 `captions-matrix.v1-contaminated.json` 로 보존)
- [x] 전체 재실행 (2026-10-29): 80조합 중 **75 success**, 실패 5건은 전부 `caption-emoji-pop` (navigation_timeout 3, gpu 1, partial 1). 마지막 12개는 PC 부하를 위해 4개씩 나눠 재개. 옛 행 잔존 없음
- [x] `emoji-pop` 1회 추가 진단 (draft, 240초): 같은 `page.goto` 에서 Navigation timeout 재현. 화질·부하와 무관하게 페이지 로드 단계에서 막힘. 다른 15개도 같은 Google Fonts 를 쓰고 curl 응답은 0.2초라 외부 폰트·네트워크 가설은 근거 약함. **원인 미해결, 재시도 안 함**, 이 환경에서 렌더 불가로 기록 (별도 spec 후보)
- [x] 결과 JSON 점검, 프레임 시트 생성 (`runs/phase-01/reel/caption-gallery-sheet.png`, 30클립 242초 1920x1080 h264 ffprobe 통과)

### 5-2. scrim 시험
- [x] 밝은 배경에서 묻힌 8개 조합에 scrim 적용, 3.8초 프레임으로 전후 비교 (8/8 렌더 success, check ok). 개선: clip-wipe·gradient-fill(data-chart, mk-background)·weight-shift(두 배경) 뚜렷, particle-burst·neon-glow 소폭. **texture(mk-background)는 효과 없음**: scrim 이 화면 아래쪽에만 깔려 중앙에 뜨는 자막을 못 덮는다. weight-shift(data-chart)는 scrim 후에도 글자가 막대와 겹침. 영상 전체 재생 확인은 안 함

---

## Task 6: 모음 영상

### 6-1. TDD
- [x] `tests/reel.test.mjs`: 대표 조합 선택 로직 (스타일당 N개, 실패·partial·scrim 제외, 배경 돌려쓰기, exclude, missing) → Fail 확인 후 구현 (126개)
- [x] `scripts/build-reel.mjs` 작성 (`--dry-run` 으로 일부 결과에서 동작 확인)
- [x] 매트릭스 완료 후 모음 영상 생성 (읽히지 않는 조합·`camera-follow`/`parallax-layers`/`texture`/`emoji-pop` 제외, 24클립 192초), `ffprobe` 검사 통과, 프레임 시트 확인
- [ ] 사용자 판정 받기 (**미수령**. 사용자 지시로 판정 전에 정리·PR 진행, 문서에 판정 미수령으로 기록)
- [x] Commit: `feat(spec-01-03): build caption gallery reel` (러너·테스트는 앞선 커밋 `7a2c967` 에 포함, 이 단계 산출물은 git 제외)

### 6-2. 문서화
- [x] `docs/tool-findings.md` 갤러리 절 작성
- [ ] Commit: `docs(spec-01-03): record caption gallery findings`

---

## Task N: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [x] **전체 테스트 실행** → 모두 PASS (141개)

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-03-caption-gallery`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
