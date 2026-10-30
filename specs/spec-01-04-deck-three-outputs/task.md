# Task List: spec-01-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: slideshow 스킬 설치

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-04-deck-three-outputs` (spec 생성 직후 생성됨)

### 1-2. 설치 (사용자 확인 필수)
- [x] **설치 직전 사용자 확인** (파일 추가, `skills-lock.json` 변경 내용 안내) — 승인 받음
- [x] 스킬 설치 후 `.claude/skills/slideshow/SKILL.md` 를 읽고 키 조작·fragment·전환에 관한 서술을 기록 (문서와 실측의 차이는 이후 task 에서 확인)
- [x] `docs/project-principles.md` 갱신. **`skills-lock.json` 은 변경하지 않음** (CLI 가 홈에 4개를 설치해 media-use 포함분을 지우고 홈 설치본을 프로젝트로 복사. `computedHash` 계산법을 몰라 파일 SHA-256 을 principles 에 기록)
- [x] Commit: `chore(spec-01-04): install slideshow skill`

---

## Task 2: V1 — `present` 덱 시험

- [x] `runs/phase-01/deck/` 에 3장 덱(fragment 2개 포함) 작성, `check --json` 통과 (처음 구조는 `check` 를 통과했지만 `present` 에서 동작하지 않아 루트+장면 파일 구조로 수정)
- [x] `present --no-open` 으로 서버 실행, 헤드리스 Chrome(CDP 키 이벤트)으로 진행·fragment 확인과 스크린샷 확인. 전환 애니메이션·청중 화면 동기화는 미확인
- [-] 키 입력 체감 등 자동화 불가 항목은 **사용자 확인 요청** 후 결과 기록 (받지 못하면 미확인) — **미수령, 이월** (자동화 키 입력 검증은 완료)
- [x] 결과를 `docs/tool-findings.md` 에 초안 기록
- [x] Commit: `docs(spec-01-04): record present deck findings`

---

## Task 3: V2 — 덱 렌더 제약 확인

- [x] 덱을 `render --quality draft` 해 "첫 장면만 남음" 재현 여부 확인 (ffprobe 길이, 프레임)
- [x] 같은 장면들을 루트 있는 구조/없는 구조로 렌더해 비교 (루트 없음 4.0초 = 첫 장면만, 루트 있음 16.0초 전부 재생)
- [x] 결과와 판정(같은 HTML 공유 가능, 단 루트 구조 필요)을 기록
- [x] Commit: `docs(spec-01-04): record deck render constraint`

---

## Task 4: V3 — PDF 두 방식 비교

- [x] (a) `snapshot --at` PNG → PDF, (b) 헤드리스 Chrome 인쇄 PDF 를 만들고 페이지 수, 글자 선택, 잘림, 중간 상태를 눈으로 확인 (a 3쪽 이미지, b 3쪽 벡터·글자 231자 추출)
- [x] 결과 기록
- [x] Commit: `docs(spec-01-04): record pdf export comparison`

---

## Task 5: V4 — 명세에서 덱·영상용 HTML 생성 (V2 결과가 "불가"일 때만)

### 5-1. 테스트 작성 (TDD Red)
- [-] `tests/deck-manifest.test.mjs`: 명세 검증(슬라이드 수, fragment 시간 순서), 덱 JSON 과 영상용 장면 시간 생성
- [-] 테스트 실행 → Fail 확인
- [-] Commit: `test(spec-01-04): add failing tests for deck manifest`

### 5-2. 구현 (TDD Green)
- [-] `scripts/lib/deck-manifest.mjs` 구현, 생성 결과를 렌더·`present` 로 확인
- [-] `npm test` → Pass 확인
- [-] Commit: `feat(spec-01-04): add minimal deck manifest generator`

(V2 가 "공유 가능"이면 건너뛰고 사유를 task 에 기록) — **V2 결과 공유 가능(루트 구조), V3 에서 인쇄용 페이지 생성이 필요함을 확인. 생성기 저장소화(TDD)는 이번 spec 에서 하지 않고 이월**

---

## Task 6: V5 — YouTube 업로드 제약 조사 (문서만)

- [x] 공식 문서 기준: API 승인·감사, 미심사 프로젝트의 공개 범위, 할당량. 확인 못 한 것은 미확인 (공개 범위 규칙은 공식 문서끼리 충돌, 결론 못 냄)
- [x] Commit: `docs(spec-01-04): record youtube upload constraints`

---

## Task 7: 결과 반영

- [x] `docs/tool-findings.md` 정리 (확인한 것/못 한 것)
- [x] ADR-003, ADR-004, `docs/plan/multi-format-presentation-plan.md` 를 결과에 맞게 수정 (ADR-003 결정 2 와 PDF 방법 수정)
- [x] Commit: `docs(spec-01-04): update adr and plan with deck findings`

---

## Task N: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] **전체 테스트 실행** → 모두 PASS (141개)

### 📝 산출물 작성
- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-04): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-01-04-deck-three-outputs`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
