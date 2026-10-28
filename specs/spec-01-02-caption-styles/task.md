# Task List: spec-01-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: SRT 파서·검증·단어 분배 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-02-caption-styles` (spec 생성 시 이미 생성됨)

### 1-2. 테스트 작성 (TDD Red)
- [x] `tests/srt.test.mjs`: 파싱(여러 줄 자막, 쉼표 소수점, BOM, CRLF), 검증(역전, 겹침, 길이 초과, 빈 텍스트), 단어 분배(글자 수 비례, 구간 경계 일치, 단어 1개, 연속 공백)
- [x] 테스트 실행 → Fail 확인
- [x] Commit: `test(spec-01-02): add failing tests for srt parse and word split`

### 1-3. 구현 (TDD Green)
- [x] `scripts/lib/srt.mjs`, `catalog/validation/captions.srt`
- [x] `npm test` → Pass 확인 (55개)
- [x] Commit: `feat(spec-01-02): add srt parser and word timing split`

---

## Task 2: 자막 렌더 러너

### 2-1. 러너 구현
- [x] `catalog/validation/caption-styles.json`, `scripts/render-captions.mjs` (`--dry-run` 포함)
- [x] `--dry-run`: SRT 검증 + 후보 스타일이 레지스트리에 있는지 확인 (네트워크 실패는 실패로 보고)
- [x] 스타일 1개로 조립·렌더 smoke test 후 호스트 조립 방식을 확정
- [x] Commit: `feat(spec-01-02): add caption render runner`

---

## Task 3: 실행 및 결과 기록

### 3-1. 5개 스타일 렌더
- [x] 러너 실행, `check --json` 결과와 화면 검사 확인
- [x] 프레임 시트 생성 (`runs/phase-01/posters/captions-sheet.png`)
- [x] 사용자 판정 받기 — 자막 단독 확인 (배경 없음). 배경 위 확인은 3-1b 로 추가

### 3-1b. 블록 배경 위 자막 (2026-10-28 추가)
- [x] 테스트: `hostHtml` 이 배경 블록을 자막보다 아래 레이어로 마운트 (`tests/captions-inject.test.mjs`) → Fail 확인 → 구현
- [x] 러너 `--backdrop=<블록>`: 블록 add(에셋 복사 포함) → 호스트에 마운트 → 렌더
- [x] 밝기가 다른 블록 3개 × 스타일 5개 렌더, 프레임 시트 생성
- [ ] 사용자 판정 받기 (배경 위 가독성) — 대기
- [x] Commit: `feat(spec-01-02): render captions over block backdrops`

### 3-2. 문서화
- [x] `docs/tool-findings.md` 자막 컴포넌트 절 작성
- [ ] Commit: `docs(spec-01-02): record caption component findings`

---

## Task N: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-02): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-02-caption-styles`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
