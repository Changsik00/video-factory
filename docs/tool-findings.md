# 도구 검증 결과 (tool-findings)

Phase 1 실측 기록. 확인한 것만 적고, 하지 않은 것은 "미확인"에 따로 둔다 (`docs/project-principles.md`).

## HyperFrames — 블록 렌더 (spec-01-01, 2026-10-27)

### 환경
| 항목 | 값 |
|---|---|
| OS / CPU | macOS (Darwin 25.6.0), x86_64 |
| GPU | Intel UHD Graphics 630 (Chrome이 `ANGLE Metal Renderer`로 hardware 모드로 인식) |
| Node / FFmpeg | v22.14.0 / 8.1.1 |
| HyperFrames CLI | `hyperframes@0.8.206` (고정) |
| 렌더 품질 | `draft` (looks/delivery는 미확인) |
| 레지스트리 | `raw.githubusercontent.com/heygen-com/hyperframes/main/registry` (**main 브랜치를 실행 시점에 읽음, 고정 아님**) |

### 절차 (재현)
```bash
npm test                                   # 단위 테스트
node scripts/render-blocks.mjs --dry-run   # 후보 15개가 레지스트리에 있는지 확인
node scripts/render-blocks.mjs             # 샌드박스(runs/phase-01/hf-sandbox) 에 설치·렌더·ffprobe·화면 검사
# 변수 교체 렌더
node scripts/render-blocks.mjs --only=<블록> --suffix=-ko --variables='{"키":"값"}'
```
러너는 `HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`, `HYPERFRAMES_SKIP_SKILLS=1`을 설정하고 `add --no-clipboard`를 쓴다.

### 결과 (후보 15개, 전부 렌더 성공)
성공 15 / 부분 0 / 실패 0. 15개 총 렌더 시간 약 7.0분 (블록당 약 12~83초, 2~15초 길이 영상).

| 블록 | 그룹 | 결과 | 길이(초) | 해상도 | 렌더(초) | 화면 검사 |
|---|---|---|---|---|---|---|
| code-highlight | cpu | success | 5.0 | 1920x1080 | 37 | ok |
| data-chart | cpu | success | 15.0 | 1920x1080 | 32 | ok |
| lt-bold-block | cpu | success | 4.8 | 1920x1080 | 21 | ok |
| hw-title | cpu | success | 6.0 | 1920x1080 | 20 | ok |
| editorial-flash-overlay | cpu | success | 4.0 | 1920x1080 | 23 | ok |
| beat-freeze-cut | cpu | success | 6.0 | 1920x1080 | 41 | ok |
| chatgpt-exchange | cpu | success | 14.9 | 1080x1920 | 83 | ok |
| canopy-part-title | cpu | success | 12.0 | 1920x1080 | 46 | ok |
| spain-map | cpu | success | 12.0 | 1920x1080 | 36 | ok |
| color-wheel | webgpu | success | 2.0 | 1920x1080 | 15 | ok |
| aurora | webgpu | success | 2.0 | 1920x1080 | 13 | ok |
| chrome-orb | webgpu | success | 2.0 | 1920x1080 | 13 | ok |
| code-3d-extrude | webgl | success | 8.0 | 1920x1080 | 17 | ok |
| cinematic-zoom | webgl | success | 4.0 | 1920x1080 | 15 | ok |
| camera-dolly-zoom | 3d | success | 4.0 | 1920x1080 | 12 | ok |

- "그룹"은 레지스트리 태그 기준 추정이다. `cpu` 그룹은 webgpu/webgl/shader/3d 태그가 없는 블록.
- 길이·해상도는 ffprobe 값이 레지스트리 메타와 일치(길이 허용오차 0.5초).
- "화면 검사"는 ffmpeg `signalstats`의 최대 밝기와 프레임 간 차이(YDIF)로 빈 화면/정지 화면을 걸러낸 결과다 (기준: 최대 밝기 20 이하=blank, YDIF 최대 0.01 미만=static). 실측 기준: 빈 프로젝트 0.005, 가장 느린 움직임(chrome-orb) 0.05, 일반 블록 0.25 이상.
- 중간 프레임 15장을 직접 확인했다 (`runs/phase-01/posters/sheet.png`, git 제외). 모두 내용이 보이고 깨진 화면은 없었다. 시각 품질 판정은 사용자 확인이 필요하다.

### 한국어 텍스트 변수 (요구사항 4)
| 블록 | 결과 | 렌더(초) | 화면 검사 |
|---|---|---|---|
| canopy-part-title | success | 25 | ok |
| chatgpt-exchange | success | 43 | ok |

- `canopy-part-title`(headline1/2)과 `chatgpt-exchange`(prompt, intro1/2, 표 문구)에서 한국어 글자가 두부(□) 없이 표시되었다 (프레임 확인: `runs/phase-01/posters/ko-canopy.png`, `ko-chat.png`). **사용자 확인 필요.**
- 한국어 폰트는 블록의 기본 폰트(Helvetica, ChatUI)에서 시스템 폰트로 대체되어 나왔다. 대체 폰트가 다른 OS/컨테이너에서도 있는지는 미확인.

### 발견한 문제와 처리
1. **에셋이 있는 블록은 렌더러가 `/assets/...`를 프로젝트 루트에서 찾는다.** `canopy-part-title`은 `compositions/canopy-part-title/assets/`에 설치되지만, 그대로 렌더하면 텍스처 404가 나고 **렌더는 성공(exit 0)하면서 화면은 검은색**이 된다. 에셋을 프로젝트 루트 `assets/`로 복사하면 정상 렌더된다 (러너에 반영). 블록이 여러 개이면 에셋 파일명 충돌 가능성이 있다 (미확인).
2. **"렌더 성공(exit 0) + ffprobe 통과"만으로는 거짓 성공을 걸러내지 못한다.** 위 1번이 그 사례였고, 그래서 화면 검사를 추가했다.
3. **일부 블록은 하위 폴더에 설치된다** (`compositions/<이름>/<이름>.html`). 경로를 `add --json`의 `written`에서 찾아야 한다.
4. **오버레이/자막 계열 블록은 단독으로 렌더하면 흰 배경 위에 나온다** (`lt-bold-block`, `hw-title`, `editorial-flash-overlay`). 쇼케이스에는 배경 장면과의 합성 방식이 필요하다 (spec-01-03에서 확인).
5. **CLI 기본 동작의 부작용:** 텔레메트리 전송 기본 켜짐, `add`가 클립보드에 복사, `init`이 샌드박스에 `AGENTS.md`/`CLAUDE.md` 생성, 스킬 자동 설치 시도. 러너는 앞의 세 가지를 끄고 스킬 설치를 건너뛴다.
6. **변수 메타가 불완전하다.** 레지스트리 `registry-item.json`의 `variables`는 후보 15개 중 14개가 비어 있고(`camera-dolly-zoom`만 문자열이 아닌 변수 4개; 전체 210개 중 문자열 변수가 있는 블록은 22개), 실제 변수는 컴포지션 HTML의 `data-composition-variables`에 선언된 경우가 있다 (후보 중 3개: camera-dolly-zoom, chatgpt-exchange, canopy-part-title). 변수 목록은 설치 후 HTML에서 읽어야 한다.
7. **실제 제품 UI를 흉내 낸 블록이 있다.** `chatgpt-exchange`는 "Ask ChatGPT" 화면과 "Official A.I Ranking" 같은 권위 표시 칩을 기본값으로 포함한다 (`claude-exchange`도 같은 계열로 보임). 쇼케이스에 넣을 때 상표·오인 위험이 있으므로 "모의 화면" 표기 또는 제외 기준이 필요하다.
8. 블록 문서(SKILL.md)가 예전 CLI 버전(0.8.12)을 가리키는 예가 있다. 문서 명령을 그대로 믿지 말고 실측한다.

### 환경 대응 결과 (GPU)
후보 중 webgpu 태그 3개(aurora, chrome-orb, color-wheel), webgl/shader 2개(code-3d-extrude, cinematic-zoom), 3D 1개(camera-dolly-zoom)가 이 Intel Mac에서 모두 정상 렌더되었다. 전체 210개 중 webgpu/webgl 계열 약 57개에 대한 일반화는 하지 못한다 (표본 6개).

### 미확인 (이 spec에서 하지 않은 것)
- 후보 외 195개 블록의 렌더 가능 여부, 에셋 파일명 충돌
- `looks`/`delivery` 품질, 렌더 결정성(같은 입력 2회 렌더 결과가 같은지), `--docker` 렌더
- 병렬 렌더 시 자원 사용 (러너는 블록을 순차 처리)
- 오디오가 필요한 블록(음성 없는 방향이라 제외)
- 시각 품질의 사람 판정, 한국어 표시의 사용자 확인
- `caption-*` 자막 컴포넌트 (spec-01-02), 샘플 영상·라이선스·작성자 정리·Hypit 점검 (spec-01-03)

## HyperFrames — 자막 컴포넌트 (spec-01-02, 2026-10-28)

### 환경·절차
환경은 위와 같다 (`hyperframes@0.8.206` 고정, 렌더 `draft`, 텔레메트리 off).
```bash
npm test                                                   # srt, 치환, 호스트 HTML 단위 테스트
node scripts/render-captions.mjs --dry-run                 # SRT 검증 + 레지스트리(component) 확인
node scripts/render-captions.mjs                           # 자막 단독 (어두운 단색 바탕)
node scripts/render-captions.mjs --backdrop=<블록>         # 블록 배경 위에 자막
```
입력은 `catalog/validation/captions.srt`(한국어 3구간, 9단어, 0.5~7.5초), 시험 스타일은 `catalog/validation/caption-styles.json`. 구간은 공백 기준 단어로 나누고 글자 수 비례로 시간을 분배한다 (`scripts/lib/srt.mjs`).

### 컴포넌트가 붙는 방식 (실측)
- **컴포넌트는 독립 실행되는 전체 HTML이다.** 호스트에 붙여넣는 조각이 아니다 (`wiring-components.md` 문서의 설명과 다르게 이번 5개는 `data-composition-id`와 `data-duration`을 가진 완결 문서). 루트 `index.html`에서 `data-composition-src`로 마운트하면 `check`와 렌더가 동작한다.
- 예시 영어 단어가 코드 안에 박혀 있다: `var WORDS = [...]`(2개) 또는 `var TRANSCRIPT = [...]`(3개), 모두 `{text,start,end}` 모양. `highlight`, `clip-wipe`는 묶음(`RAW_GROUPS`)도 수동 지정이라 같이 치환했다. 나머지 3개는 자동 묶음이다. **5개 모두 같은 방식으로 치환되어 자동화에 문제가 없었다.** 16개 전체에 일반화하지는 못한다.
- 컴포넌트 폰트는 Google Fonts(Montserrat, Poppins, Space Grotesk, 라틴 전용)다. 이 Mac에는 설치돼 있지 않고(`fc-list` 0건), **한글은 시스템 대체 폰트로 그려졌다.** 다른 OS/컨테이너에서는 한글 모양이 달라질 수 있다 (미확인).

### 결과 1: 자막 단독 (5개, 어두운 단색 바탕)
| 스타일 | 결과 | check (오류/경고) | 화면 | 렌더(초) | 프레임 확인 |
|---|---|---|---|---|---|
| caption-highlight | success | 0 / 1 | ok | 19 | 강조 박스가 단어 구간을 따라 이동 |
| caption-pill-karaoke | success | 0 / 4 | ok | 18 | 단어별 색 진행 |
| caption-clip-wipe | success | 0 / 1 | ok | 20 | 단어 단위 노출. 아직 안 나온 단어 자리를 비운 채 가운데 정렬해 처음엔 왼쪽으로 치우침 |
| caption-weight-shift | success | 0 / 1 | ok | 21 | 두 줄(굵게/얇게) |
| caption-glitch-rgb | success | 0 / 1 | ok | 24 | 단어에서 RGB 분리 |

한글은 5개 모두 두부(□) 없이 표시되었다. 경고는 전부 컴포넌트 내부의 `z-index:-1`(`negative_z_index`)이다 (`pill-karaoke`만 4건).

### 결과 2: 블록 배경 위 (배경 3개 × 스타일 5개 = 15)
배경은 밝기(YAVG)로 골랐다: `data-chart` 222(밝음), `spain-map` 45(어둡고 디테일 많음), `canopy-part-title` 27(어둡고 질감). **중간 밝기(60~180) 배경은 후보에 없어 확인하지 못했다.**

| 스타일 | data-chart (밝음) | spain-map (어두움) | canopy-part-title (어두움) |
|---|---|---|---|
| highlight | 강조 단어만 읽힘, 나머지 흐림 · check 오류 1 | 읽힘 · 오류 6* | 읽힘 · 오류 0 |
| pill-karaoke | **읽힘** (자체 알약 배경) · 오류 6* | 읽힘 · 오류 8* | 읽힘 · 오류 0 |
| clip-wipe | **거의 안 보임 · check 통과(오류 0)** | 읽힘 · 오류 6* | 읽힘 · 오류 0 |
| weight-shift | **거의 안 보임** · 오류 10* | 읽힘 · 오류 6* | 읽힘 · 오류 0 |
| glitch-rgb | **읽힘** (자체 어두운 그라데이션) · 오류 11* | 읽힘 · 오류 6* | 읽힘 · 오류 0 |

"읽힘/안 보임"은 중간 프레임(1.2, 3.8, 6.2초)을 AI가 읽은 판단이며 **사용자 판정이 필요하다** (`runs/phase-01/posters/backdrop-*.png`, git 제외). `*` 표시는 배경 블록 자신의 글씨가 오류에 섞인 것으로 보인다 (아래 3번).

### 발견한 문제와 처리
1. **밝은 배경에서는 흰 글자 자막(`weight-shift`, `clip-wipe`, 일부 `highlight`)이 묻힌다.** 자체 배경이 있는 `pill-karaoke`와 `glitch-rgb`는 배경 밝기에 영향을 덜 받는다. 쇼케이스에는 배경 밝기에 맞는 스타일 선택 또는 자막용 어두운 막(scrim)이 필요하다. 스킬 문서도 밝기 60 초과 배경에는 scrim을 권한다.
2. **`check`의 대비 판정은 가독성의 기준이 될 수 없다.** `data-chart` 위 `clip-wipe`는 눈으로 안 읽히는데 지적이 없다. 한편 `spain-map` 위 오류 6건은 5개 스타일에서 똑같이 나왔고 셀렉터가 `svg > g`여서 **배경 지도 블록 자체의 글씨**에서 나온 것이다. 가독성은 프레임을 보거나 별도 측정이 필요하다.
3. 오류 수에 배경 블록 자신의 문제가 섞인다. 자막만 분리해 판정하려면 배경만 `check`한 대조가 필요하다 (이번엔 하지 않음).
4. 러너 거짓 성공 방지: `check` 오류가 있으면 `partial`로 분류하도록 고쳤다. `check --json`의 `ok:true`만 기록하던 때는 경고가 숨었다 (`summarizeCheck`로 섹션별 기록).
5. 러너 결함 1건을 고쳤다: 레지스트리 확인 함수가 블록만 인정해 컴포넌트를 전부 "없음"으로 판정했다 (type 인자 추가).
6. `check`의 `motion` 섹션은 기본으로 꺼져 있다(`enabled:false`). 모션 검사는 하지 않았다.

### 결과 3: 스타일 수정 주문이 반영되는가 (실험 1회)
`caption-highlight` 복사본(`runs/phase-01/cap-sandbox/`, git 제외)의 CSS/GSAP를 직접 고쳐 주문 5개를 시험했다.

| 주문 | 방법 | 반영 |
|---|---|---|
| 강조색 노랑 | `.hl-word-bg` 배경과 그림자 색 | 확인 |
| 글자 크게 (80→120px) | `fitFontSize` 기준 크기 | 확인 |
| 위치 위로 (140→300px) | `.hl-group` `bottom` | 확인 |
| 튕기듯 등장 | 박스 트윈 이징 `back.out(3)` | 프레임에서 박스 넘침으로 확인 (영상 재생 확인은 안 함) |
| 글자 검정 | - | **적용하지 못함 (AI가 빠뜨림).** 노랑 박스 위 흰 글자가 되어 가독성이 나쁨 |

- 컴포넌트는 설치되면 평범한 소스라 CSS/JS를 고치는 방식으로 세세한 주문이 반영된다. 옵션 화면이나 변수로 바꾸는 방식이 아니며, 컴포넌트마다 구조가 달라 고칠 위치가 다르다.
- 주문 항목이 많을수록 누락·충돌(노랑 + 흰 글자)이 생긴다. 이를 잡는 것은 `check`가 아니라 프레임 확인이다.
- 모호한 주문("쫀득하게")은 해석이 갈려 미리보기 반복이 필요하다.
- 강조할 단어는 SRT로 알 수 없다 (글자 수 비례 분배는 의미와 무관). 대본 형식에 강조 표기가 필요하다.
- 시험하지 않은 것: 레지스트리에 없는 새 효과를 처음부터 만들기, 컴포넌트가 노출하는 `variables`(`data-variable-values`)로 바꾸기, 같은 수정 명세를 다른 문장·영상에 재적용.

### 미확인 (이 spec에서 하지 않은 것)
- 나머지 11개 자막 컴포넌트, 세로(portrait) 자막, 영어 병기
- 단어 분배의 의미 있는 강조 위치: 글자 수 비례는 실제 발화와 무관하다. "동작하고 구간에 맞게 보인다"까지만 확인.
- 중간 밝기(60~180) 배경, 배경만 `check`한 대조, 자막용 scrim 적용 효과
- 한글 폰트를 번들해 OS 간 동일하게 보이는지 (`assets/fonts/` + `@font-face`)
- 긴 문장·3줄 이상·구간이 짧은 경우의 줄바꿈과 겹침
- 영상 위 자막(`<video>` 배경), 오버레이 블록과의 합성 (spec-01-03)
- **사용자 판정: 한글 표시, 단어 강조 타이밍, 배경 위 가독성 (판정 미수령).** 사용자는 `pill-karaoke` 영상을 재생했고 "자막 이펙트가 다양한 영상 위에서 다양하게 보여야 한다"는 방향을 주었다
