# 메키 길드 포털

전투력/토벌전 현황, 공략 게시판, 주요 링크, 쉬어가기 게임 링크를 한 화면에서 볼 수 있는 GitHub Pages용 정적 사이트입니다.

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

## 공략 게시판 작성

공략 탭에서 `공략 작성하기` 버튼을 누른 뒤 비밀번호를 입력합니다.

```text
5645
```

작성한 공략은 우선 현재 브라우저에 저장됩니다.
다른 사람에게도 보이게 하려면 `guide-posts.json 다운로드` 후 저장소의 아래 파일을 교체해서 커밋합니다.

```text
data/guide-posts.json
```

> GitHub Pages는 정적 페이지라서 서버 DB가 없습니다. 그래서 게시판은 로컬 저장 + JSON 내보내기 방식으로 구성되어 있습니다.

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
