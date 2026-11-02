# 대본(콘텐츠 명세) 스키마

spec-02-01 (2026-11-01). 하나의 대본에서 발표(HTML)·PDF·MP4 를 만들기 위한 **최소** 명세다 (ADR-003). 검증과 시각 변환은 `scripts/lib/manifest.mjs`, 샘플은 `catalog/formats/sample-deck/manifest.json`.
이 문서는 현재 구현의 규칙이다. 덱·PDF·MP4 생성(spec-02-02, 02-03)에서 필요에 따라 바뀔 수 있다.

## 형식

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
      "items": ["항상 보임", { "text": "단계 0 에서 나타남", "step": 0 }],
      "image": { "src": "images/placeholder.png", "alt": "설명" },
      "steps": [3.0, 6.0],
      "notes": "발표자 노트"
    }
  ]
}
```

| 필드 | 필수 | 규칙 |
|---|:---:|---|
| `title`, `lang` | - | 문자열 |
| `slides` | O | 1개 이상. 배열 순서대로 이어 붙는다 (겹침 불가) |
| `slides[].id` | O | 소문자·숫자·하이픈(`^[a-z0-9]+(-[a-z0-9]+)*$`), 명세 안에서 유일. 장면 `data-composition-id` 로 쓸 값 |
| `slides[].duration` | O | 0 초과 숫자(초) |
| `slides[].heading` | O | 비어 있지 않은 문자열 |
| `slides[].subheading`, `notes` | - | 문자열. `notes` 는 발표자 전용 |
| `slides[].items` | - | 원소는 문자열 또는 `{text, step}`. `step` 은 이 항목이 나타나는 단계 번호(정수, `steps` 인덱스). 생략하면 슬라이드 진입 시 이미 보임 |
| `slides[].steps` | - | 슬라이드 **로컬** 정지 시각(초) 배열. 순증가, 각 값은 0 초과 `duration` 이하 |
| `slides[].image` | - | `{src, alt?}`. `src` 는 명세 파일 기준 상대 경로 |
| 그 외 | | **알 수 없는 필드는 오류** (예: `step` 오타). 최상위·슬라이드·항목·이미지 모두 |

## 시각 변환

`resolveTimeline(manifest)` 는 로컬 시각을 절대 시각으로 바꾼다. 슬라이드를 끼워 넣어도 뒤의 값이 자동으로 이동한다.

- `start` = 앞 슬라이드들의 `duration` 합, `end` = `start + duration`, 전체 길이 `total`
- `fragments[i]` = `start + steps[i]` — `hyperframes present` 의 fragment 가 마스터 타임라인의 **절대 시각**이기 때문 (`.claude/skills/slideshow/`)
- 값은 밀리초로 반올림한다 (부동소수 누적 오차 제거)
- 유효하지 않은 명세는 예외를 던진다. 먼저 `validateManifest` 로 확인할 것

### 발표(`present`)에서의 단계 진입 규칙 (phase-01 실측, `docs/tool-findings.md`)
fragment 가 있는 슬라이드는 **첫 fragment 시각에서 진입**한다. 즉 `step` 0 의 항목은 슬라이드에 들어가자마자 보이고, 마지막 단계 이후 다음 화살표가 다음 슬라이드로 넘어간다. 항목을 하나씩 보이려면 단계 수를 항목 수에 맞춘다. `steps` 가 없는 슬라이드는 중간 정지 없이 한 화면이다.

## 오류 코드

`validateManifest(manifest, { exists })` 는 `{ ok, errors: [{ path, code, message }] }` 를 돌려주고 예외를 던지지 않는다. `exists(src)` 를 주면 이미지 파일 존재를 확인하고, 생략하면 확인하지 않는다. `path` 는 `slides[1].steps[0]` 형식이다.

| code | 의미 |
|---|---|
| `manifest_not_object` | 명세가 객체가 아님 |
| `slides_not_array`, `slides_empty` | 슬라이드 없음 또는 배열 아님 |
| `slide_not_object` | 슬라이드가 객체가 아님 |
| `id_invalid`, `id_duplicate` | id 형식 오류, 중복(뒤쪽에 보고) |
| `duration_invalid` | 0 이하이거나 숫자가 아님 |
| `heading_missing` | heading 없음 또는 빈 문자열 |
| `invalid_type` | 문자열이어야 하는 필드가 아님 (`title`, `lang`, `subheading`, `notes`, `image.alt`) |
| `items_invalid`, `item_invalid`, `item_text_missing` | items 형식 오류 |
| `item_step_invalid`, `item_step_out_of_range`, `item_step_without_steps` | 항목 `step` 이 정수가 아님, `steps` 인덱스 밖, `steps` 가 없는데 사용 |
| `steps_invalid`, `steps_not_increasing`, `step_out_of_range` | steps 형식, 순증가 아님, 0 이하 또는 `duration` 초과 |
| `image_invalid`, `image_missing_file` | image 형식 오류, 파일 없음 |
| `unknown_field` | 알 수 없는 필드 |

## 범위 밖 (아직 없음)
분기 슬라이드(`slideSequences`)와 핫스팟, 소리, 전환 효과, 이미지 외 자산, 슬라이드별 레이아웃·스타일. 생성기는 이 명세에서 덱(루트 + 장면 파일)을 만든다 (spec-02-02).

## 샘플 이미지
`catalog/formats/sample-deck/images/placeholder.png` 는 검증용으로 **생성한 자리표시자**이며 실제 자산이 아니다.
