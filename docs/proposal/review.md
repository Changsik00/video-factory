# 제안서 검토 노트

## 사실 확인으로 정정한 것
1. **HyperFrames 저장소 주소 불일치**: 제안서 본문은 `hyperframes-org/hyperframes`(404), 보조 자료는 `heygen-com/hyperframes`(존재, Apache-2.0). 후자를 사용한다.
2. **Hypit 라이선스가 불명확**(`NOASSERTION`). 상업 채널 운영 전제라면 Phase 0의 최우선 확인 항목.

## 문서 간 불일치
- 프로젝트명 "YouTube Factory" vs 저장소 `video-factory` → 저장소명을 따라 **Video Factory**로 정리(변경 가능). 쇼츠·블로그 등 확장 비전과도 맞다.
- 콘텐츠 메타 파일: `manifest.json`(본문) vs `sources.json`(보조 자료) → 역할이 다르므로 둘 다 둔다. `manifest.json`=장면 명세, `sources.json`=출처 목록.
- 모노레포 최상위 이름 `youtube-factory/` → 저장소 루트로 대체.

## 설계상 리스크 / 질문
1. **Hypit과 HyperFrames 역할 중첩**: 둘 다 장면·렌더·타이밍을 다룰 수 있다. 하나가 다른 하나를 내부에서 쓰는지, 병렬 어댑터가 정말 필요한지 Phase 0에서 결정. 하나로 충분하면 어댑터를 1개로 줄인다 (원칙 10).
2. **"기존 구현체 80% / 자체 20%"** 는 방향성일 뿐 측정치 아님. 성공 지표에 쓰지 않는다.
3. **Hypit의 재사용은 명시적**(자동 캐시 아님)이라는 주장은 미검증. 자체 캐시 레이어(Phase 3)의 범위가 이 결과에 좌우된다.
4. **TTS 선택** 미정: 음성 생성 도구/모델과 한국어 품질, 비용을 Phase 0~1에서 결정.
5. **Obsidian 연동 수준**: "Markdown 파일을 읽는다"로 충분한지, frontmatter 규약이 필요한지.
6. **린터**: ESLint vs Biome 택1 필요 → Biome 제안(설정 단순). Phase 1 시작 시 확정.
7. **Format vs Scene Template** 경계가 모호: 파일 구조상 Format이 장면 템플릿 목록을 포함하는 것으로 가정.
8. **유튜브 정책**: AI 생성 콘텐츠 공개 표시, 반복적/대량 생산 콘텐츠 수익화 정책을 Phase 4 이전에 확인.
9. **대형 미디어**: git 제외로 시작(.gitignore 반영), 필요 시 Git LFS.

## 최초 구현 권장 순서
Phase 0 검증 → RAG explainer 1편(Phase 1). 형식 3개 이상은 1편이 끝난 뒤.
