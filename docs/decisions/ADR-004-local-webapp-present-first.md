---
id: ADR-004
type: decision
date: 2026-10-30
status: proposed
---

# ADR-004: 로컬 웹앱(React UI + HTML 슬라이드 + Node 서버)으로 만들고 발표를 먼저 연다

## 📚 Context
ADR-003 으로 출력 형식이 정해졌다. 이를 만드는 화면(UI)의 구조를 정해야 한다. 사용자 제안(2026-10-30): React 로 브라우저에서 실행하고, 대본을 쓰면 바로 발표(PPT) 모드로 들어가며, 결과가 좋으면 PDF·MP4 로 후속 처리한다.
- MP4 렌더는 Node, Chrome, ffmpeg 가 필요해 브라우저만으로는 안 된다. draft 렌더 기준 8초 클립 하나에 약 20~40초가 걸렸다 (spec-01-03 실측).
- HyperFrames 는 시간을 임의로 옮겨도 결과가 같은 HTML(`data-start`, GSAP 타임라인)을 렌더한다. React 상태로 움직이는 슬라이드가 이 방식으로 안정적으로 렌더되는지는 확인하지 못했다. (spec-01-04) 슬라이드를 일반 HTML + GSAP 장면 파일로 두면 `present` 와 `render` 가 같은 파일을 쓰는 것을 확인했다.
- HyperFrames 에는 이미 `preview`(스튜디오)와 `present`(발표 모드)가 있다. (spec-01-04) `present` 는 로컬 서버로 덱을 열고 화살표·Space 로 슬라이드와 fragment 를 진행했다. 슬라이드 목록·노트·fragment 는 HTML 안의 JSON 이 원본이다. `preview` 와 전환 애니메이션, 청중 동기화는 미확인이다.

## 🎯 Decision (제안)
1. **구조**: 로컬에서 도는 웹앱이다. React 는 UI 껍데기(대본 편집, 자산 제안 패널, 발표 제어)만 맡고, 슬라이드 자체는 일반 HTML + GSAP 이며 iframe 으로 표시한다. 같은 슬라이드가 발표·PDF·MP4 에 그대로 쓰인다. Node 서버가 어댑터를 통해 HyperFrames CLI 와 헤드리스 Chrome 을 호출한다 (원칙 4).
2. **흐름**: 대본 작성 → 자산 없이 텍스트 기본 레이아웃으로 **즉시 발표 모드** → 에이전트 자산 제안을 사용자가 승인하며 다듬기 → 만족하면 PDF → MP4 → 게시. 렌더 비용이 큰 MP4 는 맨 뒤에 둔다.
3. **조사 결과 (spec-01-04)**: `present` 가 단계 진행(키 입력)을 이미 제공한다. React 로 발표 화면을 다시 만들지 않고 `present` 를 쓰는 것이 기본이며, React 는 대본 편집과 자산 승인 같은 `present` 에 없는 부분만 맡는다. `preview`(스튜디오)와 `present` 의 전환·동기화 한계는 아직 모른다.
4. **UI 는 맨 뒤에 만든다.** 출력 형식이 확인되기 전에 화면부터 만들면 형식이 바뀔 때마다 다시 만든다. phase-02 에서 세 출력을 끝까지 만든 뒤 UI 를 입힌다.
5. **게시(YouTube 업로드)는 사용자가 승인한 때만** 한다. 에이전트는 제목·설명 초안만 만든다.

## 📊 Consequences
- **긍정**: 대본을 쓰자마자 발표해 볼 수 있어 피드백이 빠르다. 슬라이드가 순수 HTML 이라 HyperFrames 렌더와 호환될 가능성이 높다.
- **부정**: 로컬 서버가 필요해 다른 사람에게 배포하려면 호스팅이나 클라우드 렌더(외부 서비스, 사용자가 요청할 때만)가 필요하다. 덱 구성 오류는 `check` 가 잡지 못해 `present` 를 띄워야 알 수 있다. iframe 분리 구조(React 와 슬라이드)는 미검증이다.
- **중립**: Hypit 은 이 결정에 포함되지 않는다 (`docs/plan/multi-format-presentation-plan.md` §6).

## 🔀 Alternatives
- **슬라이드까지 React 컴포넌트**: 비채택(잠정) — HyperFrames 결정적 렌더와 충돌할 수 있다. 시험으로 반증되면 재검토한다.
- **HyperFrames `preview`/`present` 만 사용**: 동작 범위를 확인한 뒤 재판단한다. 충분하면 React 는 부족한 부분만 만든다.
- **UI 먼저**: 비채택 — 형식 미검증 상태라 재작업 위험이 크다.

## 📌 Status
Proposed (2026-10-30). 사용자가 방향에 동의했다. spec-01-04 로 슬라이드·`present`·렌더 호환은 확인했으나 React 껍데기, 로컬 서버 어댑터, 승인 흐름은 아직 시험하지 않아 Proposed 를 유지한다.

## 🔗 Related
- ADR-002, ADR-003
- `docs/plan/multi-format-presentation-plan.md`
