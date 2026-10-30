# phase-1: tool-validation

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-1-{seq}-{slug}/spec.md` 에서 다룹니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-1` |
| **상태** | Planning |
| **시작일** | 2026-10-26 |
| **소유자** | changsik |
| **Base Branch** | 없음 |

## 🎯 배경 및 목표

### 현재 상황
Video Factory는 Hypit / HyperFrames / FFmpeg 같은 기존 도구를 조합해 영상 제작 파이프라인을 만든다. 이 도구들의 능력은 아직 가설이다 (`docs/project-principles.md` 원칙 1, 6). 제안서(`docs/proposal/proposal.md`)와 검토 노트(`docs/proposal/review.md`)에 미확정 사항이 남아 있다.

사전 조사(2026-10-26, GitHub API):

| 도구 | 저장소 | 라이선스 | 비고 |
|---|---|---|---|
| Hypit | hypit-ai/hypit | 수정 Apache-2.0 | LICENSE 전문 확인: 본인 조직 업무(상업 포함) 허용, SaaS 제공·재판매 금지, 로고/저작권 표기 제거 금지 |
| HyperFrames | heygen-com/hyperframes | Apache-2.0 | 제안서의 `hyperframes-org/hyperframes`는 404. 실제 저장소로 정정 |

### 목표 (Goal)
첫 제품 방향은 **이펙트·샘플 쇼케이스**(음성 없음, 자막만)이다 (`docs/plan/product-and-script-plan.md`). 이 phase는 HyperFrames 레지스트리의 블록·자막 컴포넌트를 직접 렌더해, 쇼케이스를 만들 수 있는지와 한계를 실측한다.

**추가 목표 (2026-10-30, ADR-003/004)**: 결과물을 영상만이 아니라 하나의 대본에서 **HTML(발표)·PDF(정적)·MP4(자동재생)** 로 낼 수 있는지 실측한다. HyperFrames 덱(`present`, `slideshow` 스킬)의 단계(fragment) 진행·렌더 제약과 PDF 출력 방법, YouTube 업로드 제약(문서 조사)을 확인한다. 근거와 가설은 `docs/plan/multi-format-presentation-plan.md`.

### 성공 기준 (Success Criteria)
1. 카테고리별 블록 10개 이상(GPU 의존 webgpu/webgl 블록 포함)을 렌더하고 성공/실패/원인을 표로 기록
2. `caption-*` 자막 컴포넌트 3개 이상을 같은 문장으로 렌더하고 한글 표시를 확인
3. 샘플 영상 1편을 렌더하고 `ffprobe`로 검사
4. 블록 라이선스·작성자 필드의 실제 상태와 크레딧 표기 방침을 기록
5. Hypit 라이선스 전문 확인 결과를 기록 (이미 확인: 수정 Apache-2.0, 본인 채널 운영 허용으로 읽힘 — 사용자 판단 필요)
6. 미확인 기능 목록이 `docs/tool-findings.md`에 기록됨
7. 하나의 대본(명세)에서 발표(HTML)·PDF·MP4 를 만들 수 있는지, 형식별 구조 제약(덱은 MP4 렌더가 안 된다는 문서 내용의 재현 여부 포함)을 실측해 기록 (spec-1-04)
8. `present` 덱의 진행 방식(키 조작, fragment, 슬라이드 전환)과 한계를 실측해 기록 (spec-1-04)
9. PDF 를 HTML 에서 내는 방법(이미지 PDF vs 벡터 인쇄)을 비교해 기록, YouTube 업로드 제약은 문서 기준으로만 조사하고 업로드는 하지 않음 (spec-1-04)

### 공통 체크 항목 (도구별)
라이선스·상업 사용 / 설치·지원 OS·Node 버전 / 공식 CLI·API / 입출력 포맷 / 재사용·부분 재생성 / 음성·영상 타이밍 / 렌더링 의존성 / 외부 API·유료 모델 의존성

## 🧩 작업 단위 (SPEC + phase-FF)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-01-01` | hyperframes-blocks | P? | Merged | `specs/spec-01-01-hyperframes-blocks/` |
| `spec-01-02` | caption-styles | P? | Merged | `specs/spec-01-02-caption-styles/` |
| `spec-01-03` | caption-gallery | P? | Merged | `specs/spec-01-03-caption-gallery/` |
| `spec-01-04` | deck-three-outputs | P? | Merged | `specs/spec-01-04-deck-three-outputs/` |
<!-- sdd:specs:end -->

### spec-1-01 — hyperframes-blocks

- **요점**: HyperFrames 설치, 빈 프로젝트 렌더, 카테고리별 블록 10개 이상 렌더 (전환, 오버레이, 배경, 3D, 코드, 차트, 세로, GPU 의존 블록 포함)
- **방향성**: 실패는 숨기지 않고 원인(GPU, 의존성, 폰트)과 함께 기록. 렌더 시간도 측정
- **참조**: `docs/plan/product-and-script-plan.md` §2

### spec-1-02 — caption-styles

- **요점**: `caption-*` 컴포넌트 3개 이상 시험, 한글 렌더, SRT → 자막 입력 변환 가능성 (구 단위 / 단어 균등분배)
- **방향성**: 음성 없이 사람이 정한 타이밍으로 동작하는지 확인. 단어 타이밍 JSON 요구사항 문서화
- **참조**: `docs/plan/product-and-script-plan.md` §4

### spec-1-03 — caption-gallery

- **요점**: 자막 컴포넌트 16개 전부를 성격이 다른 블록 배경 4~5개 위에서 렌더하고, 스타일·배경 이름을 표기한 모음 영상 1편과 프레임 시트를 만든다. 밝은 배경에서 묻히는 스타일에 scrim 을 시험한다
- **방향성**: spec-1-02 평가("같은 자막을 여러 배경에 넣었을 뿐")에 따라 폭을 넓힌다. 첫 볼 만한 산출물. 업로드는 하지 않는다
- **참조**: `docs/tool-findings.md`, ADR-001
- **이월(다음 spec 후보)**: 블록 작성자·라이선스 표기와 크레딧 방침, 브랜드 모방 블록 처리 기준, ffprobe 검사 스크립트 정리 (원래 spec-1-03 범위였음)

### spec-1-04 — deck-three-outputs

- **요점**: 3장짜리 덱 하나로 `present` 발표, PDF, MP4 를 실제로 만들어 ADR-003/004 의 가설(단계 모델, 같은 HTML 공유)을 검증한다. 덱은 MP4 로 렌더하지 말라는 문서 내용을 재현하고, 불가하면 같은 명세에서 덱과 영상용 HTML 을 각각 만드는 최소 생성기를 시험한다
- **방향성**: 실패·불가는 원인과 함께 기록하고 ADR 을 수정한다. 에이전트 자산 제안, Hypit, React UI, 실제 업로드, 음성은 범위 밖
- **참조**: `docs/plan/multi-format-presentation-plan.md` §5, ADR-003, ADR-004

### phase-FF 예정 항목 (spec 미생성)

없음

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 프로젝트명 | YouTube Factory / Video Factory | Video Factory | 저장소명과 일치, 쇼츠·블로그 확장 비전과 부합 |
| manifest.json vs sources.json | 택1 / 둘 다 | 둘 다 | manifest=장면 명세, sources=출처 목록 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 샘플 영상 end-to-end
- **Given**: 검증된 도구가 설치된 환경
- **When**: 문서화된 절차대로 샘플 영상 1편을 생성
- **Then**: 렌더 산출물이 `ffprobe` 검사를 통과하고, 같은 절차로 재현된다
- **연관 SPEC**: spec-1-03

## 🔗 의존성

- **선행 phase**: 없음
- **외부 시스템**: Hypit, HyperFrames, FFmpeg, Node >= 22 (HyperFrames 요구), pnpm

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| GPU 의존 블록이 이 환경에서 렌더 불가 | 카탈로그 일부 제외 | spec-1-01 에서 비율 측정, 제외 목록 기록 |
| 블록 라이선스·작성자 권리 불명확 | 업로드 시 문제 | spec-1-03 에서 필드 상태 정리, 크레딧 방침 결정 (spec-1-03 에서 못 하고 phase 마감 시 `docs/tool-findings.md` 에 기록: 필드 집계, 설명란 크레딧 방침, 브랜드 블록 기준 제안. 법적 판단은 미확인) |
| 템플릿 모음이 YouTube 수익화 정책에 걸림 | 수익화 불가 | 변형·해설 등 편집 기여 기준 마련 (기획 문서 §2) |
| 외부 도구 미설치·실패 | 검증 불가 | 모의 성공 결과를 만들지 않고 실패를 그대로 기록 |

## 🏁 Phase Done 조건

- [x] 모든 SPEC 이 merge (spec-01-01~01-04)
- [ ] 통합 테스트 시나리오 PASS — 샘플 영상(모음 영상 192초)은 `ffprobe` 로 확인했으나 "같은 절차로 재현"(재렌더 후 동일성)은 확인하지 못했다
- [x] 성공 기준 측정 결과를 아래 "검증 결과"에 기록 (2026-10-31)
- [ ] 사용자 최종 승인 (사용자 판정: `runs/phase-01/reel/caption-gallery.mp4` 와 덱 `present` 확인 대기)

## 📊 검증 결과 (phase 완료 시 작성)

2026-10-31 회고(독립 감사)와 마감 작업 기준. **사용자 판정은 모든 spec 에서 미수령**이라 "읽힘·한글 표시·가독성"은 에이전트 판독이다.

| # | 성공 기준 | 결과 | 증거 |
|---|---|:---:|---|
| 1 | 블록 10개 이상 렌더 표 | 달성 | `docs/tool-findings.md` 블록 15개 표 (GPU 계열 6개 포함, 표본 15/210 이라 일반화 불가) |
| 2 | 자막 3개 이상 한글 렌더 | 달성(AI 판독) | 16개 중 15개 렌더, 80조합 75 success + scrim 8 (`runs/phase-01/captions-matrix.json`, git 제외) |
| 3 | 샘플 영상 1편 + ffprobe | 부분 | 모음 영상 1920x1080 h264 192초 (`runs/phase-01/reel/`, git 제외). 재현(재렌더 동일성)은 미확인 |
| 4 | 라이선스·작성자 상태와 크레딧 방침 | 달성(방침은 제안, 법적 판단 미확인) | `docs/tool-findings.md` "블록·컴포넌트 라이선스·작성자와 크레딧 방침" |
| 5 | Hypit 라이선스 전문 결과 | 달성(개인/제품 판단 대기) | `docs/tool-findings.md` "Hypit 라이선스 확인과 점검 결과". 설치 점검은 하지 않음 |
| 6 | 미확인 기능 목록 | 달성 | spec 별 "미확인" 절 (통합본 없음) |
| 7 | 하나의 대본에서 HTML·PDF·MP4 | 부분 | 글자·색만 있는 3장 덱 1개. 대본(명세) 구조는 시험하지 않음, PDF 생성기는 저장소에 없음 |
| 8 | `present` 진행 방식 | 부분 | ArrowRight/Left/Space 를 헤드리스 키 입력으로 확인. 전환 애니메이션·청중 동기화·사용자 체감 미확인 |
| 9 | PDF 방법 비교, YouTube 제약 문서 조사 | 달성(범위 한정) | 이미지 PDF vs 벡터 PDF, YouTube 규칙은 문서끼리 충돌해 결론 못 냄 |

## 🚧 phase-02 이월 항목

회고에서 나온 것과 각 spec walkthrough 이월을 모았다.
- 사용자 판정: 모음 영상, 덱 `present`, 갤러리 가독성 (세 spec 에서 반복 미수령)
- `slideshow` 스킬을 `skills-lock.json` 에 넣는 방법 (`computedHash` 계산법 확인). 지금은 `docs/project-principles.md` 에 파일 SHA-256 으로만 기록
- PDF 인쇄용 페이지 생성기와 CDP 구동 스크립트의 저장소 보존, 3장 덱과 대본(명세) 구조의 `catalog/` 이동, `check` 가 못 잡는 덱 오류 가드 (TDD)
- 러너 본체(`render-*.mjs`, `build-reel.mjs`) 테스트 부재, 일괄 실행 진입점(`npm run smoke` 등), `render-blocks.mjs` 의 덮어쓰기와 코드 중복·환경 설정 불일치
- `visual: ok` 상태명을 검사 범위가 드러나게 변경 (`rendered_nonblank` 등), 자막 누락 감지가 실제로 발동하는지 검증
- `caption-emoji-pop` 렌더 실패 원인 (같은 `page.goto` 타임아웃 재현, 미해결)
- 렌더 결정성(같은 입력 재렌더 동일성), 한글 폰트의 OS 간 차이
- 이미지·영상·3D 장면의 PDF, 분기 슬라이드·소리가 있는 덱의 렌더, 전환 애니메이션, 청중 동기화
- YouTube 업로드 실측 (사용자 승인 필요, 공식 문서끼리 충돌하는 비공개 제한 규칙)
- Hypit 사용 여부는 "개인 도구 vs 판매 제품" 결정 뒤에 (설치 점검 미실시)
- `.harness-kit/hooks/check-secrets.sh` 수정 이력 확인과 상류 리포팅(`/hk-report-issue`), spec 범위 훅이 제목에 묶은 두 경로를 인식 못 한 것(spec-01-02) 리포팅
- 프로세스: 성공 기준별 체크표 추적, 장시간 일괄 실행 전 3조합 파일럿 (phase-01 회고 교훈)

