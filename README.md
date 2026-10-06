# 고민의 방파제

고민을 입력하면 3D 테트라포드로 쌓이고, 파도가 밀려와 흩어뜨리는 세로형 Three.js 웹앱입니다.

## 실행

별도 빌드 과정 없이 `dist` 폴더를 정적 서버로 열면 됩니다.

```bash
npx serve dist
```

브라우저에서 표시된 로컬 주소로 접속하세요. 파도 소리는 브라우저 정책상 화면을 누르거나 음소거 버튼을 누른 뒤 시작됩니다.

## GitHub Pages 배포

1. 이 폴더의 파일을 GitHub 저장소에 업로드합니다.
2. 저장소의 **Settings → Pages**로 이동합니다.
3. **Source**를 **GitHub Actions**로 선택합니다.
4. `main` 브랜치에 파일을 올리면 포함된 워크플로가 `dist` 폴더를 자동 배포합니다.

## 구조

- `dist/index.html` — 화면과 상단 입력창
- `dist/app.js` — Three.js 바다, 하늘, 테트라포드, 파괴 효과
- `dist/surf-audio.js` — 파도 소리
- `dist/Water.js`, `dist/Sky.js` — 수면·대기 표현
- `dist/waternormals.jpg` — 수면 노멀맵

## 기술

- Three.js
- WebGL
- GitHub Pages

