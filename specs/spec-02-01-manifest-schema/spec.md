# spec-02-01: 대본(콘텐츠 명세) 스키마와 검증

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-02-01` |
| **Phase** | `phase-02` |
| **Branch** | `spec-02-01-manifest-schema` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-11-01 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황
ADR-003 은 "하나의 대본(콘텐츠 명세, Content Manifest)에서 HTML 발표·PDF·MP4 를 낸다"고 정했고, phase-01 에서 3장 덱 하나로 세 출력이 가능함을 확인했다 (`docs/tool-findings.md`). 그러나 그 덱은 손으로 쓴 HTML 이었고, 원본이 되어야 할 **대본(명세)은 아직 형식도 검증도 없다.** `present` 가 읽는 slideshow JSON(`slides`, `fragments` 는 마스터 타임라인의 **절대 시각**)과 영상용 장면 길이는 사람이 맞춰 써야 했고, 오류는 `check` 가 아니라 `present` 를 띄워야 드러났다.

### 문제점
- 세 출력이 공유할 단일 원본이 없다. 장면 길이·단계 시각을 여러 곳에 중복해서 쓰게 된다.
- 단계(fragment) 시각은 절대 시각이라 슬라이드를 하나 끼워 넣으면 뒤의 모든 값이 틀어진다.
- 형식 오류(겹치는 구간, 범위 밖 단계, 없는 이미지 파일, 오타난 필드)를 생성·렌더 이전에 잡을 방법이 없다.

### 해결 방안
슬라이드 목록을 담는 **최소 JSON 명세 스키마**를 정하고, 순수 함수 `validateManifest` 로 구조 오류를 코드·경로와 함께 보고하며, `resolveTimeline` 으로 슬라이드 로컬 시각을 절대 시각(`present` fragment, 영상 장면 길이)으로 변환한다. 5장짜리 샘플 명세를 만들어 검증을 고정한다. 생성(덱·PDF·MP4)은 다음 spec 이다. 새 프레임워크를 만들지 않는다 (원칙 6).

## 스키마 (초안)

```json
{
  "title": "샘플 덱",
  "lang": "ko",
  "slides": [
    {
      "id": "points",
      "duration": 8,
      "heading": "단계 진행",
      "subheading": "선택",
      "items": ["항상 보임", { "text": "단계 1 에서 나타남", "step": 1 }],
      "image": { "src": "images/placeholder.png", "alt": "설명" },
      "steps": [3.0, 6.0],
      "notes": "발표자 노트"
    }
  ]
}
```

- `slides[].id`: 소문자·숫자·하이픈, 명세 안에서 유일 (장면 `data-composition-id` 로 쓰임)
- `duration`: 슬라이드 길이(초), 0 초과 숫자. 슬라이드는 배열 순서대로 이어 붙는다 (겹침이 구조적으로 불가능)
- `heading`: 필수 비어 있지 않은 문자열. `subheading`, `notes` 는 선택 문자열
- `items`: 문자열 또는 `{text, step}`. `step` 은 이 항목이 나타나는 **단계 번호**(정수, `steps` 인덱스). 생략하면 처음부터 보임
- `steps`: 슬라이드 **로컬** 정지 시각 배열 (초). 순증가, 각 값은 0 초과 `duration` 이하. phase-01 실측에 따라 `present` 는 fragment 가 있는 슬라이드를 **첫 단계 시각에서 진입**한다
- `image`: `{src, alt?}`. `src` 는 명세 파일 기준 상대 경로이고 파일 존재 여부를 검증 옵션으로 확인한다
- 알 수 없는 필드는 오류 (오타 `step`/`steps` 를 조기에 잡기 위함)

`resolveTimeline` 결과: 슬라이드별 `{id, start, end, fragments(절대 시각), ...}` 와 전체 길이. `fragments[i] = start + steps[i]`.

## 요구사항

1. `validateManifest(manifest, { exists })` 가 `{ ok, errors: [{ path, code, message }] }` 를 반환한다. 파일 존재 확인은 주입한 `exists(path)` 로 하고, 생략하면 확인하지 않는다 (순수 함수 유지).
2. 위 스키마의 모든 규칙을 검증하고 오류마다 안정적인 `code` 를 둔다. 최소 다음 무효 사례를 거부한다: 슬라이드 없음, id 중복, id 형식 오류, `duration` 이 0 이하 또는 숫자가 아님, `heading` 없음, `steps` 가 순증가가 아님, `steps` 값이 0 이하이거나 `duration` 초과, `items[].step` 이 범위 밖, `steps` 없이 `items[].step` 사용, 이미지 파일 없음, 알 수 없는 필드, `notes`/`items` 형식 오류. (무효 사례 10개 이상)
3. `resolveTimeline(manifest)` 가 절대 `start`/`end`, 절대 `fragments`, 전체 길이를 계산한다. 슬라이드를 끼워 넣어도 뒤 슬라이드의 절대 시각이 자동으로 이동함을 테스트로 고정한다.
4. 5장짜리 샘플 명세(`fragment` 슬라이드 2장 이상, 이미지 슬라이드 1장 이상)를 `catalog/formats/` 아래에 두고, 이 샘플이 검증을 통과함을 테스트로 고정한다. 이미지는 생성한 **자리표시자**임을 파일 이름과 문서에 명시한다.
5. 스키마를 `docs/manifest-schema.md` 에 문서화한다 (필드, 규칙, 오류 코드, 시각 변환, `present` 진입 규칙).

## Out of Scope

- 덱·PDF·MP4 생성 (spec-02-02, spec-02-03)
- slideshow JSON 의 `hotspots`, `slideSequences`(분기), 소리, 전환 효과 명세
- 이미지·영상 이외의 자산, 에이전트가 명세를 쓰거나 자산을 제안하는 기능
- JSON Schema 라이브러리 도입 (직접 검증 함수로 충분한지 먼저 본다)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **스키마 모양**: 슬라이드 로컬 시각 `steps` 와 항목별 `step` 번호 모델 (절대 시각은 도출). 다른 모델(항목마다 `at` 시각 등)을 원하면 이 spec 에서 바꾼다.
> - [ ] 샘플 이미지는 생성한 자리표시자(`placeholder`)이며 실제 자산이 아니다.

> [!WARNING]
> - [ ] 스키마는 이후 덱 생성기(spec-02-02)와 PDF·MP4 출력(spec-02-03)에서 바뀔 수 있다. 이 spec 은 지금 알려진 제약(`present` fragment 절대 시각, 첫 단계 진입)만 반영한다.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 검증 | 순수 함수 + 오류 목록 반환(예외 없음) | 생성기와 에이전트가 오류를 그대로 쓸 수 있고 테스트가 쉽다 |
| 시각 | 명세에는 로컬 시각, 도출 시 절대 시각 | 슬라이드 삽입 시 값이 틀어지지 않게 |
| 파일 확인 | `exists` 주입 | 순수성 유지, 테스트에서 파일 없이 검증 |
| 라이브러리 | 도입 안 함 | 원칙 6, 규칙이 작음 |

## Proposed Changes

#### [NEW] `scripts/lib/manifest.mjs`
`validateManifest`, `resolveTimeline` 과 오류 코드.

#### [NEW] `tests/manifest.test.mjs`
무효 사례 10개 이상, 유효 사례, 시각 변환(삽입 시 이동), 샘플 명세 검증.

#### [NEW] `catalog/formats/sample-deck/manifest.json`, `catalog/formats/sample-deck/images/placeholder.png`
5장짜리 샘플 명세와 생성한 자리표시자 이미지.

#### [NEW] `docs/manifest-schema.md`
스키마 문서.

#### [MODIFY] `specs/spec-02-01-manifest-schema/task.md`, `backlog/phase-02.md`
진행 상태 갱신.

## 검증 계획

```bash
npm test    # manifest.test.mjs 포함, 기존 141개 유지
```

수동 검증:
1. 샘플 명세에서 `resolveTimeline` 결과를 출력해 절대 시각·전체 길이가 손으로 계산한 값과 같은지 확인 — 기대: 5장 합계 일치, fragment 가 슬라이드 시작 + 로컬 시각
2. 샘플 명세의 필드를 일부러 오타(`step`)로 바꿔 `validateManifest` 를 돌려 오류가 나는지 확인 — 기대: unknown field 오류

## 롤백 계획

- 새 파일만 추가하므로 `git revert`. 기존 코드·상태 영향 없음. 외부 서비스 부수효과 없음.

## ADR 후보

- [ ] ADR 가치 있는 결정 있음 → 후보: `manifest-local-steps` (로컬 시각 vs 절대 시각 모델, type: decision)
- [x] 없음 (스키마 모양은 `docs/manifest-schema.md` 에 기록, 이후 spec 에서 바뀌면 그때 ADR)

## ✅ Definition of Done

- [ ] 모든 테스트 PASS (무효 사례 10개 이상 포함)
- [ ] 샘플 명세가 검증을 통과함을 테스트로 고정
- [ ] `docs/manifest-schema.md` 작성
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-02-01-manifest-schema` 브랜치 push 완료
