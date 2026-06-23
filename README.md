# 길드 토벌전 대시보드

GitHub Pages에서 동작하는 길드 전투력/토벌전 대시보드입니다.

기본 조회 길드는 아래 2개입니다.

```text
반짝
풍년순대국밥
```

## 먼저 알아둘 것

| 데이터 | 입력 방식 | 수정 파일 |
|---|---|---|
| 현재 전투력 | 자동 수집 | 직접 수정 불필요 |
| 현재 토벌전 | 자동 수집 | 직접 수정 불필요 |
| 지난주 전투력/토벌전 비교값 | 보통 자동 누적, 첫 시작 때만 수동 입력 가능 | `data/history.json` |

처음 시작하는 날에 지난주 대비 성장률을 바로 보고 싶으면 `data/history.json`에 지난주 스냅샷을 한 번 넣어주면 됩니다. 그 이후부터는 `npm run collect:all`을 실행할 때마다 자동으로 이력이 쌓입니다.

## 구성

```text
guild-tobeol-dashboard/
 ├─ index.html
 ├─ src/
 │   ├─ main.js
 │   └─ style.css
 ├─ data/
 │   ├─ latest.json          # 화면에서 읽는 최신 데이터
 │   ├─ history.json         # 전투력/토벌전 지난주 비교용 이력
 │   └─ history.example.json # 지난주 수동 입력 예시
 ├─ scripts/
 │   ├─ collect-data.js      # 자동 수집 스크립트
 │   └─ serve.js             # 로컬 미리보기 서버
 └─ .github/workflows/
     └─ collect.yml          # GitHub Actions 자동 수집
```

## 1. 로컬에서 2개 길드 수집 실행

Node.js 20 이상 기준입니다.

```bash
npm run collect:all
```

실행 후 아래 파일이 갱신됩니다.

```text
data/latest.json
data/history.json
```

## 2. 지난주 데이터 수동 입력 위치

지난주 대비 성장률은 `data/history.json`의 이전 날짜 스냅샷과 비교합니다.

이미 지난주에 `npm run collect:all`을 실행했다면 별도로 입력할 필요가 없습니다.

처음 시작해서 지난주 수집 이력이 없다면 `data/history.json`을 아래 형태로 입력합니다.

```json
[
  {
    "date": "2026-06-16",
    "guild": "반짝",
    "members": [
      {
        "nickname": "닉네임",
        "rank": 1,
        "job": "직업명",
        "level": 285,
        "powerValue": 1234567890000,
        "tobeolValue": 987654321000
      }
    ]
  },
  {
    "date": "2026-06-16",
    "guild": "풍년순대국밥",
    "members": [
      {
        "nickname": "닉네임2",
        "rank": 1,
        "job": "직업명",
        "level": 280,
        "powerValue": 1111111110000,
        "tobeolValue": 222222222000
      }
    ]
  }
]
```

주의할 점은 `powerValue`, `tobeolValue`는 `1조 2345억` 같은 문자열이 아니라 숫자로 넣어야 합니다.

예를 들어 `1조`는 아래처럼 입력합니다.

```json
{
  "powerValue": 1000000000000
}
```

## 3. 길드 직접 지정

다른 길드까지 같이 보고 싶으면 `GUILD_NAMES`에 콤마로 추가하면 됩니다.

```bash
GUILD_NAMES=반짝,풍년순대국밥,추가길드 SERVER_ID=4 node scripts/collect-data.js
```

한 개 길드만 수집할 수도 있습니다.

```bash
npm run collect:banjjak
npm run collect:sundae
```

## 4. 로컬 미리보기

정적 파일이라 아무 웹서버나 쓰면 됩니다.

```bash
npm run serve
```

브라우저에서 접속합니다.

```text
http://localhost:8080
```

화면 상단의 길드 필터에서 `전체`, `반짝`, `풍년순대국밥`을 선택할 수 있습니다.

## 5. GitHub Pages 배포

1. 이 프로젝트를 GitHub 저장소에 업로드합니다.
2. Repository Settings → Pages 메뉴로 이동합니다.
3. Source를 `Deploy from a branch`로 설정합니다.
4. Branch는 `main`, folder는 `/root`로 설정합니다.

## 6. 자동 갱신

`.github/workflows/collect.yml`이 매일 자동으로 실행됩니다.

수동 실행도 가능합니다.

```text
GitHub → Actions → Collect Guild Data → Run workflow
```

## 참고

수집 대상 페이지 구조가 변경되면 `scripts/collect-data.js`의 파싱 정규식을 수정해야 합니다.
