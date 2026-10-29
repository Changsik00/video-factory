# spec-01-03: 자막 이펙트 갤러리

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-01-03` |
| **Phase** | `phase-01` |
| **Branch** | `spec-01-03-caption-gallery` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Research + Feature |
| **작성일** | 2026-10-29 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황
spec-01-02에서 자막 컴포넌트 5개를 한국어 SRT로 렌더했고 블록 배경 3개 위에서도 돌렸다 (`docs/tool-findings.md`). 사용자의 평가: "같은 자막 이펙트를 여러 영상에 넣었을 뿐", "다양한 영상에서 다양한 자막 이펙트를 봐야 한다". 아직 사람이 볼 만한 결과물이 없다.
레지스트리의 `caption-style` 컴포넌트는 16개다. 구조는 세 갈래다 (설치 후 grep 확인):
- `var WORDS`/`var TRANSCRIPT` 보유 14개 (기존 5개 + `camera-follow`, `emoji-pop`, `gradient-fill`, `kinetic-slam`, `matrix-decode`, `neon-accent`, `neon-glow`, `particle-burst`, `texture`). `particle-burst`는 `RAW_GROUPS`도 가짐.
- `var W` + `var BLOCKS` 구조 2개 (`editorial-emphasis`, `parallax-layers`): 현재 치환 로직으로는 못 바꾼다.
- `camera-follow`의 `data-duration`은 9초, 나머지는 8초.
배경 후보로 본 `background` 태그 블록 30개 중 셰이더류(`aurora`, `blob`, `mesh-gradient`, `plasma`, `flowing-gradient`)는 길이가 2초다. 자막(약 7.5초) 아래에 깔려면 반복이 필요하다.

### 문제점
- 16개 중 11개는 한 번도 렌더하지 않았다. 구조가 다른 2개는 조립 방식부터 모른다.
- 배경이 밝음/어두움 3개뿐이고 중간 밝기(60~180)와 움직임이 큰 배경은 없었다.
- 모아서 볼 수 있는 산출물이 없다.
- 밝은 배경에서 묻히는 스타일의 보완책을 시험한 적이 없다.

### 해결 방안
16개 스타일 전부를 성격이 다른 배경 4~5개 위에서 렌더하고, 스타일·배경 이름을 표기한 모음 영상 한 편(reel)과 프레임 시트로 만든다. 밝은 배경에서 묻히는 스타일에는 어두운 막(scrim)을 시험한다.

## 요구사항

1. 자막 컴포넌트 16개 전부를 설치·조립해 렌더를 시도하고 결과(성공/부분/실패)와 원인을 기록한다. `W`/`BLOCKS` 구조 2개는 먼저 데이터 모양을 조사해 치환 방법을 정하고, 안 되면 실패 원인과 함께 기록한다.
2. 배경 4~5개를 정한다: 밝음, 중간(YAVG 60~180), 어두움, 움직임 큼을 포함. 후보는 이펙트 블록이며 2초 블록은 8초를 채우는 방식을 찾는다 (같은 컴포지션 id 의 반복 마운트는 2초 이후 검은 화면이 되어 실패 → 미리 렌더한 영상을 ffmpeg 로 이어 붙여 `<video>` 로 까는 방식으로 변경). 선정 근거(YAVG, 길이)를 기록한다.
3. 스타일 × 배경 조합을 렌더한다 (최대 16 × 5 = 80). 하나씩 순차, 렌더당 timeout 300초, 타임아웃일 때만 1회 재시도. 실패는 로그 그대로 기록한다.
4. 각 렌더 영상 위에 스타일 이름과 배경 이름 라벨을 표기한다 (모음 영상에서 구분하기 위함).
5. 밝은 배경에서 묻힌 스타일 대상으로 scrim 옵션(자막 아래의 어두운 그라데이션 막)을 적용해 전후를 프레임으로 비교한다.
6. 성공한 조합에서 스타일마다 대표 1~2개를 골라 이어 붙인 모음 영상 1편을 만들고, `ffprobe`로 검사하고 프레임 시트를 만든다. 산출물은 `runs/`에 둔다 (git 제외).
7. 결과를 `docs/tool-findings.md`에 기록하고 사용자 판정(보기에 쓸 만한가, 가독성)을 받는다.
8. 외부 게시·업로드는 하지 않는다. 모의 성공을 만들지 않는다.

## Out of Scope

- 업로드, 크레딧·라이선스 표기 정리, 브랜드 모방 블록 처리 기준 (다음 spec)
- 음성·음악·효과음 (ADR-001)
- 사용자 영상 파일을 배경으로 쓰는 것 (출처 결정 대기, 아래 참조)
- 가독성의 자동 측정 (spec-01-02에서 `check`가 부적합함을 확인. 눈으로 판정)
- 한글 폰트 번들, 스타일 수정 명세 저장·재적용
- Hypit 점검 (ADR-002에 따라 보류)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **배경 영상 출처가 아직 정해지지 않았다.** 기본값은 HyperFrames 블록만 사용이다. 사용자 영상 파일을 쓰려면 경로와 사용 권한을 알려 달라 (이 spec의 범위는 블록만이고, 영상이 정해지면 별도 spec으로 다룬다).
> - [ ] 전체 렌더 약 30분 이상 걸린다 (draft, 조합당 약 20초 × 최대 80). 백그라운드로 실행한다. 괜찮은가?
> - [ ] 모음 영상 안의 라벨(스타일 이름)이 이펙트를 가릴 수 있다. 작은 글씨로 구석에 둔다.

> [!WARNING]
> - [ ] 16개 중 일부는 조립이 안 될 수 있다 (구조가 다르거나 에셋 필요). 안 되는 것은 성공으로 만들지 않고 원인을 기록한다.
> - [ ] 2초짜리 셰이더 블록을 이어 붙이면 이음새가 보일 수 있다 (결과로 기록).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 조립 | spec-01-02의 치환 + 루트 마운트를 확장 (`hostHtml`에 label, scrim, 배경 반복) | 검증된 경로를 재사용 |
| 구조 2종 | `W`/`BLOCKS` 데이터 모양 조사 후 치환 함수 추가 (TDD) | 순수 함수로 테스트 가능한 부분만 단위 테스트 |
| 배경 | `catalog/validation/backdrops.json`에 선정 결과와 YAVG 기록 | 사람이 관리하는 자산 (원칙 7) |
| 실행 | 러너에 `--all`, `--backdrops` 추가, 조합별 결과를 한 JSON에 누적 | 이어서 실행(재개) 가능하게 |
| 모음 | `scripts/build-reel.mjs`가 ffmpeg로 연결 | 외부 호출은 어댑터를 통한다 (원칙 4) |
| CLI | `hyperframes@0.8.206` 고정, 텔레메트리 off | `docs/project-principles.md` |

## Proposed Changes

#### [MODIFY] `scripts/lib/captions-inject.mjs`, `tests/captions-inject.test.mjs`
`hostHtml`에 `label`, `scrim`, 영상 파일 배경(`backdrop.video`) 추가. `W`/`BLOCKS` 구조 치환 함수 추가 (조사 결과에 따라). 매트릭스 1차 실행에서 `var GROUPS = [{wordStart,wordEnd,start,end}]` 객체 묶음과 `var KEYWORDS = new Set([...])`(숫자 인덱스/문자열) 하드코딩이 더 발견되어 함께 치환.

#### [NEW] `scripts/lib/matrix.mjs`, `tests/matrix.test.mjs`, `tests/backdrops-list.test.mjs`
조합 계획·이어서 실행·파일 이름·라벨(순수 함수)과 배경 목록 규칙 테스트.

#### [MODIFY] `scripts/lib/diagnose.mjs`, `tests/diagnose.test.mjs`
`parseYavg`, `backdropVerdict`: 배경이 중간에 사라진 렌더를 success 로 두지 않는다 (smoke 에서 거짓 성공 발견). `summarizeCheck(json, scope)`: check 가 샌드박스 전체를 린트해 다른 조합 파일의 결과가 섞이므로 자막 파일/배경 파일/무관한 파일로 나눠 집계. `renderWarningCodes`, `hasScriptError`: exit 0 이어도 `script_error_isolated` 면 자막이 비므로 실패 처리. `inferReason`: 정상 로그의 "WebGL renderer" 문구가 gpu 로 오분류되던 규칙 수정, navigation_timeout·script_error 추가.

#### [MODIFY] `scripts/render-blocks.mjs`
`--list` 옵션 (배경 후보 측정에 재사용, 기본 동작 불변).

#### [MODIFY] `scripts/render-captions.mjs`
`--all`(16개), `--backdrops=a,b,c`, 조합 결과 누적·재개, 라벨·scrim 옵션 연결.

#### [NEW] `scripts/build-reel.mjs`, `tests/reel.test.mjs`
대표 조합 선택(순수 함수)과 ffmpeg 연결·검사.

#### [MODIFY] `catalog/validation/caption-styles.json`
16개 전체 목록.

#### [NEW] `catalog/validation/backdrops.json`
선정한 배경과 YAVG·길이·반복 여부.

#### [MODIFY] `docs/tool-findings.md`
갤러리 절: 16개 결과, 배경 선정, scrim 전후, 모음 영상 검사, 미확인.

## 검증 계획

```bash
npm test
node scripts/render-captions.mjs --all --dry-run          # 16개 레지스트리 확인, 구조 분류
node scripts/render-captions.mjs --all --backdrops=...    # 매트릭스 (백그라운드, 약 30분)
node scripts/build-reel.mjs                               # 모음 영상 + ffprobe
```

수동 검증:
1. 프레임 시트로 16개 스타일 × 배경의 한글 표시와 가독성 확인
2. scrim 전후 프레임 비교
3. 모음 영상 `open`으로 재생해 흐름과 라벨 확인

## 롤백 계획

기존 스크립트 수정은 옵션 추가 위주이고 기본 동작은 그대로다 (spec-01-02 테스트가 보호). `git revert`로 충분하다. `runs/`는 git 제외.

## ADR 후보

- [ ] 없음. 자막 입력 형식과 스타일 선택 기준이 확정되면 phase-02에서 ADR 후보.

## ✅ Definition of Done

- [ ] 모든 테스트 PASS
- [ ] 16개 컴포넌트의 결과와 원인이 `docs/tool-findings.md`에 기록됨
- [ ] 배경 선정 근거와 scrim 전후 결과가 기록됨
- [ ] 모음 영상이 만들어지고 `ffprobe` 검사를 통과함
- [ ] 사용자 판정(보기에 쓸 만한가, 가독성)이 기록됨
- [ ] `walkthrough.md`와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-01-03-caption-gallery` 브랜치 push 완료
