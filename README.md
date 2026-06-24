# 메키 길드 포털

현재 버전: **v1.14.0**

## 적용

압축을 푼 뒤 `APPLY_TO_WORK_FOLDER.command`를 더블클릭하면 아래 폴더로 덮어씁니다.

```bash
/Users/bin/Desktop/work/guild-tobeol-dashboard
```

터미널로 직접 적용하려면:

```bash
cd ~/Downloads
unzip guild-tobeol-dashboard-v1.14.0.zip
rsync -av --delete guild-tobeol-dashboard/ /Users/bin/Desktop/work/guild-tobeol-dashboard/
```

## 실행

```bash
cd /Users/bin/Desktop/work/guild-tobeol-dashboard
npm run serve
```

예전 화면이 보이면 브라우저에서 `Cmd + Shift + R`로 강력 새로고침하세요.

## 수집

전체 수집:

```bash
npm run collect:all-data
```

기프트카드 핫딜만 수집:

```bash
npm run collect:hotdeals
```

더블클릭용 파일도 들어 있습니다.

- `RUN_COLLECT_ALL.command`
- `RUN_HOTDEALS.command`
- `CHECK_VERSION_AND_SOURCE.command`

## 이번 버전 기준

반짝 길드원은 아래 MGF 길드 상세 페이지 기준으로 수집합니다.

```text
https://mgf.gg/contents/guild_info.php?g_name=반짝
```

GitHub Actions에서 `Collect Dashboard Data` 또는 `collect.yml`만 보여도 정상입니다. 이 워크플로우 안에서 MGF 길드원, 길드 컨텐츠, 핫딜을 모두 갱신합니다.
