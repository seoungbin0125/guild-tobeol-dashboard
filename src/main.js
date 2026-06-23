import { FIREBASE_COLLECTION, FIREBASE_CONFIG, FIREBASE_MANUAL_COLLECTION } from "./firebase-config.js";
import { createGuideBoardClient, createManualOverrideClient, isFirebaseConfigured } from "./firebase-board.js";

const EDIT_PASSWORD = "5645";
const LOCAL_MANUAL_KEY = "guild-tobeol-dashboard.manual.v1";
const LOCAL_POSTS_KEY = "guild-tobeol-dashboard.guide-posts.v1";

const state = {
  rawData: null,
  data: null,
  manualFromFile: null,
  localManual: null,
  serverManual: null,
  manualClient: null,
  manualLoaded: false,
  postsFromFile: null,
  localPosts: null,
  posts: [],
  firebasePosts: [],
  firebaseBoard: null,
  boardMode: isFirebaseConfigured(FIREBASE_CONFIG) ? "firebase" : "local",
  boardLoaded: false,
  page: "dashboard",
  tab: "power",
  guildFilter: "all",
  keyword: "",
  sort: "powerGrowth",
  editorUnlocked: false
};

const refs = {
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  summaryGrid: document.getElementById("summary-grid"),
  mainTabs: document.querySelectorAll(".main-tab"),
  pages: document.querySelectorAll(".content-page"),
  tabs: document.querySelectorAll(".tab"),
  guildFilter: document.getElementById("guild-filter"),
  keyword: document.getElementById("keyword"),
  sort: document.getElementById("sort"),
  panelTitle: document.getElementById("panel-title"),
  panelDesc: document.getElementById("panel-desc"),
  tableHead: document.getElementById("table-head"),
  tableBody: document.getElementById("table-body"),
  footerText: document.getElementById("footer-text"),
  editDialog: document.getElementById("edit-dialog"),
  openEditor: document.getElementById("open-editor"),
  openEditorGuide: document.getElementById("open-editor-guide"),
  openActionsRefresh: document.getElementById("open-actions-refresh"),
  closeEditor: document.getElementById("close-editor"),
  passwordView: document.getElementById("password-view"),
  editorView: document.getElementById("editor-view"),
  editorPassword: document.getElementById("editor-password"),
  unlockEditor: document.getElementById("unlock-editor"),
  passwordMessage: document.getElementById("password-message"),
  editorBody: document.getElementById("editor-body"),
  applyManual: document.getElementById("apply-manual"),
  downloadManual: document.getElementById("download-manual"),
  clearManual: document.getElementById("clear-manual"),
  editorMessage: document.getElementById("editor-message"),
  openPostEditor: document.getElementById("open-post-editor"),
  postDialog: document.getElementById("post-dialog"),
  closePostEditor: document.getElementById("close-post-editor"),
  postPassword: document.getElementById("post-password"),
  postAuthor: document.getElementById("post-author"),
  postCategory: document.getElementById("post-category"),
  postTitle: document.getElementById("post-title"),
  postContent: document.getElementById("post-content"),
  savePost: document.getElementById("save-post"),
  resetPostForm: document.getElementById("reset-post-form"),
  postMessage: document.getElementById("post-message"),
  postList: document.getElementById("post-list"),
  downloadPosts: document.getElementById("download-posts"),
  importPosts: document.getElementById("import-posts"),
  clearLocalPosts: document.getElementById("clear-local-posts"),
  boardStatus: document.getElementById("board-status"),
  firebaseSetupNotice: document.getElementById("firebase-setup-notice")
};

init();

async function init() {
  bindEvents();

  try {
    const [latest, manual, posts] = await Promise.all([
      fetchJson("data/latest.json", true),
      fetchJson("data/manual.json", false),
      fetchJson("data/guide-posts.json", false)
    ]);

    state.rawData = latest;
    state.manualFromFile = manual;
    state.localManual = readLocalManual();
    state.postsFromFile = normalizePosts(posts);
    state.localPosts = readLocalPosts();
    initFirebaseBoard();
    initManualClient();
    rebuildPosts();
    rebuildData();
    initGuildFilter();
    renderPage();
  } catch (error) {
    refs.tableBody.innerHTML = `<tr><td colspan="99" class="empty">${escapeHtml(error.message)}</td></tr>`;
    refs.footerText.textContent = "data/latest.json 파일을 확인해주세요.";
  }
}

async function fetchJson(path, required) {
  const response = await fetch(`${path}?ts=${Date.now()}`);
  if (!response.ok) {
    if (!required && response.status === 404) return null;
    throw new Error(`${path} 로딩 실패: ${response.status}`);
  }
  return response.json();
}

function bindEvents() {
  refs.mainTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.page = tab.dataset.page;
      refs.mainTabs.forEach((item) => item.classList.toggle("active", item === tab));
      renderPage();
    });
  });

  refs.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      refs.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      syncSortByTab();
      render();
    });
  });

  refs.guildFilter.addEventListener("change", (event) => {
    state.guildFilter = event.target.value;
    render();
  });

  refs.keyword.addEventListener("input", (event) => {
    state.keyword = event.target.value.trim();
    renderTable();
  });

  refs.sort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderTable();
  });

  refs.openEditor?.addEventListener("click", openEditor);
  refs.openEditorGuide?.addEventListener("click", openEditor);
  refs.closeEditor?.addEventListener("click", closeEditor);
  refs.unlockEditor?.addEventListener("click", unlockEditor);
  refs.editorPassword?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      unlockEditor();
    }
  });
  refs.applyManual?.addEventListener("click", applyManualFromEditor);
  refs.clearManual?.addEventListener("click", clearLocalManual);
  refs.openPostEditor?.addEventListener("click", openPostEditor);
  refs.closePostEditor?.addEventListener("click", closePostEditor);
  refs.savePost?.addEventListener("click", savePostFromForm);
  refs.resetPostForm?.addEventListener("click", resetPostForm);
  refs.downloadPosts?.addEventListener("click", downloadPosts);
  refs.importPosts?.addEventListener("change", importPostsFromFile);
  refs.clearLocalPosts?.addEventListener("click", clearLocalPosts);
  refs.postList?.addEventListener("click", handlePostListClick);
}

function renderPage() {
  refs.pages.forEach((page) => {
    page.classList.toggle("active", page.id === `page-${state.page}`);
  });

  if (state.page === "dashboard") {
    render();
    return;
  }

  if (state.page === "guide") {
    refs.title.textContent = "공략 게시판";
    refs.subtitle.textContent = "길드 공략을 작성하고 공유하는 공간";
    renderPosts();
    refs.footerText.textContent = state.boardMode === "firebase" ? "공략글은 실시간 게시판 서버에 저장됩니다." : "Firebase 설정 전이라 이 브라우저에만 임시 저장됩니다.";
    return;
  }

  if (state.page === "links") {
    refs.title.textContent = "길드 링크";
    refs.subtitle.textContent = "디스코드와 메키 단톡방 바로가기";
    refs.footerText.textContent = "외부 링크는 새 창으로 열립니다.";
    return;
  }

  if (state.page === "rest") {
    refs.title.textContent = "쉬어가기";
    refs.subtitle.textContent = "게임 1 · 게임 2";
    refs.footerText.textContent = "잠깐 쉬었다 가도 됩니다. 이게 진짜 효율 사냥일지도.";
  }
}

function rebuildData() {
  const cloned = deepClone(state.rawData || {});
  const effectiveManual = mergeManualObjects([
    state.manualFromFile,
    state.localManual,
    state.serverManual
  ], cloned.capturedDate);

  applyManualOverrides(cloned, effectiveManual);
  cloned.summary = buildSummary(cloned.members || []);
  cloned.guildSummaries = Object.fromEntries(
    getGuildsFromData(cloned).map((guild) => [
      guild,
      buildSummary((cloned.members || []).filter((member) => member.guild === guild))
    ])
  );
  cloned.manualAppliedCount = effectiveManual.items.length;

  state.data = cloned;
}

function initGuildFilter() {
  const guilds = getGuilds();
  refs.guildFilter.innerHTML = [
    `<option value="all">전체</option>`,
    ...guilds.map((guild) => `<option value="${escapeAttr(guild)}">${escapeHtml(guild)}</option>`)
  ].join("");
  refs.guildFilter.value = state.guildFilter;
}

function getGuilds() {
  return getGuildsFromData(state.data);
}

function getGuildsFromData(data) {
  const declared = Array.isArray(data?.guilds) ? data.guilds : [];
  const fromMembers = [...new Set((data?.members || []).map((member) => member.guild).filter(Boolean))];
  return [...new Set([...declared, ...fromMembers])];
}

function syncSortByTab() {
  if (state.tab === "power") state.sort = "powerGrowth";
  if (state.tab === "tobeol") state.sort = "tobeolGrowth";
  refs.sort.value = state.sort;
}

function render() {
  const data = state.data;
  const guilds = getGuilds();
  const selectedGuildText = state.guildFilter === "all" ? guilds.join(" · ") : state.guildFilter;

  refs.title.textContent = `${selectedGuildText || "길드"} 성장률 대시보드`;
  refs.subtitle.textContent = `전투력 · 토벌전 현황 · ${data.capturedDate || "-"} 수집 / 7일 전 비교`;

  renderSummary();
  renderTable();

  if (state.page !== "dashboard") return;

  const manualText = data.manualAppliedCount > 0 ? ` · 수동 보정 ${data.manualAppliedCount}건 포함` : "";
  const comparisonText = getComparisonDateText(data, state.guildFilter);
  refs.footerText.textContent = `${selectedGuildText || "-"} 길드 내부 참고용 · 현재 ${data.capturedDate || "-"} 수집 · 7일 전 비교 ${comparisonText}${manualText}`;
}

function getComparisonDateText(data, guildFilter) {
  if (!data) return "-";
  const comparisonDates = data.comparisonDates || {};

  if (guildFilter && guildFilter !== "all") {
    return comparisonDates[guildFilter] || `${data.comparisonTargetDate || "7일 전"} 데이터 없음`;
  }

  if (data.comparisonDateText) return data.comparisonDateText;

  const dates = [...new Set(Object.values(comparisonDates).filter(Boolean))];
  if (dates.length === 0) return `${data.comparisonTargetDate || "7일 전"} 데이터 없음`;
  if (dates.length === 1) return dates[0];
  return dates.join(" · ");
}

function openActionsRefresh() {
  const url = getActionsWorkflowUrl();
  window.open(url, "_blank", "noopener,noreferrer");
}

function getActionsWorkflowUrl() {
  const host = window.location.hostname || "";
  const firstPath = window.location.pathname.split("/").filter(Boolean)[0];

  if (host.endsWith(".github.io") && firstPath) {
    const owner = host.replace(".github.io", "");
    return `https://github.com/${owner}/${firstPath}/actions/workflows/collect.yml`;
  }

  return "https://github.com/koiware2012/guild-tobeol-dashboard/actions/workflows/collect.yml";
}

function renderSummary() {
  const members = getGuildFilteredMembers();
  const summary = buildSummary(members);
  const cards = [
    ["수집 기준", state.data?.capturedDate || "-"],
    ["7일 전 기준", getComparisonDateText(state.data, state.guildFilter)],
    ["길드원", `${summary.memberCount || 0}명`],
    ["총 전투력", formatKoreanPower(summary.totalPowerValue || 0)],
    ["총 토벌전", formatKoreanPower(summary.totalTobeolValue || 0)]
  ];

  refs.summaryGrid.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </article>
  `).join("");
}

function renderTable() {
  const members = getFilteredMembers();
  const table = getTableSpec(state.tab);

  refs.panelTitle.textContent = table.title;
  refs.panelDesc.textContent = table.desc;
  refs.tableHead.innerHTML = `<tr>${table.columns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;

  if (members.length === 0) {
    refs.tableBody.innerHTML = `<tr><td colspan="${table.columns.length}" class="empty">표시할 데이터가 없습니다.</td></tr>`;
    return;
  }

  refs.tableBody.innerHTML = members.map((member, index) => `
    <tr class="${member.isManual ? "manual-row" : ""}">
      ${table.columns.map((column) => `<td>${column.render(member, index)}</td>`).join("")}
    </tr>
  `).join("");
}

function getGuildFilteredMembers() {
  return [...(state.data?.members || [])]
    .filter((member) => state.guildFilter === "all" || member.guild === state.guildFilter);
}

function getFilteredMembers() {
  const keyword = state.keyword.toLowerCase();
  return getGuildFilteredMembers()
    .filter((member) => {
      if (!keyword) return true;
      return `${member.guild} ${member.nickname} ${member.job}`.toLowerCase().includes(keyword);
    })
    .sort((a, b) => getSortValue(b, state.sort) - getSortValue(a, state.sort));
}

function getSortValue(member, sort) {
  switch (sort) {
    case "powerGrowth": return Number(member.powerGrowthValue ?? -Infinity);
    case "power": return Number(member.powerValue || 0);
    case "tobeolGrowth": return Number(member.tobeolGrowthValue ?? -Infinity);
    case "tobeol": return Number(member.tobeolValue || 0);
    case "level": return Number(member.level || 0);
    case "rank": return -Number(member.rank || 0);
    default: return 0;
  }
}

function getTableSpec(tab) {
  if (tab === "tobeol") {
    return {
      title: "토벌전 점수 성장",
      desc: "길드원 닉네임 기준으로 매칭한 토벌전 점수입니다.",
      columns: [
        col("#", (_, index) => `<span class="badge">${index + 1}</span>`),
        col("길드", renderGuild),
        col("닉네임", renderName),
        col("레벨", (member) => `Lv.${member.level}`),
        col("현재 점수", (member) => formatKoreanPower(member.tobeolValue)),
        col("7일 전 점수", (member) => member.previousTobeolText || "-"),
        col("성장", (member) => renderGrowth(member.tobeolGrowthValue, member.tobeolGrowthText)),
        col("성장률", (member) => renderRate(member.tobeolGrowthRate))
      ]
    };
  }

  return {
    title: "전투력 성장",
    desc: "길드원 전투력 수집 데이터 기준입니다.",
    columns: [
      col("#", (_, index) => `<span class="badge">${index + 1}</span>`),
      col("길드", renderGuild),
      col("길드순위", (member) => `<span class="badge">${member.rank}</span>`),
      col("닉네임", renderName),
      col("레벨", (member) => `Lv.${member.level}`),
      col("현재 전투력", (member) => formatKoreanPower(member.powerValue)),
      col("7일 전 전투력", (member) => member.previousPowerText || "-"),
      col("성장", (member) => renderGrowth(member.powerGrowthValue, member.powerGrowthText)),
      col("성장률", (member) => renderRate(member.powerGrowthRate))
    ]
  };
}

function col(label, render) {
  return { label, render };
}

function renderGuild(member) {
  return `<span class="guild-pill">${escapeHtml(member.guild || "-")}</span>`;
}

function renderName(member) {
  const manualBadge = member.isManual ? `<span class="manual-badge">수동</span>` : "";
  return `
    <div class="nickname">${escapeHtml(member.nickname)} ${manualBadge}</div>
    <div class="muted">${escapeHtml(member.job || "-")}</div>
  `;
}

function renderGrowth(value, text) {
  if (value == null) return `<span class="muted">비교 데이터 없음</span>`;
  if (Number(value) > 0) return `<span class="good">${escapeHtml(text)}</span>`;
  if (Number(value) < 0) return `<span class="bad">${escapeHtml(text)}</span>`;
  return `<span class="muted">0</span>`;
}

function renderRate(value) {
  if (value == null) return `<span class="muted">-</span>`;
  const className = Number(value) >= 0 ? "good" : "bad";
  return `<span class="${className}">${numberFormat(value)}%</span>`;
}

function openEditor() {
  if (!state.rawData) return;
  refs.editDialog.showModal();
  refs.passwordMessage.textContent = "";
  refs.editorMessage.textContent = "";

  if (state.editorUnlocked) {
    showEditorView();
  } else {
    refs.passwordView.classList.remove("hidden");
    refs.editorView.classList.add("hidden");
    refs.editorPassword.value = "";
    setTimeout(() => refs.editorPassword.focus(), 0);
  }
}

function closeEditor() {
  refs.editDialog.close();
}

function unlockEditor() {
  if (refs.editorPassword.value !== EDIT_PASSWORD) {
    refs.passwordMessage.textContent = "비밀번호가 맞지 않습니다.";
    refs.editorPassword.select();
    return;
  }

  state.editorUnlocked = true;
  showEditorView();
}

function showEditorView() {
  refs.passwordView.classList.add("hidden");
  refs.editorView.classList.remove("hidden");
  renderEditorRows();
}

function renderEditorRows() {
  const baseMembers = state.rawData?.members || [];
  const manual = mergeManualObjects([
    state.manualFromFile,
    state.localManual,
    state.serverManual
  ], state.rawData?.capturedDate);
  const manualMap = new Map(manual.items.map((item) => [manualKey(item), item]));

  refs.editorBody.innerHTML = baseMembers.map((member, index) => {
    const override = manualMap.get(manualKey(member)) || {};
    const previousPowerValue = valueFromManual(override, "previousPower", member.previousPowerValue);
    const previousTobeolValue = valueFromManual(override, "previousTobeol", member.previousTobeolValue);

    return `
      <tr data-index="${index}">
        <td>${escapeHtml(member.guild || "-")}</td>
        <td>
          <strong>${escapeHtml(member.nickname)}</strong>
          <div class="muted">${escapeHtml(member.job || "-")} · Lv.${member.level || "-"}</div>
        </td>
        <td>
          <div class="readonly-value">${escapeHtml(formatKoreanPower(member.powerValue))}</div>
        </td>
        <td>
          <input data-field="previousPowerText" value="${escapeAttr(formatEditablePower(previousPowerValue))}" placeholder="예: 1조 2345억" />
        </td>
        <td>
          <div class="readonly-value">${escapeHtml(formatKoreanPower(member.tobeolValue))}</div>
        </td>
        <td>
          <input data-field="previousTobeolText" value="${escapeAttr(formatEditablePower(previousTobeolValue))}" placeholder="예: 987억" />
        </td>
        <td>
          <input data-field="memo" value="${escapeAttr(override.memo || "")}" placeholder="선택" />
        </td>
      </tr>
    `;
  }).join("");
}

function collectManualFromEditor() {
  const date = state.rawData?.capturedDate || todayString();
  const comparisonTargetDate = state.rawData?.comparisonTargetDate || "";
  const rows = [...refs.editorBody.querySelectorAll("tr")];
  const baseMembers = state.rawData?.members || [];
  const items = [];

  for (const row of rows) {
    const index = Number(row.dataset.index);
    const member = baseMembers[index];
    if (!member) continue;

    const previousPowerText = row.querySelector('[data-field="previousPowerText"]')?.value.trim() || "";
    const previousTobeolText = row.querySelector('[data-field="previousTobeolText"]')?.value.trim() || "";
    const memo = row.querySelector('[data-field="memo"]')?.value.trim() || "";
    const previousPowerValue = parseEditablePowerValue(previousPowerText);
    const previousTobeolValue = parseEditablePowerValue(previousTobeolText);

    const basePreviousPower = nullableNumber(member.previousPowerValue);
    const basePreviousTobeol = nullableNumber(member.previousTobeolValue);
    const powerChanged = !sameNullableNumber(previousPowerValue, basePreviousPower);
    const tobeolChanged = !sameNullableNumber(previousTobeolValue, basePreviousTobeol);

    if (!powerChanged && !tobeolChanged && !memo) continue;

    const item = {
      guild: member.guild,
      nickname: member.nickname
    };

    if (powerChanged) {
      item.previousPowerText = previousPowerText;
      item.previousPowerValue = previousPowerValue;
    }

    if (tobeolChanged) {
      item.previousTobeolText = previousTobeolText;
      item.previousTobeolValue = previousTobeolValue;
    }

    if (memo) item.memo = memo;
    items.push(item);
  }

  return { date, comparisonTargetDate, items };
}

async function applyManualFromEditor() {
  const manual = collectManualFromEditor();
  refs.applyManual.disabled = true;
  refs.editorMessage.textContent = state.manualClient?.enabled
    ? "서버에 수동 기준값을 저장 중입니다..."
    : "Firebase 설정 전이라 이 브라우저에 저장 중입니다...";

  try {
    if (state.manualClient?.enabled) {
      await state.manualClient.saveManual(manual);
      state.serverManual = manual;
      refs.editorMessage.textContent = `수동 기준값 ${manual.items.length}건을 서버에 저장했습니다. 새로고침 후에도 전체 사용자에게 동일하게 반영됩니다.`;
    } else {
      state.localManual = manual;
      localStorage.setItem(LOCAL_MANUAL_KEY, JSON.stringify(manual));
      refs.editorMessage.textContent = `수동 기준값 ${manual.items.length}건을 이 브라우저에 저장했습니다. Firebase 설정을 완료하면 전체 사용자에게 반영됩니다.`;
    }

    rebuildData();
    initGuildFilter();
    render();
  } catch (error) {
    refs.editorMessage.textContent = `저장 실패: ${error.message}`;
  } finally {
    refs.applyManual.disabled = false;
  }
}

async function clearLocalManual() {
  const emptyManual = {
    date: state.rawData?.capturedDate || todayString(),
    comparisonTargetDate: state.rawData?.comparisonTargetDate || "",
    items: []
  };

  if (!confirm("저장된 수동 기준값을 초기화할까요?")) return;

  refs.clearManual.disabled = true;
  try {
    if (state.manualClient?.enabled) {
      await state.manualClient.saveManual(emptyManual);
      state.serverManual = emptyManual;
      refs.editorMessage.textContent = "서버에 저장된 수동 기준값을 초기화했습니다.";
    } else {
      localStorage.removeItem(LOCAL_MANUAL_KEY);
      state.localManual = null;
      refs.editorMessage.textContent = "이 브라우저에 저장된 수동 기준값을 초기화했습니다.";
    }

    rebuildData();
    render();
    renderEditorRows();
  } catch (error) {
    refs.editorMessage.textContent = `초기화 실패: ${error.message}`;
  } finally {
    refs.clearManual.disabled = false;
  }
}



function initFirebaseBoard() {
  state.firebaseBoard = createGuideBoardClient({
    config: FIREBASE_CONFIG,
    collectionName: FIREBASE_COLLECTION,
    onPosts: (posts) => {
      state.firebasePosts = posts;
      state.boardLoaded = true;
      rebuildPosts();
      if (state.page === "guide") renderPosts();
    },
    onError: (error) => {
      console.error(error);
      state.boardLoaded = true;
      syncBoardUi("error", `게시판 연결 실패: ${error.message}`);
      if (state.page === "guide") renderPosts();
    },
    onStatus: syncBoardUi
  });

  if (!state.firebaseBoard.enabled) {
    state.boardMode = "local";
    state.boardLoaded = true;
  }
}

function initManualClient() {
  const capturedDate = state.rawData?.capturedDate || todayString();
  const documentId = `weekly-${capturedDate}`;

  state.manualClient = createManualOverrideClient({
    config: FIREBASE_CONFIG,
    collectionName: FIREBASE_MANUAL_COLLECTION,
    documentId,
    onManual: (manual) => {
      state.serverManual = manual;
      state.manualLoaded = true;
      rebuildData();
      if (state.page === "dashboard") {
        render();
        if (state.editorUnlocked && refs.editDialog.open) renderEditorRows();
      }
    },
    onError: (error) => {
      console.error(error);
      state.manualLoaded = true;
    }
  });

  if (!state.manualClient.enabled) {
    state.manualLoaded = true;
  }
}


function syncBoardUi(status, message) {
  if (refs.boardStatus) {
    const mode = state.firebaseBoard?.enabled ? "online" : "local";
    refs.boardStatus.className = `board-status ${status || mode}`;
    refs.boardStatus.textContent = message || (mode === "online" ? "실시간 게시판 연결됨" : "Firebase 설정 전: 브라우저 임시 저장 모드");
  }

  if (refs.firebaseSetupNotice) {
    refs.firebaseSetupNotice.hidden = Boolean(state.firebaseBoard?.enabled);
  }

  if (refs.importPosts) {
    refs.importPosts.closest("label")?.classList.toggle("hidden", Boolean(state.firebaseBoard?.enabled));
  }

  if (refs.clearLocalPosts) {
    refs.clearLocalPosts.textContent = state.firebaseBoard?.enabled ? "서버 게시글은 삭제 버튼으로 관리" : "내 임시글 초기화";
    refs.clearLocalPosts.disabled = Boolean(state.firebaseBoard?.enabled);
  }
}

function openPostEditor() {
  refs.postDialog.showModal();
  refs.postMessage.textContent = "";
  setTimeout(() => refs.postPassword.focus(), 0);
}

function closePostEditor() {
  refs.postDialog.close();
}

async function savePostFromForm() {
  if (refs.postPassword.value !== EDIT_PASSWORD) {
    refs.postMessage.textContent = "비밀번호가 맞지 않습니다.";
    refs.postPassword.select();
    return;
  }

  const title = refs.postTitle.value.trim();
  const content = refs.postContent.value.trim();
  const author = refs.postAuthor.value.trim() || "익명";
  const category = refs.postCategory.value || "기타";

  if (!title || !content) {
    refs.postMessage.textContent = "제목과 내용을 입력해주세요.";
    return;
  }

  const post = {
    id: `post-${Date.now()}`,
    title,
    content,
    author,
    category,
    createdAt: new Date().toISOString()
  };

  refs.savePost.disabled = true;
  refs.postMessage.textContent = state.boardMode === "firebase" ? "게시판 서버에 저장 중입니다..." : "브라우저에 임시 저장 중입니다...";

  try {
    if (state.firebaseBoard?.enabled) {
      await state.firebaseBoard.addPost(post);
      refs.postMessage.textContent = "공략글을 게시판 서버에 저장했습니다.";
    } else {
      const localPosts = normalizePosts(state.localPosts);
      state.localPosts = [post, ...localPosts];
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify({ posts: state.localPosts }));
      rebuildPosts();
      renderPosts();
      refs.postMessage.textContent = "Firebase 설정 전이라 이 브라우저에만 임시 저장했습니다.";
    }
    resetPostForm(false);
  } catch (error) {
    refs.postMessage.textContent = `저장 실패: ${error.message}`;
  } finally {
    refs.savePost.disabled = false;
  }
}

function resetPostForm(clearMessage = true) {
  refs.postPassword.value = "";
  refs.postTitle.value = "";
  refs.postContent.value = "";
  refs.postAuthor.value = "";
  refs.postCategory.value = "토벌전";
  if (clearMessage) refs.postMessage.textContent = "";
}

function rebuildPosts() {
  const byId = new Map();
  const sources = state.firebaseBoard?.enabled
    ? normalizePosts(state.firebasePosts)
    : [...normalizePosts(state.postsFromFile), ...normalizePosts(state.localPosts)];

  for (const post of sources) {
    if (!post.title || !post.content) continue;
    const id = post.id || `${post.title}-${post.createdAt || ""}`;
    byId.set(id, { ...post, id });
  }

  state.posts = [...byId.values()].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  syncBoardUi();
}

function renderPosts() {
  if (!refs.postList) return;

  if (state.firebaseBoard?.enabled && !state.boardLoaded) {
    refs.postList.innerHTML = `
      <div class="empty board-empty">
        게시판 서버에서 공략글을 불러오는 중입니다...
      </div>
    `;
    return;
  }

  if (!state.posts.length) {
    refs.postList.innerHTML = `
      <div class="empty board-empty">
        아직 등록된 공략이 없습니다.<br />
        <strong>공략 작성하기</strong> 버튼으로 첫 글을 작성해보세요.
      </div>
    `;
    return;
  }

  refs.postList.innerHTML = state.posts.map((post) => `
    <article class="post-card">
      <div class="post-meta">
        <span class="guild-pill">${escapeHtml(post.category || "기타")}</span>
        <span>${escapeHtml(post.author || "익명")}</span>
        <span>${formatPostDate(post.createdAt)}</span>
        ${post.source === "firebase" ? `<span class="server-badge">실시간</span>` : `<span class="server-badge local">임시</span>`}
      </div>
      <div class="post-title-row">
        <h3>${escapeHtml(post.title)}</h3>
        <button class="text-danger-btn" data-delete-post-id="${escapeAttr(post.id)}" type="button">삭제</button>
      </div>
      <p>${escapeHtml(post.content).replace(/\n/g, "<br />")}</p>
    </article>
  `).join("");
}

function downloadPosts() {
  const value = {
    updatedAt: new Date().toISOString(),
    posts: state.posts
  };
  downloadJson("guide-posts.json", value);
}

async function importPostsFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    state.localPosts = normalizePosts(JSON.parse(text));
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify({ posts: state.localPosts }));
    rebuildPosts();
    renderPosts();
  } catch (error) {
    alert(`guide-posts.json 불러오기 실패: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function clearLocalPosts() {
  if (state.firebaseBoard?.enabled) return;
  if (!confirm("이 브라우저에 저장된 공략 임시글을 초기화할까요?")) return;
  localStorage.removeItem(LOCAL_POSTS_KEY);
  state.localPosts = null;
  rebuildPosts();
  renderPosts();
}


async function handlePostListClick(event) {
  const button = event.target.closest("[data-delete-post-id]");
  if (!button) return;

  const id = button.dataset.deletePostId;
  const password = prompt("삭제 비밀번호를 입력하세요.");
  if (password !== EDIT_PASSWORD) {
    alert("비밀번호가 맞지 않습니다.");
    return;
  }

  if (!confirm("이 공략글을 삭제할까요?")) return;

  try {
    button.disabled = true;
    if (state.firebaseBoard?.enabled) {
      await state.firebaseBoard.deletePost(id);
    } else {
      state.localPosts = normalizePosts(state.localPosts).filter((post) => post.id !== id);
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify({ posts: state.localPosts }));
      rebuildPosts();
      renderPosts();
    }
  } catch (error) {
    alert(`삭제 실패: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

function readLocalPosts() {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    return raw ? normalizePosts(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function normalizePosts(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.posts)) return value.posts;
  return [];
}

function formatPostDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function readLocalManual() {
  try {
    const raw = localStorage.getItem(LOCAL_MANUAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeManualObjects(manualObjects, capturedDate) {
  const map = new Map();

  for (const manual of manualObjects) {
    if (!manual || !Array.isArray(manual.items)) continue;
    if (manual.date && capturedDate && manual.date !== capturedDate) continue;

    for (const item of manual.items) {
      if (!item?.guild || !item?.nickname) continue;
      map.set(manualKey(item), {
        ...(map.get(manualKey(item)) || {}),
        ...item
      });
    }
  }

  return {
    date: capturedDate || "",
    items: [...map.values()]
  };
}

function applyManualOverrides(data, manual) {
  if (!Array.isArray(data.members) || !manual?.items?.length) return;

  const manualMap = new Map(manual.items.map((item) => [manualKey(item), item]));

  data.members = data.members.map((member) => {
    const override = manualMap.get(manualKey(member));
    if (!override) return member;

    const hasPreviousPower = override.previousPowerValue != null || override.previousPowerText;
    const hasPreviousTobeol = override.previousTobeolValue != null || override.previousTobeolText;
    const next = {
      ...member,
      isManual: Boolean(hasPreviousPower || hasPreviousTobeol || override.memo),
      manualMemo: override.memo || ""
    };

    // 현재 전투력/현재 토벌전은 자동 수집값이므로 수동 보정하지 않습니다.
    // 수동 입력은 7일 전 기준값에만 적용합니다.
    if (hasPreviousPower) {
      next.previousPowerValue = valueFromManual(override, "previousPower", next.previousPowerValue);
      next.previousPowerText = next.previousPowerValue == null ? "" : formatKoreanPower(next.previousPowerValue);
      next.powerGrowthValue = next.previousPowerValue == null ? null : Number(next.powerValue || 0) - Number(next.previousPowerValue || 0);
      next.powerGrowthText = next.powerGrowthValue == null ? null : formatSignedKoreanPower(next.powerGrowthValue);
      next.powerGrowthRate = calcGrowthRate(next.powerValue, next.previousPowerValue);
    }

    if (hasPreviousTobeol) {
      next.previousTobeolValue = valueFromManual(override, "previousTobeol", next.previousTobeolValue);
      next.previousTobeolText = next.previousTobeolValue == null ? "" : formatKoreanPower(next.previousTobeolValue);
      next.tobeolGrowthValue = next.previousTobeolValue == null ? null : Number(next.tobeolValue || 0) - Number(next.previousTobeolValue || 0);
      next.tobeolGrowthText = next.tobeolGrowthValue == null ? null : formatSignedKoreanPower(next.tobeolGrowthValue);
      next.tobeolGrowthRate = calcGrowthRate(next.tobeolValue, next.previousTobeolValue);
    }

    return next;
  });
}


function valueFromManual(item, prefix, fallback) {
  const valueKey = `${prefix}Value`;
  const textKey = `${prefix}Text`;

  if (item[valueKey] !== undefined && item[valueKey] !== "") {
    return item[valueKey] == null ? null : Number(item[valueKey] || 0);
  }

  if (item[textKey] !== undefined) {
    const text = String(item[textKey] || "").trim();
    return text ? parseKoreanPowerValue(text) : null;
  }

  return fallback == null ? null : Number(fallback || 0);
}

function parseEditablePowerValue(text) {
  const source = String(text || "").trim();
  if (!source) return null;
  return parseKoreanPowerValue(source);
}

function formatEditablePower(value) {
  return value == null ? "" : formatKoreanPower(value);
}

function nullableNumber(value) {
  return value == null ? null : Number(value || 0);
}

function sameNullableNumber(a, b) {
  if (a == null && b == null) return true;
  return Number(a || 0) === Number(b || 0);
}


function manualKey(item) {
  return `${String(item.guild || "").trim()}::${String(item.nickname || "").trim()}`;
}

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildSummary(members) {
  return {
    guildCount: new Set(members.map((member) => member.guild).filter(Boolean)).size,
    memberCount: members.length,
    totalPowerValue: members.reduce((sum, member) => sum + Number(member.powerValue || 0), 0),
    totalTobeolValue: members.reduce((sum, member) => sum + Number(member.tobeolValue || 0), 0)
  };
}

function parseKoreanPowerValue(text) {
  const source = String(text || "").replace(/,/g, "").trim();
  if (!source) return 0;

  if (/^\d+(\.\d+)?$/.test(source)) {
    return Number(source);
  }

  const gyeong = getLastUnitValue(source, "경");
  const jo = getLastUnitValue(source, "조");
  const eok = getLastUnitValue(source, "억");
  const man = getLastUnitValue(source, "만");

  return (gyeong * 10_000_000_000_000_000) +
    (jo * 1_000_000_000_000) +
    (eok * 100_000_000) +
    (man * 10_000);
}

function getLastUnitValue(source, unit) {
  const pattern = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`, "g");
  const matches = [...String(source || "").matchAll(pattern)].map((item) => Number(item[1]));
  return matches.length ? matches[matches.length - 1] : 0;
}

function formatKoreanPower(value) {
  let n = Math.max(0, Math.floor(Number(value || 0)));
  const units = [
    ["경", 10_000_000_000_000_000],
    ["조", 1_000_000_000_000],
    ["억", 100_000_000],
    ["만", 10_000]
  ];
  const parts = [];

  for (const [label, size] of units) {
    const unitValue = Math.floor(n / size);
    n %= size;
    if (unitValue > 0) parts.push(`${unitValue}${label}`);
  }

  return parts.join(" ") || "0";
}

function formatSignedKoreanPower(value) {
  const n = Number(value || 0);
  if (n === 0) return "0";
  return `${n > 0 ? "+" : "-"}${formatKoreanPower(Math.abs(n))}`;
}

function calcGrowthRate(current, previous) {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (!p) return null;
  return Number((((c - p) / p) * 100).toFixed(2));
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function todayString() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
