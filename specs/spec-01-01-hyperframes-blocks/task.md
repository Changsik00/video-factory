# Task List: spec-01-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 후보 목록과 결과 요약 로직 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-01-hyperframes-blocks`

### 1-2. 테스트 작성 (TDD Red)
- [x] `tests/summarize.test.mjs`: 성공/실패/부분 분류, 메타 불일치 판정, 빈 입력, 요약표 출력
- [x] `tests/blocks-list.test.mjs`: `catalog/validation/blocks.json`이 15개, 중복 없음, 그룹 4개 이상을 포함
- [x] 테스트 실행 → Fail 확인
- [x] Commit: `test(spec-01-01): add failing tests for block list and summarize`

### 1-3. 구현 (TDD Green)
- [x] `catalog/validation/blocks.json`, `scripts/lib/summarize.mjs`, `package.json` test 스크립트
- [x] `npm test` → 16개 Pass 확인
- [x] Commit: `feat(spec-01-01): add block list and result summarizer`

---

## Task 2: 렌더 러너

### 2-1. 러너 구현
- [x] `scripts/render-blocks.mjs` (`--dry-run` 포함): 샌드박스 init, 블록별 add/render/ffprobe, 실패 로그 기록, 재시도 1회 상한(타임아웃일 때만)
- [x] `--dry-run`으로 레지스트리에 후보 15개가 모두 존재하는지 확인 (모의 성공 금지: 네트워크/도구 부재 시 실패로 보고)
- [x] `tests/diagnose.test.mjs` + `scripts/lib/diagnose.mjs` (실패 원인 분류, 레지스트리 이름 검증), 테스트 24개 PASS
- [x] Commit: `feat(spec-01-01): add block render runner`

---

## Task 3: 실행 및 결과 기록

### 3-1. smoke test
- [x] 빈 프로젝트 init + 렌더 성공 확인 (1920x1080, 10초, 14.7초 소요), 버전·명령을 `docs/tool-findings.md`에 기록

### 3-2. 블록 15개 렌더
- [x] 러너 실행, 결과 JSON 확인 (`runs/phase-01/results.json`): 15/15 성공 (canopy-part-title 에셋 경로 문제 수정 후)
- [x] 대조군 1개 재생 확인(사용자), 포스터 프레임 경로 제공 (`runs/phase-01/posters/sheet.png`)
- [x] 한국어 텍스트 변수 렌더 2개 (canopy-part-title, chatgpt-exchange), 프레임에서 글자 정상 표시 확인
- [x] 사용자 판정 받기 (한국어 표시, 시각 품질) — "좋아" 응답

### 3-3. 문서화
- [x] `docs/tool-findings.md` HyperFrames 절 작성 (환경, 절차, 결과표, 미확인 목록)
- [x] Commit: `docs(spec-01-01): record hyperframes block render findings`

---

## Task N: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [x] **전체 테스트 실행** → 모두 PASS

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] Commit: `docs(spec-01-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-01-hyperframes-blocks`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
