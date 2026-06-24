# 메키 길드 포털

전투력/토벌전 현황, 캐릭터 모아보기, 버츄얼 광장, 길드 컨텐츠 매칭, 실시간 공략 게시판, 주요 링크, 쉬어가기 게임 링크를 한 화면에서 볼 수 있는 GitHub Pages용 사이트입니다.

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
| 캐릭터 | MGF 캐릭터 이미지와 전투력/토벌전 변화량 카드 |
| 광장 | 캐릭터 선택, 이동, 실시간 채팅, 전투력 기반 공격이 가능한 버츄얼 광장 |
| 길드 컨텐츠 | MGF 대항전 / 수련장 / 보스대전 매칭 현황 |
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

아래 파일 내용을 복사해서 붙여넣고 `Publish` 합니다. 이 Rules에는 공략 게시판(`guidePosts`), 현재/7일 전 기준값 수동 보정(`weeklyOverrides`), 버츄얼 광장(`virtualLobby`) 권한이 들어 있습니다.

```text
firestore.rules
```

> 현재 버전은 길드 내부용 초간단 게시판입니다. 공략 게시판에서는 비밀번호 `5645`를 확인하지만, 정적 사이트 특성상 진짜 서버 보안처럼 강한 보호는 아닙니다. 외부 공개 사이트로 운영하면서 관리자 보안이 필요하면 Firebase Authentication 방식으로 바꾸는 것을 권장합니다.

## 공략 작성

공략 탭에서 `공략 작성하기` 버튼을 누른 뒤 비밀번호를 입력합니다.

```text
5645
```

Firebase 설정이 완료된 경우 글은 Firestore에 저장되어 모든 접속자에게 바로 보입니다.
Firebase 설정 전에는 현재 브라우저에만 임시 저장됩니다.

## 수동 입력

현황 화면에서 `수동 입력하기` 또는 `수정하기` 버튼을 누르면 비밀번호 없이 바로 편집 화면이 열립니다.

수정 가능한 항목은 아래 4개입니다.

- 현재 전투력
- 7일 전 전투력
- 현재 토벌전 점수
- 7일 전 토벌전 점수

값을 저장하면 전투력 성장, 토벌전 성장, 성장률이 다시 계산됩니다. Firebase 설정이 완료된 경우 `서버에 저장` 버튼을 누르면 전체 사용자에게 바로 반영됩니다. 개발자가 별도로 `manual.json`을 내려받거나 커밋할 필요가 없습니다.
Firebase 설정 전에는 현재 브라우저에만 임시 저장됩니다.

## 캐릭터 모아보기

캐릭터 탭에서는 MGF 캐릭터 이미지 URL에 닉네임을 붙여 자동으로 이미지를 불러옵니다. 길드, 닉네임, 직업으로 필터링할 수 있고 전투력, 토벌전 점수, 전투력 변화량, 토벌전 변화량을 카드와 막대 그래프로 확인할 수 있습니다.


## 버츄얼 광장

광장 탭에서는 길드원 캐릭터를 선택해서 작은 월드에 입장할 수 있습니다.

- 광장을 클릭하면 캐릭터가 해당 위치로 이동합니다.
- 방향 버튼 또는 키보드 방향키로도 이동할 수 있습니다.
- `근처 공격` 버튼 또는 스페이스/엔터로 가까운 상대를 공격할 수 있습니다.
- 체력은 실제 현재 전투력과 같고, 피해량도 공격자의 실제 전투력 기반으로 계산됩니다.
- 체력이 0이 되면 광장 오른쪽 아래 감옥에 5초 동안 갇혔다가 자동으로 풀려납니다.
- 입장 후 채팅을 보내면 캐릭터 머리 위 말풍선과 채팅창에 표시됩니다.
- Firebase Firestore Rules를 배포하면 다른 접속자와 위치/채팅/공격/감옥 상태가 실시간으로 공유됩니다.
- Firebase 연결 전에는 이 브라우저에서만 보이는 데모 모드로 동작합니다.


## 길드 컨텐츠

길드 컨텐츠 탭에서는 MGF의 길드 컨텐츠 검색 결과를 한 화면에서 봅니다.

- 순서: 대항전 → 수련장 → 보스대전
- 기본 검색 길드: `반짝`
- 각 탭에서 매칭된 길드 수, 마스터, 서버, 총 전투력, 최정예 멤버 TOP 5를 카드로 표시합니다.
- `MGF에서 열기` 버튼을 누르면 현재 선택한 컨텐츠의 원본 페이지가 새 창으로 열립니다.

최신 길드 컨텐츠 데이터를 갱신하려면 아래 명령을 실행합니다.

```bash
npm run collect:contents
```

다른 길드까지 같이 수집하려면 쉼표로 추가합니다.

```bash
GUILD_CONTENT_NAMES=반짝,풍년순대국밥 node scripts/collect-guild-contents.js
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
data/guild-contents.json
```


## Firebase 설정 주의

`src/firebase-config.js` 파일에는 `FIREBASE_CONFIG`, `FIREBASE_COLLECTION`, `FIREBASE_MANUAL_COLLECTION`, `FIREBASE_LOBBY_COLLECTION` export가 있어야 합니다. 기존 버전 호환을 위해 `FIREBASE_GAME_COLLECTION`이 남아 있어도 괜찮습니다. Firebase Console에서 복사한 초기화 코드 전체를 붙여넣지 말고 config 값만 `FIREBASE_CONFIG` 객체에 넣으세요.


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

