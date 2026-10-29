---
id: ADR-003
type: decision
date: 2026-10-30
status: accepted
---

# ADR-003: 결과물은 하나의 대본에서 HTML·PDF·MP4 세 형식으로 낸다 (PPTX 제외)

## 📚 Context
ADR-001 은 첫 제품을 "무음 이펙트 쇼케이스 영상"으로 정했다. spec-01-01~03 은 HyperFrames 블록·자막 컴포넌트를 영상으로 렌더하는 것만 검증했다 (`docs/tool-findings.md`). 2026-10-30 사용자가 결과물 형식을 넓혔다.
- 정적 자료는 PDF, 프레젠테이션은 HTML(화살표로 진행), 자동 재생은 MP4.
- 하나의 스크립트(대본)에서 에이전트가 이미지·인터랙션을 만들고 진행한다.
- PPTX 는 하지 않는다.

확인한 사실 (HyperFrames CLI 0.8.206 도움말 직접 확인):
- `render --format` 은 mp4, webm, mov, gif, png-sequence, hls 이다. PDF·PPTX 출력은 없다.
- `snapshot` 은 지정 시각의 프레임을 PNG 로 저장한다.
- `present` 는 슬라이드 덱을 발표자 모드로 서빙한다. 화살표 진행·전환 방식은 `/slideshow` 스킬에 있고 이 저장소에는 설치되어 있지 않아 **확인하지 못했다**.
- 컴포지션은 `1920x1080` 고정, `overflow: hidden`, GSAP 타임라인으로 움직이는 HTML 이다 (예: `caption-emoji-pop`). 그대로 인쇄하면 애니메이션 중간 상태가 찍히거나 잘린다.

## 🎯 Decision
1. 출력 형식은 세 가지다. 용도가 다르다.

| 형식 | 용도 | 만드는 방법 |
|---|---|---|
| HTML | 프레젠테이션 (화살표로 단계 진행) | 슬라이드 HTML 을 브라우저에서 연다 |
| PDF | 정적 자료 | 같은 HTML 의 "인쇄 모드"(모든 단계가 끝난 최종 상태)를 헤드리스 Chrome 으로 PDF 출력 |
| MP4 | 자동 재생 | 같은 HTML 의 타임라인을 `hyperframes render` |

2. 원본은 하나의 대본(콘텐츠 명세, Content Manifest)이다. 슬라이드는 "최종 상태 + 순서 있는 단계(step)"로 정의하고 단계마다 지속 시간을 둔다. HTML 은 단계 단위로 진행, MP4 는 같은 단계를 시간대로 재생, PDF 는 최종 상태를 한 페이지로 낸다.
3. PPTX 는 하지 않는다. 사용자가 제외했다.
4. 음성·음악·효과음은 ADR-001 을 유지한다. 사용자가 요청할 때만 추가한다.
5. ADR-001 은 "음성 없음, 자막만" 부분이 유효하다. "결과물은 영상" 가정은 이 ADR 로 대체한다.

## 📊 Consequences
- **긍정**: 한 번 정의한 슬라이드가 세 형식에 쓰인다. 문구 수정 시 세 형식을 다시 뽑을 수 있다. 프로젝트 원칙 2·3(명세 중심, 형식·컴포넌트·워크플로 분리)과 맞는다.
- **부정**: 아래는 모두 **미검증 가설**이다. 1) 슬라이드 단계 모델이 HTML 진행과 MP4 렌더를 같은 코드로 지원하는지 2) 같은 HTML 의 인쇄 모드로 PDF 가 깨지지 않는지 3) `present`/`/slideshow` 가 이를 지원하는지. 슬라이드를 16:9 고정 페이지로 설계해야 한다.
- **중립**: PDF 는 글자가 벡터로 남는 방식(HTML 인쇄)을 택한다. 편집 가능한 PPTX 는 범위 밖이다.

## 🔀 Alternatives
- **PNG 를 묶은 PDF**: 비채택 — 글자 선택·검색이 안 되고 화질이 해상도에 묶인다.
- **PPTX 포함**: 비채택(사용자 결정) — HyperFrames 방식(HTML·GSAP)의 이펙트를 옮길 수 없고 PowerPoint 고유 전환만 가능하며 별도 도구가 필요하다 (일반 지식, 미시험).
- **영상만**: ADR-001 원안 — 비채택 이유: 정적 자료와 발표 용도를 놓친다.

## 📌 Status
Accepted (2026-10-30, 사용자 결정). 가설 검증은 phase-02 시험(`docs/plan/multi-format-presentation-plan.md` §5)에서 한다. 실패하면 이 ADR 을 수정한다.

## 🔗 Related
- ADR-001, ADR-002, ADR-004
- `docs/plan/multi-format-presentation-plan.md`
- `docs/tool-findings.md`
