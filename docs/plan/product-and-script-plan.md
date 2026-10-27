# 제품 기획: 이펙트·샘플 쇼케이스

작성 2026-10-26, 방향 수정 2026-10-27. 자료 조사 기반 기획이며 **직접 실행해 검증한 것은 아직 없다** (원칙 6).
근거 표기: **[문서]** 저장소 README·소스·LICENSE·registry를 직접 읽음 / **[2차]** 블로그·비교글 / **[추정]** 판단 / **[미검증]** Phase 1에서 실측.

## 1. 방향 (2026-10-27 결정)

- 주제 있는 설명 영상이 아니라, **이펙트와 각종 샘플을 보여주는 프로젝트**로 시작한다.
- **음성(TTS)은 하지 않는다. 자막만 넣는다.** 음성은 나중에 별도 phase.
- 결과물 후보: (1) 이펙트별 짧은 샘플 클립 (2) 샘플을 훑어볼 수 있는 카탈로그(색인) (3) 여러 샘플을 묶은 릴/모음 영상.

음성이 빠지면서 단순해지는 것: TTS 서비스 선택, 한국어 음성 품질, 음성↔장면 동기, 단어 정렬(전사)이 모두 불필요. 시간은 **사람이 정한 값**이 된다.

## 2. 이 방향의 기술 근거

### HyperFrames 레지스트리 [문서, `registry/` 직접 집계]
- **블록 210개 + 컴포넌트 239개.** 블록은 `registry-item.json`에 `title`, `description`, `tags`, `dimensions`, `duration`, `author`, `license`, 수정 가능한 `variables`(텍스트·색 등)가 정의된 **완결된 샘플 장면**이다. → 카탈로그 색인의 원천 데이터로 거의 그대로 쓸 수 있다.
- 태그 분포(상위): showcase 62, webgpu 40, webgpu-shader 36, transition 33, overlay 31, background 30, carousel 26, images 25, 3d 20, gallery 20, shader 19, webgl 17, title-card 13, lower-third 13, code 11, social 11, data 10, vertical 10, typography 9, mock-ui 9, map 8.
- 해상도: 대부분 1920x1080 (약 195개), 1080x1080 14개, 일부 세로.
- 컴포넌트 중 `caption-*`(glitch-rgb, kinetic-slam, matrix-decode, highlight, gradient-fill, emoji-pop, clip-wipe 등) **자막 스타일 컴포넌트가 다수** → "자막만" 요구와 직접 맞는다.
- 설치: `hyperframes add <name>` / `hyperframes catalog --tag <tag> --json` [문서].

### 확인되지 않은 것 / 위험 [미검증]
- **GPU 의존:** webgpu 40, webgl 17개 등은 헤드리스 Chrome 렌더에서 GPU/플래그가 필요할 수 있다. macOS에서 실제 렌더가 되는 비율을 측정해야 한다.
- **라이선스 표기:** 블록 210개 중 172개는 `license` 필드가 비어 있고, 36개는 `Apache-2.0 AND MIT`, 1개 OFL-1.1이다. 저장소는 Apache-2.0이지만 블록별 작성자(`author`)가 있어 **외부 기여물의 권리·크레딧 처리 방식을 확인**해야 한다. 업로드 시 작성자 표기를 기본 정책으로 둔다 [추정].
- **YouTube 정책 [2차]:** 남이 만든 템플릿을 그대로 모은 영상은 "템플릿 기반·일반 콘텐츠"로 분류될 수 있다. 쇼케이스는 **샘플을 변형(내용 교체)하고, 해설·비교·분류 같은 편집 기여를 더한다**는 기준을 둔다. 공식 YPP 문서로 재확인 필요.
- 시각 품질·렌더 시간·폰트 라이선스·한글 폰트 지원은 실측 전 판단 불가.

### Hypit의 위치
Hypit은 생성 모델·영상 복제·음성 정렬이 강점인 도구다 [문서]. 음성 없는 이펙트 쇼케이스에는 필요성이 낮고 라이선스상 본인 채널 운영은 허용되는 것으로 읽힌다(LICENSE 전문 확인, 법률 검토 아님) [추정]. **Phase 1에서는 HyperFrames에 집중하고 Hypit은 최소 점검(설치·라이선스 기록)만 한다.** 이펙트 소재가 부족하거나 생성형 장면이 필요해질 때 재검토한다.

## 3. 제작 가능한 상품 (우선순위)

| 순위 | 상품 | 설명 | 비고 |
|---|---|---|---|
| 1 | **이펙트 샘플 클립** | 블록/컴포넌트 하나당 3~10초 클립 + 포스터 이미지. 텍스트 변수는 한국어 등으로 교체한 버전 포함 | 카탈로그의 기본 단위 |
| 2 | **카탈로그 색인** | 태그·길이·작성자·라이선스·미리보기를 담은 JSON + 열람용 HTML 페이지 | 레지스트리 메타를 가공. 수작업 편집 불필요 |
| 3 | **모음 릴 (60~180초)** | 태그별(전환, 자막, 3D, 코드 등) 샘플을 이어 붙이고 이펙트 이름·태그를 **자막으로 표기** | 사람이 볼 수 있는 YouTube용 산출물 |
| 4 | 세로 쇼츠 | 1~2개 샘플 + 이름 자막 | 세로 블록 10개 + 해상도 변환 |
| 5 | 자막 스타일 비교 | 같은 문장에 `caption-*` 스타일을 적용해 나란히 비교 | "자막만" 요구의 쇼케이스 |

## 4. 자막 방식과 대본 형식

음성이 없으므로 **SRT가 입력으로서 의미를 가진다**: 타이밍을 사람이 정하고, SRT는 어떤 도구에서나 편집·검증되며 YouTube 업로드에도 그대로 쓰인다. 다만 SRT에는 장면·이펙트 지정·스타일이 없으므로 구조는 분리한다.

```
content/<id>/script.md       장면 구성 + 이펙트 지정 (사람이 편집)
content/<id>/captions.srt    자막 타이밍·문구 (사람이 편집, 표준 형식)
        │  컴파일 (검증: 길이 초과, 겹침, 빈 구간)
        ▼
content/<id>/manifest.json   Content Manifest (장면, 컴포넌트, 자막 트랙)
        ▼
output/<id>/*.mp4, captions.srt   렌더 결과
```

### `script.md` 예시 (초안)

````markdown
---
id: transitions-reel-001
title: 전환 효과 모음
format: showcase-reel
language: ko-KR
target: { platform: youtube, aspect: "16:9", resolution: 1920x1080 }
captions: captions.srt
caption_style: caption-highlight     # catalog/components 의 자막 컴포넌트 이름
status: draft
---

## Scene 1 — 오프닝
- block: title-card
- vars: { title: "전환 효과 모음" }
- duration: 4s

## Scene 2 — 크로스 전환
- block: <registry 블록 이름>           # hyperframes catalog 로 확인
- credit: <registry 의 author>          # 업로드 설명란 자동 생성용
- duration: 6s
````

`captions.srt`는 일반 SRT다. 전환 시각은 `script.md`의 duration 누적으로 정해지므로, 컴파일 단계에서 **SRT 자막의 구간이 영상 전체 길이를 벗어나거나 겹치면 오류**로 처리한다.
- 단어 단위 강조(카라오케식)는 HyperFrames 자막 블록이 단어 타이밍 JSON(`[{id,text,start,end}]`)을 요구한다 [문서]. SRT는 구 단위라서, 단어 구간은 구 안에서 **글자 수 비례로 균등 분배**해 생성한다 [추정, 품질 미검증]. 구 단위 스타일부터 시작하는 것을 권장한다.

### 에디터/스튜디오
처음에는 만들지 않는다. 편집은 텍스트 편집기(VS Code/Obsidian), 미리보기는 HyperFrames Studio(`hyperframes preview`, "evolving" 상태) [문서]. 카탈로그 색인 HTML은 읽기 전용으로 만들되 자체 편집 UI는 병목이 확인될 때까지 보류.

### 에이전트 명령 스크립트 관리
`catalog/workflows/<name>/`에 `workflow.md`(단계, 입출력 계약, 사람 승인 게이트)와 `prompts/`를 둔다. 예: `build-catalog`(레지스트리 → 색인), `render-sample`(블록 → 클립+포스터), `build-reel`(태그 → 모음 릴). 버전은 git과 `version` 필드로 관리하고, 영상 manifest에 사용한 워크플로 버전을 기록한다. 실행 기록은 `runs/`(git 제외)에 둔다.

## 5. 로드맵 (harness-kit phase 번호 기준)

| Phase | 내용 | Done 기준 |
|---|---|---|
| **1. tool-validation** (진행 중) | HyperFrames 설치·렌더, 블록 시험(카테고리별 10여 개, GPU 의존 블록 포함), `caption-*` 자막 시험, FFmpeg 검사, 샘플 1편 | 렌더 성공/실패 표, `docs/tool-findings.md`, 샘플 영상 1편 |
| 2. catalog-index | 레지스트리 메타 → 카탈로그 JSON + 열람용 HTML, 라이선스·작성자 필드 정리 | 전체 블록이 색인에 나오고 렌더 불가 항목은 표시됨 |
| 3. sample-clips | 블록별 샘플 클립·포스터 일괄 렌더(캐시, 실패 재시도 상한), 텍스트 변수 교체본 | 대상 블록 렌더 성공률·시간 기록 |
| 4. showcase-reel | `script.md`+`captions.srt` 컴파일, 태그별 모음 릴 1편, 사람 승인 | 승인된 릴 + 업로드 패키지(작성자 크레딧 포함) |
| 5. shorts / 자막 비교 | 세로 파생, 자막 스타일 비교 영상 | 2번째 포맷이 새 코드 최소로 동작 |
| 6. (조건부) 음성 | TTS 선택·한국어 품질 비교, 단어 정렬 | 별도 기획 후 |

## 6. 결정이 필요한 항목

1. 열람 형태: 영상(YouTube) 위주인가, **웹에서 훑어보는 카탈로그 페이지**도 필요한가? (Phase 2 범위가 달라짐)
2. 자막 언어: 한국어 위주, 영어 병기 여부.
3. 블록 작성자 크레딧을 어떻게 표기할지 (영상 자막 vs 설명란).
4. 렌더 환경: GPU 의존 블록(webgpu/webgl 약 57개)이 이 Mac에서 안 돌 때 제외할지, 대체 경로를 찾을지.

## 7. 출처
- HyperFrames: <https://github.com/heygen-com/hyperframes> (README, `registry/blocks/*/registry-item.json` 집계, `skills/hyperframes/references/captions.md`, `storyboard-format.md` 직접 확인)
- Hypit: <https://github.com/hypit-ai/hypit> (README, `LICENSE` 직접 확인)
- [HyperFrames vs Remotion](https://www.wireflow.ai/blog/hyperframes-vs-remotion), [SRT vs VTT](https://www.camb.ai/es/blog-post/srt-vs-vtt-vs-sbv-subtitle-formats-explained) [2차]
- [YouTube AI 수익화 정책 (vidIQ)](https://vidiq.com/blog/post/youtube-ai-monetization/), [TechCrunch 2026-07-20](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/) [2차, 공식 YPP 문서로 재확인 필요]
