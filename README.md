# 고민의 방파제

고민을 입력하면 3D 테트라포드로 쌓이고, 파도가 밀려와 흩어뜨리는 세로형 Three.js 웹앱입니다.

## 실행

빌드 과정 없이 저장소 루트를 정적 서버로 열면 됩니다.

```bash
npx serve .
```

파도 소리는 브라우저 정책상 화면을 누르거나 음소거 버튼을 누른 뒤 시작됩니다.

## GitHub Pages 배포

**Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** 로 설정하면 바로 배포됩니다.

## 구조

```
index.html          화면과 상단 입력창
css/style.css       스타일
js/app.js           Three.js 바다, 하늘, 테트라포드, 파괴 효과
js/surf-audio.js    파도 소리
js/lib/             Three.js 및 Water/Sky 애드온
src/waternormals.jpg 수면 노멀맵
src/waves.mp3        파도 소리
```

## 음원

파도 소리: [Sea: Waves](https://bigsoundbank.com/sea-waves_s0266.html) — BigSoundBank, CC0
