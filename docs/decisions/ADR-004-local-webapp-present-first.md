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
- HyperFrames 는 시간을 임의로 옮겨도 결과가 같은 HTML(`data-start`, GSAP 타임라인)을 렌더한다. React 상태로 움직이는 슬라이드가 이 방식으로 안정적으로 렌더되는지는 확인하지 못했다.
- HyperFrames 에는 이미 `preview`(스튜디오)와 `present`(발표 모드)가 있다 (CLI 도움말 확인). 어디까지 되는지는 미확인이다. 프로젝트 원칙 1(기존 구현체 조사)을 먼저 적용해야 한다.

## 🎯 Decision (제안)
1. **구조**: 로컬에서 도는 웹앱이다. React 는 UI 껍데기(대본 편집, 자산 제안 패널, 발표 제어)만 맡고, 슬라이드 자체는 일반 HTML + GSAP 이며 iframe 으로 표시한다. 같은 슬라이드가 발표·PDF·MP4 에 그대로 쓰인다. Node 서버가 어댑터를 통해 HyperFrames CLI 와 헤드리스 Chrome 을 호출한다 (원칙 4).
2. **흐름**: 대본 작성 → 자산 없이 텍스트 기본 레이아웃으로 **즉시 발표 모드** → 에이전트 자산 제안을 사용자가 승인하며 다듬기 → 만족하면 PDF → MP4 → 게시. 렌더 비용이 큰 MP4 는 맨 뒤에 둔다.
3. **먼저 조사**: React 앱을 만들기 전에 `present`/`preview`(와 `/slideshow` 스킬, reveal.js 같은 기존 덱 도구)가 단계 진행·전환을 어디까지 지원하는지 시험한다. 스킬 설치는 spec 근거와 사용자 확인 후에만 한다.
4. **UI 는 맨 뒤에 만든다.** 출력 형식이 확인되기 전에 화면부터 만들면 형식이 바뀔 때마다 다시 만든다. phase-02 에서 세 출력을 끝까지 만든 뒤 UI 를 입힌다.
5. **게시(YouTube 업로드)는 사용자가 승인한 때만** 한다. 에이전트는 제목·설명 초안만 만든다.

## 📊 Consequences
- **긍정**: 대본을 쓰자마자 발표해 볼 수 있어 피드백이 빠르다. 슬라이드가 순수 HTML 이라 HyperFrames 렌더와 호환될 가능성이 높다.
- **부정**: 로컬 서버가 필요해 다른 사람에게 배포하려면 호스팅이나 클라우드 렌더(외부 서비스, 사용자가 요청할 때만)가 필요하다. iframe 분리 구조와 단계 모델은 미검증이다.
- **중립**: Hypit 은 이 결정에 포함되지 않는다 (`docs/plan/multi-format-presentation-plan.md` §6).

## 🔀 Alternatives
- **슬라이드까지 React 컴포넌트**: 비채택(잠정) — HyperFrames 결정적 렌더와 충돌할 수 있다. 시험으로 반증되면 재검토한다.
- **HyperFrames `preview`/`present` 만 사용**: 동작 범위를 확인한 뒤 재판단한다. 충분하면 React 는 부족한 부분만 만든다.
- **UI 먼저**: 비채택 — 형식 미검증 상태라 재작업 위험이 크다.

## 📌 Status
Proposed (2026-10-30). 사용자가 방향에 동의했으나 구조는 phase-02 시험 후 Accepted 로 올린다.

## 🔗 Related
- ADR-002, ADR-003
- `docs/plan/multi-format-presentation-plan.md`
