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

## HyperFrames — 자막 갤러리 (spec-01-03, 2026-10-29)

### 환경·절차
`hyperframes@0.8.206` 고정, 렌더 `draft`, 텔레메트리 off. 자막 컴포넌트 16개 × 배경 5개 = 80조합을 한국어 SRT(3구간, 9단어)로 렌더했다.
```bash
node scripts/render-captions.mjs --dry-run                         # 스타일 16, 배경 5, 80조합 확인
node scripts/render-captions.mjs --backdrops=<블록,...> [--only=<스타일,...>] [--scrim] [--force]
node scripts/build-reel.mjs [--per-style=2] [--exclude=키,키]       # 모음 영상 + 프레임 시트
```
결과는 `runs/phase-01/captions-matrix.json`(git 제외, 조합마다 즉시 저장·재개). 배경은 `catalog/validation/backdrops.json`(mk-background, data-chart, swirl, gallery-tunnel, canopy-part-title).

### 결과 (80조합 + scrim 8)
- **75/80 렌더 success.** 실패 5건은 전부 `caption-emoji-pop` (아래 참고). 나머지 15개 스타일은 5개 배경 모두 렌더·`check` 통과.
- 구조가 다른 `W`/`BLOCKS` 컴포넌트(`editorial-emphasis`, `parallax-layers`)도 치환해 렌더됐다. SRT에 강조 정보가 없어 "구간에서 가장 긴 단어 = 강조"라는 임시 규칙을 썼다.
- 한 건 약 20~40초(draft), 배경이 무거워도 큰 차이는 없었다. 80개 연속 실행은 약 1시간이고 PC 부하가 커서, 재개할 때는 4개씩 나눠 돌렸다.

### 눈으로 본 가독성 (3.8초 프레임 한 장 기준, 영상 전체 재생은 안 함)
| 구분 | 스타일 |
|---|---|
| 배경과 무관하게 읽힘 | `pill-karaoke`, `glitch-rgb`, `highlight`(박스형), `kinetic-slam`, `neon-accent`, `matrix-decode` |
| 밝은 배경(mk-background, data-chart)에서 묻힘, scrim 으로 개선 | `clip-wipe`, `gradient-fill`, `weight-shift`(차트 막대와 겹침은 남음), `neon-glow`·`particle-burst`(소폭) |
| scrim 으로 해결 안 됨 | `texture`(자막이 화면 중앙이라 아래쪽 scrim 이 못 덮음), `camera-follow`(글자가 번져 안 읽힘), `parallax-layers`(빨간 글씨가 화면과 차트를 덮음) |
| 렌더 불가 | `emoji-pop` |

- scrim(화면 아래쪽 어두운 막)은 자막이 아래쪽에 있는 스타일에서만 효과가 있다. 중앙에 뜨는 자막은 못 덮는다.
- `check` 가 모두 `ok` 여도 눈으로는 안 읽히는 조합이 있다 (spec-01-02 발견 2 재확인). 가독성은 프레임으로 봐야 한다.
- 왼쪽 위 스타일 라벨이 `data-chart` 의 제목과 겹친다 (라벨 위치 조정 필요, 이번엔 안 고침).

### `emoji-pop` 렌더 실패 (미해결)
- 5개 배경에서 4건 실패(`navigation_timeout` 3, `gpu` 1), 1건은 179초 걸려 렌더 후 `check` 에러로 partial. 추가로 draft 1회(240초 상한) 시도했고 같은 `page.goto` 에서 60초 Navigation timeout 이 재현됐다. 그 뒤로 재시도하지 않았다.
- **화질·PC 부하와 무관하게 페이지 로드 단계에서 막힌다.** 나머지 14개는 같은 Google Fonts 요청을 하고도 정상이며, 터미널 `curl` 응답은 0.2초다. 그래서 외부 폰트·네트워크 가설은 근거가 약하다.
- 다른 점은 컬러 이모지 글꼴과 파일 크기(13KB, 다른 것은 6KB 안팎)뿐이다. **원인은 확인하지 못했다.** 필요하면 별도 spec 에서 다룬다.

### 모음 영상
`caption-gallery.mp4` (1920x1080, h264, 192초, 24클립, `ffprobe` 통과). 스타일당 최대 2개 배경이고, 읽히지 않는 조합과 `camera-follow`, `parallax-layers`, `texture`, `emoji-pop` 은 뺐다. 제외는 프레임 시트를 보고 정했다 (`runs/` 는 git 제외, 업로드 안 함).

### 발견한 문제와 처리
1. 1차 전체 실행(약 70분)은 **무효**였다. `check` 가 다른 조합 파일까지 린트해 72개가 `partial` 로 오염됐고, 자막 스크립트가 터진 렌더가 exit 0 으로 `success` 처리됐다. 조합 범위로 `check` 를 한정하고 스크립트 오류를 감지하도록 고친 뒤 전체를 다시 돌렸다 (1차는 `captions-matrix.v1-contaminated.json` 로 보존).
2. 2초짜리 셰이더 배경(`swirl`)을 같은 노드로 반복 마운트하면 2초 이후 검은 화면이 나왔는데 `success` 로 기록됐다. 영상 이어 붙이기로 바꾸고 배경 사라짐을 검사하도록 했다 (이음새는 눈으로 판정 필요).

### 미확인 (이 spec에서 하지 않은 것)
- **사용자 판정 (모음 영상 재생, 읽힘, 이음새): 판정 미수령.** 제외 기준은 프레임 시트 한 장 기준의 에이전트 판단이다.
- 영상 전체 구간 재생 확인, 단어별 타이밍 이펙트가 의도대로 나오는지
- `emoji-pop` 실패 원인, 다른 OS·컨테이너에서의 한글 폰트 모양
- 세로(portrait), 긴 문장·3줄 이상, 영상(`<video>`) 위 자막의 실사용 확인

## HyperFrames — 덱 `present` (spec-01-04 V1, 2026-10-30, 초안)

### 환경·절차
`hyperframes@0.8.206`, `slideshow` 스킬은 GitHub main 기준 설치본(고정 CLI 와의 일치 미확인). 3장 덱(슬라이드 2에 fragment 7.0s, 10.0s)을 `runs/phase-01/deck/`(git 제외)에 만들고 `check --json` 통과 후 `present --no-open` 으로 띄웠다. 헤드리스 Chrome(`hyperframes browser path`)을 CDP 로 조종해 **실제 키 이벤트**를 넣고 스크린샷을 찍었다 (스크립트는 scratchpad, 저장소에 넣지 않음).

### 확인한 것 (실측)
- `present` 는 로컬 서버(포트 3004)를 띄우고 `<hyperframes-slideshow>` 컴포넌트로 덱을 감싼 페이지를 서빙한다. 외부 게시 아님.
- **ArrowRight/Space = 다음, ArrowLeft/Backspace = 이전**, F = 전체 화면, P = 발표자→청중 화면. 컴포넌트 소스(`/slideshow.js`)에서 확인했고 CDP 키 입력으로 ArrowRight, ArrowLeft, Space 를 실제로 눌러 동작을 확인했다 (Backspace, F, P 는 코드 확인만).
- 진행 순서: 슬라이드 1 → 슬라이드 2 의 첫 fragment 상태(항목 2개) → 두 번째 fragment 상태(항목 3개) → 슬라이드 3. 마지막에서 ArrowRight 는 멈춘다. ArrowLeft 는 직전 상태로 돌아간다. 카운터(`n / 3`)는 슬라이드 수이고 fragment 단계는 세지 않는다.
- **fragment 가 있는 슬라이드는 첫 fragment 시각에서 진입한다** (진입 직후 이미 그 시각까지의 항목이 보인다). 항목을 하나씩 보이려면 fragment 를 항목 수만큼 두어야 한다. fragment 가 없는 슬라이드는 "rest frame" 에서 진입한다 (문서 서술과 일치).
- 슬라이드 사이 화면은 정지 프레임으로 보면 즉시 전환(컷)처럼 보인다. 전환 애니메이션이 있는지는 확인하지 못했다 (정지 이미지 기준).

### 발견한 문제 (덱 작성 시)
1. **한 파일에 최상위 장면 3개를 직접 넣는 구조는 동작하지 않았다.** 스킬 문서의 "마스터 루트 없음" 서술을 따랐는데, CLI 가 첫 컴포지션만 읽어 길이가 4초(전체 16초)로 나왔고 `present` 에서 `unresolved sceneId` 오류, 장면 3개가 동시에 보이며 키를 눌러도 `1 / 3` 에서 움직이지 않았다.
2. **루트(`data-composition-id="main"`) + 장면 파일 마운트(`data-composition-src`, 각 파일은 `<template>`)** 구조로 바꾸자 길이 16초, 정상 진행했다. 고정 가이드(`format.md`)의 표준 구조다.
3. **`check --json` 은 1번의 깨진 구조도 통과시켰다** (`ok: true`, 지적 없음). 덱 구성 오류는 `present` 를 실제로 띄워 콘솔(`[hyperframes-slideshow] manifest errors`)과 키 진행으로 확인해야 한다. 첫 `check` 는 한글 폰트(`Apple SD Gothic Neo`)에 `@font-face` 가 없어 오류였다 (`src: local(...)` 로 해결, 이 환경에서 반복되는 지적).
4. 컴포넌트가 `/composition/sfx/{advance,fragment,branch-enter,back}.mp3` 를 요청해 404 가 난다 (소리 파일이 없음, 화면 진행에는 영향 없음으로 보임).

### 미확인
- 청중 화면 동기화(P 키, 두 번째 탭), 발표자 노트 표시, 핫스팟 분기
- 사용자가 직접 브라우저에서 눌러 보는 체감 확인 (**사용자 확인 요청 대기**)
- 슬라이드 전환 애니메이션의 유무

## HyperFrames — 덱 렌더 (spec-01-04 V2, 2026-10-30, 초안)

문서(`slideshow` 스킬): "덱을 MP4 로 렌더하지 마라. `render` 는 첫 장면만 남기고 조용히 잘라 버린다."

### 실측 (draft, 같은 3장 내용, 각 1회)
| 구조 | `render` 결과 |
|---|---|
| 최상위 장면 3개를 한 파일에 직접 둠 (스킬 문서의 "마스터 루트 없음" 서술대로) | **4.0초** (장면 1개 길이). 문서의 "첫 장면만 남음"을 **재현**했다. 오류 없이 종료 |
| 루트 `main`(16초) + 장면 3개를 `data-composition-src` 로 마운트 (표준 구조, `present` 도 동작하는 구조) | **16.0초**, 1920x1080 h264, 약 21초. 프레임 5장(1.5, 5, 8, 11, 13.5초)으로 장면 순서와 항목 등장 시점이 타임라인과 일치함을 확인 |

- **"덱을 렌더할 수 없다"가 아니라 "루트 없는 구조는 첫 장면만 남는다"로 보인다.** 루트를 두면 같은 파일이 `present`(키 진행)와 `render`(MP4)에 모두 쓰였다. 슬라이드용 JSON(`application/hyperframes-slideshow+json`)은 렌더에 영향을 주지 않았다.
- MP4 는 fragment 에서 멈추지 않고 타임라인을 연속 재생한다. 발표용 "정지"와 영상용 "시간"이 같은 타임라인 위의 서로 다른 읽기 방식이다.
- 범위: 이 결과는 소리·핫스팟·분기 슬라이드가 없는 최소 덱 하나에서 얻었다. 분기 슬라이드(`slideSequences` 전용 장면)가 있으면 영상에 어떻게 들어가는지, 소리가 있을 때 문서의 경고가 다른 이유로 맞는지는 확인하지 못했다.

## HyperFrames — 덱 PDF (spec-01-04 V3, 2026-10-30, 초안)

같은 3장 덱에서 슬라이드의 **최종 상태**를 PDF 로 냈다 (각 방식 1회).

| 방식 | 결과 | 글자 선택 | 비고 |
|---|---|---|---|
| (a) `snapshot --at 3.5,11.5,15` PNG → PDF (PIL) | 3쪽, 1440x810pt | **불가** (`pdftotext` 0자) | 이미지 PDF. `snapshot --at` 은 요청하지 않은 **영상 끝 프레임(15.52s)을 한 장 더** 만들고 `contact-sheet.jpg` 도 같이 쓴다. 쪽 수를 맞추려면 걸러야 함 |
| (b) 인쇄용 HTML → 헤드리스 Chrome `Page.printToPDF` | 3쪽, 1440x810pt (1920x1080px, `@page` 크기 지정) | **가능** (231자 추출, 한글 포함, 글꼴 `AppleSDGothicNeo` 임베드) | 벡터 PDF. 쪽마다 최종 상태(항목 3개 모두 보임)를 프레임으로 확인 |

### (b) 인쇄용 HTML 을 만든 방법
기존 장면 파일(`compositions/*.html`)의 스타일·본문·스크립트를 **그대로 재사용**했다. 영상용 HTML 을 그대로 인쇄하는 것이 아니라 인쇄용 페이지를 따로 생성한다.
1. 장면 파일마다 `<template>` 을 벗기고 `#root`/`id="root"` 를 장면별 id 로 바꿔 충돌을 피한다 (장면마다 `#root` 를 쓰기 때문).
2. 장면 스크립트를 즉시 실행 함수로 감싼다 (각 파일이 `const tl` 을 전역에 선언해 충돌하기 때문).
3. 페이지 시작 전에 `window.__timelines = {}` 를 선언한다. 런타임이 없는 환경이라 없으면 장면 스크립트가 등록 단계에서 예외를 내고, `fromTo` 는 이미 초기 상태(투명)를 적용해 **글자가 투명한 PDF**가 나왔다 (처음 시도, 텍스트 45자만 추출됨).
4. 로드 후 모든 타임라인을 `progress(1)` 로 끝까지 보내 최종 상태를 만든 뒤 인쇄한다.
- 스크립트(생성기·인쇄 드라이버)는 scratchpad 에 있고 **저장소에 넣지 않았다.** 장면 파일이 지켜야 할 규칙(전역 `const` 금지 등)이 생겼다.

### 판단
- 벡터 PDF 는 가능하다. 단 **"같은 HTML 을 그대로 인쇄"가 아니라 "같은 장면 파일에서 인쇄용 페이지를 생성"** 이다.
- 이 덱은 글자·색만 쓴다. 이미지·영상·3D(WebGL) 요소가 있는 장면은 인쇄 결과를 확인하지 않았다.

## YouTube 업로드 제약 (spec-01-04 V5, 2026-10-30, 문서 조사만)

**업로드는 하지 않았다.** 공식 문서 웹 조회와 2차 자료 기준이다 (직접 API 를 호출하지 않았다).

### 공식 문서로 확인 ([videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), 페이지 갱신일 2026-10-15)
- OAuth 범위: `youtube.upload`, `youtube`, `youtubepartner`, `youtube.force-ssl` 중 하나. 파일 최대 256GB, MIME `video/*`.
- 할당량 문서의 기본 한도: 일 10,000 유닛(그 외 엔드포인트 합산), `videos.insert` 일 100회. 한도를 늘리려면 **먼저 컴플라이언스 감사**를 통과해야 한다 ([quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)).
- `privacyStatus` 를 지정하지 않으면 `public` 이 기본이고, 계정 설정에 따라 `private` 이 기본이 될 수 있다.

### 문서끼리 충돌하는 부분 (**결론 못 냄**)
- 현재 `videos.insert` 페이지는 "미검증(unverified) API 프로젝트에서 올린 영상은 비공개로 제한되지 않는다"고 적고 있다.
- 2020-07-29 개정 내역(2차 자료로 확인)은 "2020-07-28 이후 만든 미검증 프로젝트의 `videos.insert` 영상은 비공개로 제한"이라고 했고, 감사를 통과해야 풀린다. 호출은 실패하지 않고 조용히 비공개로 잠긴다는 보고가 있다. GitHub 이슈에는 감사를 신청했는데도 잠겨 있다는 사례, 할당량 증가를 선택하니 풀렸다는 사례가 섞여 있다 ([이슈](https://github.com/porjo/youtubeuploader/issues/86)).
- **어느 쪽이 현재 사실인지는 실제 업로드해 보기 전에는 알 수 없다.** 업로드는 사용자 승인이 필요한 외부 게시이므로 이 spec 에서 하지 않았다.

### 설계에 주는 의미
- 업로드 후 응답의 `status.privacyStatus` 를 다시 읽어 요청한 값과 같은지 검사해야 한다. 비공개로 잠기면 감사 신청 또는 YouTube Studio 에서 수동 공개가 필요하다.
- 한 번 업로드에 OAuth 동의 화면 설정, 프로젝트 등록이 필요하다. 개인 채널 1개에 올리는 정도라면 기본 한도(일 100회)는 충분해 보인다 (추정).
- 게시 단계는 계속 사용자 승인 뒤에만 한다.

## 블록·컴포넌트 라이선스·작성자와 크레딧 방침 (phase-01 마감, 2026-10-31)

phase-01 성공 기준 4. 레지스트리(`heygen-com/hyperframes` main)의 항목별 `registry-item.json` 448개(블록 210, 컴포넌트 238)를 전부 내려받아 집계했다 (읽기 전용, 오류 0건). 법률 검토가 아니다. main 브랜치를 읽으므로 시점이 바뀌면 달라질 수 있다 (ADR-002).

### 필드 현황
| 구분 | 항목 수 | `license` 있음 | `author` 있음 |
|---|---:|---|---:|
| 블록 | 210 | `Apache-2.0 AND MIT` 36, `Apache-2.0` 1, `OFL-1.1` 1 (나머지 172개는 **비어 있음**) | 40 |
| 컴포넌트 | 238 | `MIT` 1, `MIT AND OFL-1.1` 1 (나머지 236개는 **비어 있음**) | 10 |

- `author` 값(블록): Jake Moran 27, Miao Yang 5, Stronkter 4, HeyGen 2, Tugra Avci 1, Joe Sai 1. `authorUrl` 은 항목 7개에만 있다.
- 필드가 비어 있다는 것이 "라이선스 없음"을 뜻하는지 저장소 라이선스(Apache-2.0)가 적용된다는 뜻인지는 **확인하지 못했다** (항목별 파일 헤더·NOTICE 확인 필요).
- 이전 기록(기획 문서 25행)의 172/36/1 은 일치했고 `Apache-2.0` 1개가 새로 보인다 (합계 210).

### 이번 phase 에서 실제로 쓴 항목
- 자막 컴포넌트 16개: **전부 `license`·`author` 모두 비어 있음.**
- 갤러리 배경 5개: `swirl` 만 `Apache-2.0 AND MIT`, 나머지 4개(`mk-background`, `data-chart`, `gallery-tunnel`, `canopy-part-title`)는 비어 있음.
- 후보 블록 15개: `chatgpt-exchange` 만 작성자(Jake Moran), `color-wheel`·`aurora`·`chrome-orb` 가 `Apache-2.0 AND MIT`, 나머지는 비어 있음.

### 크레딧 방침
- **현재 방침 (spec-01-01 협의의 추천값, 사용자 추가 결정은 없음)**: 작성자 크레딧은 **영상 위가 아니라 업로드 설명란**에 적는다. 사용한 항목의 `author` 가 있으면 그 값을, 없으면 출처로 "HyperFrames registry (heygen-com/hyperframes)" 를 적는다. `product-and-script-plan.md` §3 의 `credit: <registry 의 author>` 필드로 설명란을 자동 생성한다.
- **열린 판단**: `license` 가 비어 있는 항목을 상업 채널에 쓰는 것이 문제없는지는 법률 검토 영역이고 확인하지 못했다. 업로드 전에 저장소 라이선스와 개별 파일 헤더 확인이 필요하다.

### 브랜드·제품 모방 블록 처리 기준 (제안, 사용자 확인 필요)
이름·제목·설명에 브랜드·제품명(ChatGPT, Claude, Instagram, TikTok, Spotify, Slack, YouTube, X, macOS, iOS, Apple 등)이 나오는 블록이 16개 있다 (`stripes` 는 일반 단어라 제외, 이름 검색 기반이라 눈으로 확인하지는 않았다): `apple-money-count`, `chatgpt-exchange`, `claude-exchange`, `code-snippet-apple-terminal-pro`, `instagram-follow`, `ios26-liquid-glass`, `macos-notification`, `macos-tahoe-liquid-glass`, `nyc-paris-flight`, `slack-notification-ad`, `spotify-card`, `tiktok-follow`, `vfx-iphone-device`, `vpn-youtube-spot`, `x-post`, `yt-lower-third`.
- 제안: 쇼케이스·모음 영상에서는 **기본 제외**한다. 넣어야 하면 "모의 화면, 해당 회사와 무관" 같은 표기를 하고 사용자가 항목별로 승인한다 (`chatgpt-exchange` 는 "Official A.I Ranking" 같은 권위 표시 칩이 기본값이라 오인 위험이 있음, spec-01-01 발견 7).
- 이번 갤러리와 모음 영상에는 위 블록을 쓰지 않았다 (배경 5개, 자막 16개 목록에 없음).

## Hypit 라이선스 확인과 점검 결과 (phase-01 마감, 2026-10-31)

phase-01 성공 기준 5. `hypit-ai/hypit` 의 `LICENSE` 전문을 GitHub API 로 내려받아 읽었다 (법률 검토 아님). 저장소는 보관(archived) 상태가 아니고 마지막 푸시가 2026-10-30 이다. GitHub 라이선스 메타는 `NOASSERTION`(Other)이다.

### 조건 (전문 요약)
- "수정된 Apache-2.0 + 추가 조건". 그 외 권리·제한은 Apache-2.0 을 따른다.
- **허용 (상용 라이선스 불필요)**: 내려받아 자기 인프라에서 직접 실행, **자기 조직의 업무에 사용(상업 업무와 고객 대상 작업 포함)**, 한 조직이 운영하는 단일 테넌트 배포.
- **상용 라이선스가 필요한 경우**: (a) **멀티테넌트 서비스** — 조직 밖 둘 이상의 당사자가 별도 워크스페이스를 가지는 환경으로 운영하거나 Hypit 기능을 호스팅·SaaS 로 제3자에게 제공 (요금 유무 무관). (b) **상업적 재배포** — Hypit 또는 파생물을 판매·유료 라이선스·상업적 이익을 위해 제3자 제품에 번들로 제공.
- **표기 의무**: CLI, 생성된 실행 보고서·매니페스트, 거기서 파생된 사용자 대상 화면에서 Hypit 이름·로고·저작권 정보를 제거·수정하지 않는다 (사용자에게 노출되지 않는 용도에는 해당 없음).
- **결과물 권리**: 제작자는 결과물(영상·음성·이미지·매니페스트)에 권리를 주장하지 않으며 상업 이용을 포함해 조건이 없다. 단 제3자 모델·서비스 제공자를 거쳐 생성된 콘텐츠에는 그 제공자의 약관이 추가될 수 있다.

### 해석과 사용자 판단 요청
- "본인 채널 운영"은 "자기 조직의 업무"에 해당해 허용으로 읽힌다 (이전 기록과 같음).
- **이 프로젝트를 다른 사람에게 서비스로 제공하면 (a) 멀티테넌트 조항에 걸릴 수 있어 상용 라이선스가 필요하다.** 개인 제작 도구인지 판매 제품인지는 **사용자 판단 대기** 중이다 (`docs/plan/multi-format-presentation-plan.md` §7 질문 1).
- 생성 클립에 쓰이는 제3자 모델 제공자의 약관은 확인하지 않았다.

### 점검 범위
- **설치·실행 점검은 하지 않았다.** 내려받기와 유료 호출이 필요하고 ADR-002 가 Hypit 을 보류했기 때문이다. 쓰기로 정할 때 사용자 확인 후 한다.

## 사용자 확인 (phase-01 마감, 2026-10-31)

사용자가 모음 영상(`runs/phase-01/reel/caption-gallery.mp4`)과 덱 `present`(`runs/phase-01/deck`)를 직접 열어 보고 **"둘 다 기능적으로 동작함"** 을 확인했다. 스타일은 나중에 바꿔도 된다고 하여 **스타일·가독성·한글 표시 품질에 대한 판정은 받지 않았다** (해당 서술은 계속 에이전트 판독). 확인한 세부 항목(전환 효과, 청중 화면 동기화, 이음새)은 보고받지 못했으므로 미확인으로 둔다.
