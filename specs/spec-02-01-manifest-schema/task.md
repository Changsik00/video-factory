# Task List: spec-02-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 명세 검증 `validateManifest` (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-02-01-manifest-schema` (spec 생성 직후 생성됨)

### 1-2. 테스트 작성 (TDD Red)
- [ ] `tests/manifest.test.mjs`: 유효 사례 + 무효 사례 10개 이상(슬라이드 없음, id 중복·형식, duration, heading, steps 순서·범위, items.step 범위, steps 없이 step, 이미지 파일 없음(`exists` 주입), 알 수 없는 필드, notes/items 형식) 각각 안정적인 `code` 와 `path` 확인
- [ ] 테스트 실행 → Fail 확인
- [ ] Commit: `test(spec-02-01): add failing tests for manifest validation`

### 1-3. 구현 (TDD Green)
- [ ] `scripts/lib/manifest.mjs`: `validateManifest`
- [ ] `npm test` → Pass 확인 (기존 141개 유지)
- [ ] Commit: `feat(spec-02-01): add manifest validation`

---

## Task 2: 시각 변환 `resolveTimeline` (TDD)

### 2-1. 테스트 작성 (TDD Red)
- [ ] 절대 `start`/`end`, 절대 `fragments`(= start + 로컬 steps), 전체 길이, 슬라이드를 앞에 끼워 넣으면 뒤 슬라이드 시각이 이동하는 사례
- [ ] 테스트 실행 → Fail 확인
- [ ] Commit: `test(spec-02-01): add failing tests for timeline resolution`

### 2-2. 구현 (TDD Green)
- [ ] `resolveTimeline` 구현, `npm test` → Pass 확인
- [ ] Commit: `feat(spec-02-01): add timeline resolution`

---

## Task 3: 샘플 명세와 스키마 문서

- [ ] `catalog/formats/sample-deck/manifest.json` (5장, fragment 슬라이드 2장 이상, 이미지 슬라이드 1장 이상) 작성, 자리표시자 이미지 생성 (`placeholder.png`, 생성한 것임을 문서에 명시)
- [ ] 샘플 명세가 검증을 통과하는 테스트 추가 (파일 존재 확인 포함)
- [ ] 수동 검증: `resolveTimeline` 출력 확인, 필드 오타 시 오류 확인
- [ ] `docs/manifest-schema.md` 작성
- [ ] Commit: `feat(spec-02-01): add sample deck manifest and schema doc`

---

## Task N: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] **전체 테스트 실행** → 모두 PASS

### 📝 산출물 작성
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-02-01): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-02-01-manifest-schema`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
