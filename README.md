# 메키 길드 포털

전투력/토벌전 현황, 실시간 공략 게시판, 주요 링크, 쉬어가기 게임 링크를 한 화면에서 볼 수 있는 GitHub Pages용 사이트입니다.

## 실행

```bash
npm run collect:all
npm run serve
```

브라우저에서 아래 주소로 확인합니다.

```text
http://localhost:8080
```

## 메뉴 구성

| 탭 | 내용 |
|---|---|
| 현황 | 전투력 / 토벌전 현황과 성장률 |
| 공략 | 공략 게시판 작성/조회 |
| 링크 | 디스코드, 메키 단톡방 |
| 쉬어가기 | 게임 1, 게임 2 |

## 공략 게시판 서버 설정

공략 게시판은 Firebase Firestore를 사용합니다. 설정을 넣기 전에는 기존처럼 현재 브라우저에만 임시 저장됩니다.

### 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. 프로젝트 생성
3. `Build → Firestore Database` 선택
4. 데이터베이스 생성
5. 위치는 가까운 리전을 선택
6. 테스트 모드로 시작해도 되고, 아래 Rules를 바로 넣어도 됩니다.

### 2. Web App 추가

1. Firebase 프로젝트 설정으로 이동
2. `General → Your apps → Web app` 추가
3. Firebase config 값을 복사
4. 아래 파일에 붙여넣기

```text
src/firebase-config.js
```

예시:

```js
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  storageBucket: "...appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Firestore Rules 적용

Firebase Console에서:

```text
Firestore Database → Rules
```

아래 파일 내용을 복사해서 붙여넣고 `Publish` 합니다.

```text
firestore.rules
```

> 현재 버전은 길드 내부용 초간단 게시판입니다. 화면에서는 비밀번호 `5645`를 확인하지만, 정적 사이트 특성상 진짜 서버 보안처럼 강한 보호는 아닙니다. 외부 공개 사이트로 운영하면서 관리자 보안이 필요하면 Firebase Authentication 방식으로 바꾸는 것을 권장합니다.

## 공략 작성

공략 탭에서 `공략 작성하기` 버튼을 누른 뒤 비밀번호를 입력합니다.

```text
5645
```

Firebase 설정이 완료된 경우 글은 Firestore에 저장되어 모든 접속자에게 바로 보입니다.
Firebase 설정 전에는 현재 브라우저에만 임시 저장됩니다.

## 수동 입력

현황 화면에서 `수동 입력하기` 또는 `수정하기` 버튼을 누른 뒤 비밀번호를 입력합니다.

```text
5645
```

수정 가능한 항목은 아래와 같습니다.

- 전투력
- 토벌전 점수
- 메모

브라우저에만 임시 적용하려면 `화면에 적용`을 누릅니다.
전체 사용자에게 반영하려면 `manual.json 다운로드` 후 저장소의 아래 파일을 교체해서 커밋합니다.

```text
data/manual.json
```

## 링크

링크 탭에 아래 링크가 포함되어 있습니다.

- 디스코드: https://discord.gg/MkDg5y88
- 메키 단톡방: https://open.kakao.com/o/gfU5LfAi

쉬어가기 탭에는 아래 게임 링크가 포함되어 있습니다.

- 게임 1: https://154d7131.meki-solo.pages.dev/
- 게임 2: https://abba3bda.meki-solo.pages.dev/

## GitHub Pages 배포

1. GitHub 저장소에 프로젝트를 올립니다.
2. `Settings → Pages`에서 `main` 브랜치의 `/root`를 배포 대상으로 설정합니다.
3. `Settings → Actions → General → Workflow permissions`에서 `Read and write permissions`를 선택합니다.
4. `Actions → Collect Guild Data → Run workflow`를 한 번 실행합니다.

## 자동 갱신

GitHub Actions는 매일 KST 00:10에 자동 실행되도록 설정되어 있습니다.
자동 실행 시 아래 파일이 갱신됩니다.

```text
data/latest.json
data/history.json
```


## Firebase 설정 주의

`src/firebase-config.js` 파일에는 `FIREBASE_CONFIG`와 `FIREBASE_COLLECTION` 두 export가 모두 있어야 합니다. Firebase Console에서 복사한 초기화 코드 전체를 붙여넣지 말고 config 값만 `FIREBASE_CONFIG` 객체에 넣으세요.


## 데이터 기준일과 수동 갱신

- `수집 기준`: `data/latest.json`이 생성된 날짜입니다. 수집 스크립트는 한국 시간 기준 날짜를 사용합니다.
- `7일 전 기준`: 현재 수집일 기준 정확히 7일 전 날짜의 `data/history.json` 스냅샷입니다. 예를 들어 `2026-06-23` 수집이면 `2026-06-16` 데이터를 비교합니다.
- 정확히 7일 전 데이터가 없으면 성장률은 표시하지 않고 `7일 전 데이터 없음`으로 표시합니다.
- 화면의 `데이터 수동 갱신` 버튼은 GitHub Actions의 `Collect Guild Data` 화면을 엽니다. GitHub에 로그인한 뒤 `Run workflow`를 누르면 즉시 수집됩니다.

GitHub Actions 실패가 계속되면 `.github/workflows/collect.yml`이 아래처럼 되어 있는지 확인하세요.

```yaml
- name: Collect data
  env:
    GUILD_NAMES: 반짝,풍년순대국밥
    SERVER_ID: "4"
    TOBEOL_MAX_PAGE: "10"
  run: npm run collect:all
```

예전 워크플로우가 `node scripts/collect-mgf.js`를 실행해도 동작하도록 호환 파일도 포함되어 있습니다.

