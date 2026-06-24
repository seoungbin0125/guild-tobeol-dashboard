# 메키 길드 포털

현재 버전: **v1.13.0**

## 내 작업 폴더에 덮어쓰기

다운로드한 zip을 풀면 `guild-tobeol-dashboard` 폴더가 나옵니다. 그 폴더 안의 파일들을 아래 폴더에 그대로 덮어쓰면 됩니다.

```bash
/Users/bin/Desktop/work/guild-tobeol-dashboard
```

macOS에서는 압축을 푼 뒤 `APPLY_TO_WORK_FOLDER.command`를 더블클릭해도 됩니다.

직접 명령어로 적용하려면:

```bash
cd ~/Downloads
unzip guild-tobeol-dashboard-v1.13.0.zip
rsync -av --delete guild-tobeol-dashboard/ /Users/bin/Desktop/work/guild-tobeol-dashboard/
```

## 실행

```bash
cd /Users/bin/Desktop/work/guild-tobeol-dashboard
npm run serve
```

브라우저에서 예전 화면이 계속 보이면 강력 새로고침을 해주세요. 이번 버전은 `style.css?v=1.13.0`, `main.js?v=1.13.0`으로 캐시가 덜 남게 처리되어 있습니다.

## 이번 버전 변경점

- 화면 상단과 하단에 `v1.13.0` 표시
- 현황 화면의 복잡한 안내 문구 제거
- 입력 버튼 문구를 `점수 수정`으로 정리
- 광장에서 나가거나 페이지를 닫을 때 내 캐릭터 정리 강화
- 오래 남은 광장 캐릭터는 35초 뒤 자동으로 숨김
- 공격/스킬 알림은 채팅창에 올라가지 않음
