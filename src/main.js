import { FIREBASE_COLLECTION, FIREBASE_CONFIG, FIREBASE_GAME_COLLECTION, FIREBASE_LOBBY_COLLECTION, FIREBASE_MANUAL_COLLECTION } from "./firebase-config.js";
import { createGuideBoardClient, createJellyGameClient, createManualOverrideClient, createVirtualLobbyClient, isFirebaseConfigured } from "./firebase-board.js";

const EDIT_PASSWORD = "5645";
const LOCAL_MANUAL_KEY = "guild-tobeol-dashboard.manual.v1";
const LOCAL_POSTS_KEY = "guild-tobeol-dashboard.guide-posts.v1";
const LOCAL_VIRTUAL_KEY = "guild-tobeol-dashboard.virtual-user.v1";
const LOCAL_CHAT_KEY = "guild-tobeol-dashboard.virtual-chat.v1";
const LOCAL_GAME_KEY = "guild-tobeol-dashboard.jelly-user.v1";
const LOCAL_GAME_EVENTS_KEY = "guild-tobeol-dashboard.jelly-events.v1";
const VIRTUAL_JAIL_MS = 5000;
const VIRTUAL_ATTACK_COOLDOWN_MS = 1200;
const VIRTUAL_ATTACK_RANGE = 13.5;
const VIRTUAL_JAIL_POSITION = { x: 50, y: 88 };

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
  visualGuildFilter: "all",
  visualKeyword: "",
  visualSort: "powerGrowth",
  virtualSelectedKey: "",
  virtualJoined: false,
  virtualClient: null,
  virtualParticipants: [],
  virtualMessages: [],
  virtualPosition: { x: 50, y: 54 },
  virtualStatus: "",
  virtualLoopTimer: null,
  virtualLastSyncAt: 0,
  virtualAttackCooldownUntil: 0,
  virtualActionMessage: "",
  virtualLastAttackedAt: "",
  virtualUserId: getOrCreateVirtualUserId(),
  gameSelectedKey: "",
  gameTeam: "solo",
  gameJoined: false,
  gameClient: null,
  gamePlayers: [],
  gameEvents: [],
  gameFood: [],
  gameBots: [],
  gamePosition: { x: 50, y: 52 },
  gameTarget: null,
  gameMass: 22,
  gameScore: 0,
  gameStatus: "",
  gameLastSyncAt: 0,
  gameLoopTimer: null,
  gameSafeUntil: 0,
  gameLastEatenAt: "",
  gameUserId: getOrCreateGameUserId(),
  guildContents: null,
  contentsGuild: "반짝",
  contentsMode: "league",
  editorUnlocked: true
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
  mobileCardList: document.getElementById("mobile-card-list"),
  visualStats: document.getElementById("visual-stats"),
  visualGuildFilter: document.getElementById("visual-guild-filter"),
  visualKeyword: document.getElementById("visual-keyword"),
  visualSort: document.getElementById("visual-sort"),
  visualOverview: document.getElementById("visual-overview"),
  characterGrid: document.getElementById("character-grid"),
  virtualStatus: document.getElementById("virtual-status"),
  virtualCharacterSelect: document.getElementById("virtual-character-select"),
  virtualJoin: document.getElementById("virtual-join"),
  virtualLeave: document.getElementById("virtual-leave"),
  virtualRandom: document.getElementById("virtual-random"),
  virtualStage: document.getElementById("virtual-stage"),
  virtualAvatars: document.getElementById("virtual-avatars"),
  virtualHint: document.getElementById("virtual-hint"),
  virtualOnlineCount: document.getElementById("virtual-online-count"),
  virtualSelectedName: document.getElementById("virtual-selected-name"),
  virtualPower: document.getElementById("virtual-power"),
  virtualHp: document.getElementById("virtual-hp"),
  virtualState: document.getElementById("virtual-state"),
  virtualTobeol: document.getElementById("virtual-tobeol"),
  virtualAttack: document.getElementById("virtual-attack"),
  virtualChatList: document.getElementById("virtual-chat-list"),
  virtualChatInput: document.getElementById("virtual-chat-input"),
  virtualChatSend: document.getElementById("virtual-chat-send"),
  virtualNudgeButtons: document.querySelectorAll("[data-virtual-move]"),
  gameStatus: document.getElementById("game-status"),
  gameCharacterSelect: document.getElementById("game-character-select"),
  gameTeamSelect: document.getElementById("game-team-select"),
  gameStart: document.getElementById("game-start"),
  gameLeave: document.getElementById("game-leave"),
  gameReset: document.getElementById("game-reset"),
  gameArena: document.getElementById("game-arena"),
  gameFoodLayer: document.getElementById("game-food-layer"),
  gamePlayerLayer: document.getElementById("game-player-layer"),
  gameTarget: document.getElementById("game-target"),
  gameHint: document.getElementById("game-hint"),
  gameAliveCount: document.getElementById("game-alive-count"),
  gameScoreboard: document.getElementById("game-scoreboard"),
  gameEventLog: document.getElementById("game-event-log"),
  gameSelectedName: document.getElementById("game-selected-name"),
  gameMass: document.getElementById("game-mass"),
  gameScore: document.getElementById("game-score"),
  gameNudgeButtons: document.querySelectorAll("[data-game-move]"),
  contentsTabs: document.querySelectorAll(".contents-tab"),
  contentsGuildSelect: document.getElementById("contents-guild-select"),
  contentsSourceLink: document.getElementById("contents-source-link"),
  contentsSummary: document.getElementById("contents-summary"),
  contentsGrid: document.getElementById("contents-grid"),
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
    const [latest, manual, posts, guildContents] = await Promise.all([
      fetchJson("data/latest.json", true),
      fetchJson("data/manual.json", false),
      fetchJson("data/guide-posts.json", false),
      fetchJson("data/guild-contents.json", false)
    ]);

    state.rawData = latest;
    state.manualFromFile = manual;
    state.localManual = readLocalManual();
    state.postsFromFile = normalizePosts(posts);
    state.localPosts = readLocalPosts();
    state.guildContents = normalizeGuildContents(guildContents);
    initFirebaseBoard();
    initManualClient();
    rebuildPosts();
    rebuildData();
    initGuildFilter();
    initVisualFilters();
    initVirtualPicker();
    initContentsFilters();
    initVirtualLobbyClient();
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

  refs.guildFilter?.addEventListener("change", (event) => {
    state.guildFilter = event.target.value;
    render();
  });

  refs.keyword?.addEventListener("input", (event) => {
    state.keyword = event.target.value.trim();
    renderTable();
  });

  refs.sort?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderTable();
  });

  refs.visualGuildFilter?.addEventListener("change", (event) => {
    state.visualGuildFilter = event.target.value;
    renderCharactersPage();
  });

  refs.visualKeyword?.addEventListener("input", (event) => {
    state.visualKeyword = event.target.value.trim();
    renderCharactersPage();
  });

  refs.visualSort?.addEventListener("change", (event) => {
    state.visualSort = event.target.value;
    renderCharactersPage();
  });

  refs.contentsTabs?.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.contentsMode = tab.dataset.contentMode || "league";
      refs.contentsTabs.forEach((item) => item.classList.toggle("active", item === tab));
      renderGuildContentsPage();
    });
  });

  refs.contentsGuildSelect?.addEventListener("change", (event) => {
    state.contentsGuild = event.target.value || "반짝";
    renderGuildContentsPage();
  });

  refs.virtualCharacterSelect?.addEventListener("change", (event) => {
    state.virtualSelectedKey = event.target.value;
    if (state.virtualJoined) joinVirtualLobby(true);
    renderVirtualPage();
  });

  refs.virtualJoin?.addEventListener("click", () => joinVirtualLobby(false));
  refs.virtualAttack?.addEventListener("click", attackNearestVirtualParticipant);
  refs.virtualLeave?.addEventListener("click", leaveVirtualLobby);
  refs.virtualRandom?.addEventListener("click", moveVirtualRandom);
  refs.virtualStage?.addEventListener("click", handleVirtualStageClick);
  refs.virtualChatSend?.addEventListener("click", sendVirtualChat);
  refs.virtualChatInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendVirtualChat();
    }
  });
  refs.virtualNudgeButtons?.forEach((button) => {
    button.addEventListener("click", () => nudgeVirtualAvatar(button.dataset.virtualMove));
  });
  refs.gameCharacterSelect?.addEventListener("change", (event) => {
    state.gameSelectedKey = event.target.value;
    if (state.gameJoined) startJellyGame(true);
    renderGamePage();
  });
  refs.gameTeamSelect?.addEventListener("change", (event) => {
    state.gameTeam = event.target.value;
    if (state.gameJoined) syncGamePlayer(true);
    renderGamePage();
  });
  refs.gameStart?.addEventListener("click", () => startJellyGame(false));
  refs.gameLeave?.addEventListener("click", leaveJellyGame);
  refs.gameReset?.addEventListener("click", resetJellySelf);
  refs.gameArena?.addEventListener("pointerdown", handleGameArenaPointer);
  refs.gameNudgeButtons?.forEach((button) => {
    button.addEventListener("click", () => nudgeJellyPlayer(button.dataset.gameMove));
  });
  document.addEventListener("keydown", handleVirtualKeydown);
  document.addEventListener("keydown", handleGameKeydown);
  window.addEventListener("beforeunload", () => {
    if (state.virtualJoined && state.virtualClient?.enabled) state.virtualClient.leave(state.virtualUserId);
    if (state.gameJoined && state.gameClient?.enabled) state.gameClient.leave(state.gameUserId);
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
  refs.openActionsRefresh?.addEventListener("click", openActionsRefresh);
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

  if (state.page === "characters") {
    renderCharactersPage();
    return;
  }

  if (state.page === "virtual") {
    renderVirtualPage();
    return;
  }

  if (state.page === "contents") {
    renderGuildContentsPage();
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

function initVisualFilters() {
  if (!refs.visualGuildFilter) return;
  const guilds = getGuilds();
  refs.visualGuildFilter.innerHTML = [
    `<option value="all">전체</option>`,
    ...guilds.map((guild) => `<option value="${escapeAttr(guild)}">${escapeHtml(guild)}</option>`)
  ].join("");
  refs.visualGuildFilter.value = state.visualGuildFilter;
  if (refs.visualSort) refs.visualSort.value = state.visualSort;
}

function initVirtualPicker() {
  if (!refs.virtualCharacterSelect) return;

  const members = [...(state.data?.members || [])].sort((a, b) => {
    const guildCompare = String(a.guild || "").localeCompare(String(b.guild || ""), "ko");
    if (guildCompare) return guildCompare;
    return Number(a.rank || 9999) - Number(b.rank || 9999);
  });

  if (!state.virtualSelectedKey && members[0]) {
    state.virtualSelectedKey = virtualMemberKey(members[0]);
  }

  refs.virtualCharacterSelect.innerHTML = members.map((member) => `
    <option value="${escapeAttr(virtualMemberKey(member))}">${escapeHtml(member.guild || "-")} · ${escapeHtml(member.nickname || "-")} · ${escapeHtml(member.job || "-")}</option>
  `).join("");
  refs.virtualCharacterSelect.value = state.virtualSelectedKey;
}


function initContentsFilters() {
  if (!refs.contentsGuildSelect) return;
  const bundles = getGuildContentBundles();
  const keywords = bundles.length
    ? bundles.map((item) => item.keyword)
    : [state.contentsGuild || "반짝"];

  if (!keywords.includes(state.contentsGuild)) state.contentsGuild = keywords[0] || "반짝";

  refs.contentsGuildSelect.innerHTML = keywords.map((keyword) =>
    `<option value="${escapeAttr(keyword)}">${escapeHtml(keyword)}</option>`
  ).join("");
  refs.contentsGuildSelect.value = state.contentsGuild;
}

function renderGuildContentsPage() {
  refs.title.textContent = "길드 컨텐츠";
  refs.subtitle.textContent = "대항전 · 수련장 · 보스대전 매칭을 한 화면에서 확인";

  refs.contentsTabs?.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.contentMode === state.contentsMode);
  });
  if (refs.contentsGuildSelect) refs.contentsGuildSelect.value = state.contentsGuild;

  const bundle = getSelectedGuildContentBundle();
  const modeData = bundle?.modes?.[state.contentsMode] || null;
  const url = modeData?.url || makeGuildContentsUrl(state.contentsMode, state.contentsGuild);
  if (refs.contentsSourceLink) refs.contentsSourceLink.href = url;

  renderGuildContentsSummary(bundle, modeData);
  renderGuildContentsGrid(modeData);

  const count = Number(modeData?.matchCount ?? modeData?.guilds?.length ?? 0);
  refs.footerText.textContent = modeData
    ? `${contentModeLabel(state.contentsMode)} · ${state.contentsGuild} 검색 결과 ${count}개 길드 표시 중 · ${state.guildContents?.capturedAt || "수집일 미상"}`
    : `${state.contentsGuild} ${contentModeLabel(state.contentsMode)} 데이터가 아직 없습니다. MGF에서 열기로 확인하거나 npm run collect:contents를 실행하세요.`;
}

function renderGuildContentsSummary(bundle, modeData) {
  if (!refs.contentsSummary) return;
  const modes = ["league", "training", "boss"];
  refs.contentsSummary.innerHTML = modes.map((mode) => {
    const item = bundle?.modes?.[mode];
    const isActive = mode === state.contentsMode;
    const count = Number(item?.matchCount ?? item?.guilds?.length ?? 0);
    const topGuild = item?.guilds?.[0];
    return `
      <button class="contents-summary-card ${isActive ? "active" : ""}" data-content-summary="${escapeAttr(mode)}" type="button">
        <span>${contentModeEmoji(mode)} ${escapeHtml(contentModeLabel(mode))}</span>
        <strong>${count ? `${count}개 길드` : "데이터 없음"}</strong>
        <small>${topGuild ? `${escapeHtml(topGuild.name)} · ${escapeHtml(topGuild.powerText || "-")}` : "MGF에서 확인 가능"}</small>
      </button>
    `;
  }).join("");

  refs.contentsSummary.querySelectorAll("[data-content-summary]").forEach((button) => {
    button.addEventListener("click", () => {
      state.contentsMode = button.dataset.contentSummary || "league";
      renderGuildContentsPage();
    });
  });
}

function renderGuildContentsGrid(modeData) {
  if (!refs.contentsGrid) return;
  const guilds = modeData?.guilds || [];
  if (!guilds.length) {
    refs.contentsGrid.innerHTML = `
      <article class="contents-empty">
        <strong>표시할 매칭 데이터가 없습니다.</strong>
        <p>브라우저에서 MGF 원본 페이지를 열거나, 로컬에서 <code>npm run collect:contents</code>를 실행해 최신 데이터를 갱신하세요.</p>
      </article>
    `;
    return;
  }

  refs.contentsGrid.innerHTML = guilds.map((guild, index) => renderGuildContentsCard(guild, index)).join("");
}

function renderGuildContentsCard(guild, index) {
  const members = Array.isArray(guild.members) ? guild.members : [];
  const rankBadge = index === 0 ? "현재 검색 길드" : `매칭 #${index + 1}`;
  const memberLines = members.length
    ? members.map((member) => renderGuildContentsMember(member)).join("")
    : `<li><span>-</span><strong>최정예 멤버 정보 없음</strong><em>-</em></li>`;

  return `
    <article class="contents-card ${index === 0 ? "is-main" : ""}">
      <div class="contents-card-top">
        <span class="contents-rank">${escapeHtml(rankBadge)}</span>
        <strong>${escapeHtml(guild.name || "-")}</strong>
      </div>
      <div class="contents-meta">
        <span>Master. <b>${escapeHtml(guild.master || "-")}</b></span>
        <span>${escapeHtml(guild.server || "-")}</span>
      </div>
      <div class="contents-power">
        <span>총 전투력</span>
        <strong>${escapeHtml(guild.powerText || "-")}</strong>
      </div>
      <div class="contents-members-title">최정예 멤버 TOP 5</div>
      <ol class="contents-members">${memberLines}</ol>
    </article>
  `;
}

function renderGuildContentsMember(member) {
  return `
    <li>
      <span>${escapeHtml(member.rank || "-")}</span>
      <strong>${escapeHtml(member.nickname || "-")}</strong>
      <em>${escapeHtml(member.powerText || "-")}</em>
    </li>
  `;
}

function getGuildContentBundles() {
  return Array.isArray(state.guildContents?.guilds) ? state.guildContents.guilds : [];
}

function getSelectedGuildContentBundle() {
  return getGuildContentBundles().find((item) => item.keyword === state.contentsGuild) || getGuildContentBundles()[0] || null;
}

function normalizeGuildContents(value) {
  if (!value || !Array.isArray(value.guilds)) {
    return { capturedAt: "", source: "MGF.GG", guilds: [] };
  }
  return value;
}

function contentModeLabel(mode) {
  return ({ league: "대항전", training: "수련장", boss: "보스대전" })[mode] || "대항전";
}

function contentModeEmoji(mode) {
  return ({ league: "⚔️", training: "🥋", boss: "👑" })[mode] || "⚔️";
}

function makeGuildContentsUrl(mode, keyword) {
  return `https://mgf.gg/contents/guild.php?mode=${encodeURIComponent(mode || "league")}&stx=${encodeURIComponent(keyword || "반짝")}`;
}

function initGamePicker() {
  if (!refs.gameCharacterSelect) return;

  const members = [...(state.data?.members || [])].sort((a, b) => {
    const guildCompare = String(a.guild || "").localeCompare(String(b.guild || ""), "ko");
    if (guildCompare) return guildCompare;
    return Number(a.rank || 9999) - Number(b.rank || 9999);
  });

  if (!state.gameSelectedKey && members[0]) {
    state.gameSelectedKey = virtualMemberKey(members[0]);
  }

  refs.gameCharacterSelect.innerHTML = members.map((member) => `
    <option value="${escapeAttr(virtualMemberKey(member))}">${escapeHtml(member.guild || "-")} · ${escapeHtml(member.nickname || "-")} · ${escapeHtml(member.job || "-")}</option>
  `).join("");
  refs.gameCharacterSelect.value = state.gameSelectedKey;
  if (refs.gameTeamSelect) refs.gameTeamSelect.value = state.gameTeam;
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

function renderCharactersPage() {
  const data = state.data;
  if (!data) return;

  const selectedGuildText = state.visualGuildFilter === "all" ? "전체 길드" : state.visualGuildFilter;
  const members = getVisualFilteredMembers();

  refs.title.textContent = `${selectedGuildText} 캐릭터 모아보기`;
  refs.subtitle.textContent = `캐릭터 이미지 · 전투력 · 토벌전 · 변화량을 한 화면에서 확인`;

  renderVisualStats(members);
  renderVisualOverview();
  renderCharacterGrid(members);

  const manualText = data.manualAppliedCount > 0 ? ` · 수동 보정 ${data.manualAppliedCount}건 포함` : "";
  refs.footerText.textContent = `${members.length}명 표시 중 · 현재 ${data.capturedDate || "-"} 수집 · 이미지 닉네임 매칭${manualText}`;
}

function getVisualFilteredMembers() {
  const keyword = state.visualKeyword.toLowerCase();
  return [...(state.data?.members || [])]
    .filter((member) => state.visualGuildFilter === "all" || member.guild === state.visualGuildFilter)
    .filter((member) => {
      if (!keyword) return true;
      return `${member.guild} ${member.nickname} ${member.job}`.toLowerCase().includes(keyword);
    })
    .sort((a, b) => getSortValue(b, state.visualSort) - getSortValue(a, state.visualSort));
}

function renderVisualStats(members) {
  if (!refs.visualStats) return;
  const topPower = getTopMember(members, "power");
  const topTobeol = getTopMember(members, "tobeol");
  const avgPowerGrowth = averageNumeric(members.map((member) => member.powerGrowthValue));
  const avgTobeolGrowth = averageNumeric(members.map((member) => member.tobeolGrowthValue));
  const cards = [
    ["표시 인원", `${members.length}명`],
    ["전투력 1위", topPower ? `${topPower.nickname} · ${formatKoreanPower(topPower.powerValue)}` : "-"],
    ["평균 전투력 변화", avgPowerGrowth == null ? "비교 없음" : formatSignedKoreanPower(avgPowerGrowth)],
    ["평균 토벌전 변화", avgTobeolGrowth == null ? "비교 없음" : formatSignedKoreanPower(avgTobeolGrowth)],
    ["토벌전 1위", topTobeol ? `${topTobeol.nickname} · ${formatKoreanPower(topTobeol.tobeolValue)}` : "-"]
  ];

  refs.visualStats.innerHTML = cards.map(([label, value]) => `
    <article class="visual-stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
}

function renderVisualOverview() {
  if (!refs.visualOverview) return;
  const guilds = state.visualGuildFilter === "all" ? getGuilds() : [state.visualGuildFilter];
  const allMembers = state.data?.members || [];
  const guildSummaries = guilds
    .map((guild) => {
      const members = allMembers.filter((member) => member.guild === guild);
      return { guild, members, summary: buildSummary(members) };
    })
    .filter((item) => item.members.length);

  refs.visualOverview.innerHTML = guildSummaries.map(({ guild, members, summary }) => {
    const topPower = getTopMember(members, "power");
    const topTobeol = getTopMember(members, "tobeol");
    return `
      <article class="overview-card">
        <div class="overview-title">
          <span class="guild-pill">${escapeHtml(guild)}</span>
          <strong>${summary.memberCount}명</strong>
        </div>
        <div class="overview-lines">
          ${renderOverviewLine("총 전투력", formatKoreanPower(summary.totalPowerValue))}
          ${renderOverviewLine("총 토벌전", formatKoreanPower(summary.totalTobeolValue))}
          ${renderOverviewLine("전투력 대표", topPower ? topPower.nickname : "-")}
          ${renderOverviewLine("토벌전 대표", topTobeol ? topTobeol.nickname : "-")}
        </div>
      </article>
    `;
  }).join("");
}

function renderOverviewLine(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderCharacterGrid(members) {
  if (!refs.characterGrid) return;
  if (!members.length) {
    refs.characterGrid.innerHTML = `<div class="empty character-empty">표시할 캐릭터가 없습니다.</div>`;
    return;
  }

  const max = getVisualMaxValues(members);
  refs.characterGrid.innerHTML = members.map((member, index) => renderCharacterCard(member, index, max)).join("");
}

function renderCharacterCard(member, index, max) {
  const imageUrl = getCharacterImageUrl(member.nickname);
  const rank = member.rank ? `#${member.rank}` : `#${index + 1}`;
  const manualBadge = member.isManual ? `<span class="manual-badge">수동</span>` : "";
  const powerGrowth = member.powerGrowthValue == null ? null : Number(member.powerGrowthValue);
  const tobeolGrowth = member.tobeolGrowthValue == null ? null : Number(member.tobeolGrowthValue);

  return `
    <article class="character-card ${member.isManual ? "manual-card" : ""}">
      <div class="character-art">
        <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(member.nickname || "캐릭터")} 캐릭터 이미지" loading="lazy" decoding="async" onerror="this.closest('.character-art').classList.add('is-missing'); this.remove();" />
        <span class="image-fallback">이미지 없음</span>
      </div>
      <div class="character-info">
        <div class="character-topline">
          <span class="badge">${escapeHtml(rank)}</span>
          ${renderGuild(member)}
        </div>
        <h3>${escapeHtml(member.nickname || "-")} ${manualBadge}</h3>
        <p>${escapeHtml(member.job || "-")} · Lv.${escapeHtml(member.level || "-")}</p>
      </div>
      <div class="character-bars">
        ${renderCharacterBar("전투력", formatKoreanPower(member.powerValue), percentOf(member.powerValue, max.power), "") }
        ${renderCharacterBar("전투력 변화", powerGrowth == null ? "비교 없음" : formatSignedKoreanPower(powerGrowth), percentOf(Math.abs(powerGrowth || 0), max.powerGrowth), growthClass(powerGrowth))}
        ${renderCharacterBar("토벌전", formatKoreanPower(member.tobeolValue), percentOf(member.tobeolValue, max.tobeol), "") }
        ${renderCharacterBar("토벌전 변화", tobeolGrowth == null ? "비교 없음" : formatSignedKoreanPower(tobeolGrowth), percentOf(Math.abs(tobeolGrowth || 0), max.tobeolGrowth), growthClass(tobeolGrowth))}
      </div>
    </article>
  `;
}

function renderCharacterBar(label, value, percent, className) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
  return `
    <div class="character-bar ${escapeAttr(className || "")}" style="--bar:${safePercent}%">
      <div class="character-bar-label">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
      <div class="bar-track"><span></span></div>
    </div>
  `;
}

function getCharacterImageUrl(nickname) {
  return `https://mgf.gg/ranking/ranking_image.php?n=${encodeURIComponent(String(nickname || ""))}`;
}

function getVisualMaxValues(members) {
  return {
    power: getMaxNumber(members.map((member) => member.powerValue)),
    powerGrowth: getMaxNumber(members.map((member) => Math.abs(Number(member.powerGrowthValue || 0)))),
    tobeol: getMaxNumber(members.map((member) => member.tobeolValue)),
    tobeolGrowth: getMaxNumber(members.map((member) => Math.abs(Number(member.tobeolGrowthValue || 0))))
  };
}

function getMaxNumber(values) {
  return Math.max(1, ...values.map((value) => Number(value || 0)));
}

function percentOf(value, max) {
  return (Number(value || 0) / Number(max || 1)) * 100;
}

function growthClass(value) {
  if (value == null) return "is-empty";
  if (Number(value) > 0) return "is-up";
  if (Number(value) < 0) return "is-down";
  return "is-zero";
}

function getTopMember(members, type) {
  const key = type === "tobeol" ? "tobeolValue" : "powerValue";
  return [...members].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0] || null;
}

function averageNumeric(values) {
  const valid = values
    .filter((value) => value != null && Number.isFinite(Number(value)))
    .map((value) => Number(value));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}


function initVirtualLobbyClient() {
  state.virtualMessages = readLocalVirtualMessages();
  state.virtualClient = createVirtualLobbyClient({
    config: FIREBASE_CONFIG,
    collectionName: FIREBASE_LOBBY_COLLECTION,
    onParticipants: (participants) => {
      state.virtualParticipants = participants;
      syncVirtualStateFromServer(participants);
      if (state.page === "virtual") renderVirtualPage();
    },
    onMessages: (messages) => {
      state.virtualMessages = messages;
      if (state.page === "virtual") renderVirtualChat();
    },
    onStatus: (status, message) => {
      state.virtualStatus = message || status || "";
      if (state.page === "virtual") renderVirtualStatus();
    },
    onError: (error) => {
      console.error(error);
      state.virtualStatus = `광장 연결 실패: ${error.message}`;
      if (state.page === "virtual") renderVirtualStatus();
    }
  });

  if (!state.virtualClient?.enabled) {
    state.virtualStatus = "Firebase 설정 전: 이 브라우저에서만 움직이는 데모 모드";
  }
}

function renderVirtualPage() {
  if (!state.data) return;
  if (!state.virtualSelectedKey) initVirtualPicker();

  const member = getSelectedVirtualMember();
  refs.title.textContent = "길드 버츄얼 광장";
  refs.subtitle.textContent = "캐릭터를 골라 광장에서 움직이고 채팅하고, 전투력 기반으로 장난 공격하기";

  renderVirtualStatus();
  renderVirtualSelected(member);
  renderVirtualWorld();
  renderVirtualChat();

  const count = getVirtualParticipantsForRender().filter((item) => !item.isGhost).length;
  refs.footerText.textContent = state.virtualClient?.enabled
    ? `실시간 광장 연결 · 현재 ${count}명 표시 중`
    : "데모 모드 · Firebase 규칙을 배포하면 다른 사람과 실시간으로 만날 수 있습니다.";
}

function renderVirtualStatus() {
  if (!refs.virtualStatus) return;
  const mode = state.virtualClient?.enabled ? "online" : "local";
  refs.virtualStatus.className = `virtual-status ${mode}`;
  refs.virtualStatus.textContent = state.virtualStatus || (mode === "online" ? "실시간 광장 연결됨" : "데모 모드");
}

function renderVirtualSelected(member) {
  if (!member) return;
  const me = getMyVirtualParticipant();
  const maxHp = getVirtualMaxHp(member);
  const hp = getVirtualHp(me, member);
  const jailRemaining = getVirtualJailRemaining(me);
  const cooldownRemaining = Math.max(0, state.virtualAttackCooldownUntil - Date.now());

  if (refs.virtualSelectedName) refs.virtualSelectedName.textContent = `${member.nickname || "-"} · ${member.job || "-"}`;
  if (refs.virtualPower) refs.virtualPower.textContent = formatKoreanPower(member.powerValue);
  if (refs.virtualHp) refs.virtualHp.textContent = state.virtualJoined ? `${formatKoreanPower(hp)} / ${formatKoreanPower(maxHp)}` : formatKoreanPower(maxHp);
  if (refs.virtualState) refs.virtualState.textContent = jailRemaining > 0
    ? `감옥 ${Math.ceil(jailRemaining / 1000)}초`
    : state.virtualJoined ? "정상" : "입장 전";
  if (refs.virtualTobeol) refs.virtualTobeol.textContent = formatKoreanPower(member.tobeolValue);
  if (refs.virtualJoin) refs.virtualJoin.textContent = state.virtualJoined ? "캐릭터 변경 적용" : "광장 입장";
  if (refs.virtualAttack) {
    refs.virtualAttack.disabled = !state.virtualJoined || jailRemaining > 0 || cooldownRemaining > 0;
    refs.virtualAttack.textContent = cooldownRemaining > 0
      ? `공격 대기 ${Math.ceil(cooldownRemaining / 1000)}초`
      : "근처 공격";
  }
  if (refs.virtualLeave) refs.virtualLeave.disabled = !state.virtualJoined;
  if (refs.virtualChatInput) refs.virtualChatInput.disabled = !state.virtualJoined;
  if (refs.virtualChatSend) refs.virtualChatSend.disabled = !state.virtualJoined;
}

function renderVirtualWorld() {
  if (!refs.virtualAvatars) return;
  const participants = getVirtualParticipantsForRender();
  const onlineCount = participants.filter((item) => !item.isGhost).length;
  if (refs.virtualOnlineCount) refs.virtualOnlineCount.textContent = `${onlineCount}명`; 
  const me = getMyVirtualParticipant();
  const jailRemaining = getVirtualJailRemaining(me);
  if (refs.virtualHint) refs.virtualHint.textContent = state.virtualActionMessage || (jailRemaining > 0
    ? `공격을 당해 감옥에 갇혔습니다. ${Math.ceil(jailRemaining / 1000)}초 뒤 자동으로 풀려납니다.`
    : state.virtualJoined
      ? "광장을 누르거나 방향 버튼/키보드 방향키로 이동할 수 있습니다. 가까운 상대는 근처 공격으로 때릴 수 있어요."
      : "캐릭터를 선택하고 입장하면 내 캐릭터가 광장에 나타납니다.");

  refs.virtualAvatars.innerHTML = participants.map((participant) => renderVirtualAvatar(participant)).join("");
}

function renderVirtualAvatar(participant) {
  const member = participant.member || findMemberByName(participant.guild, participant.nickname) || {};
  const isMe = participant.userId === state.virtualUserId;
  const x = clamp(Number(participant.x ?? 50), 5, 95);
  const y = clamp(Number(participant.y ?? 55), 10, 90);
  const imageUrl = getCharacterImageUrl(member.nickname || participant.nickname);
  const bubble = participant.lastMessage ? `<div class="avatar-bubble">${escapeHtml(participant.lastMessage)}</div>` : "";
  const maxHp = getVirtualMaxHp(member, participant);
  const hp = getVirtualHp(participant, member);
  const hpPercent = maxHp ? clamp((hp / maxHp) * 100, 0, 100) : 100;
  const jailRemaining = getVirtualJailRemaining(participant);
  const jailBadge = jailRemaining > 0 ? `<span class="avatar-jail">감옥 ${Math.ceil(jailRemaining / 1000)}초</span>` : "";
  const hpText = `${formatKoreanPower(hp)} / ${formatKoreanPower(maxHp)}`;

  return `
    <button class="virtual-avatar ${isMe ? "is-me" : ""} ${participant.isGhost ? "is-ghost" : ""} ${jailRemaining > 0 ? "is-jailed" : ""} ${hpPercent <= 35 ? "is-low-hp" : ""}" type="button" style="--x:${x}%; --y:${y}%; --hp:${hpPercent}%" title="${escapeAttr((participant.nickname || "캐릭터") + " · 체력 " + hpText)}">
      ${bubble}
      ${jailBadge}
      <span class="avatar-shadow"></span>
      <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(participant.nickname || "캐릭터")}" loading="lazy" decoding="async" onerror="this.closest('.virtual-avatar').classList.add('is-missing'); this.remove();" />
      <span class="avatar-fallback">?</span>
      <strong>${escapeHtml(participant.nickname || "-")}</strong>
      <span class="avatar-hp"><i></i></span>
      <small>${escapeHtml(participant.guild || "-")}</small>
    </button>
  `;
}

function renderVirtualChat() {
  if (!refs.virtualChatList) return;
  const messages = [...(state.virtualMessages || [])].slice(-40);

  if (!messages.length) {
    refs.virtualChatList.innerHTML = `<div class="virtual-empty">아직 채팅이 없습니다. 입장 후 첫 인사를 남겨보세요.</div>`;
    return;
  }

  refs.virtualChatList.innerHTML = messages.map((message) => `
    <article class="chat-message ${message.userId === state.virtualUserId ? "is-me" : ""}">
      <div>
        <strong>${escapeHtml(message.nickname || "익명")}</strong>
        <span>${formatChatTime(message.createdAt)}</span>
      </div>
      <p>${escapeHtml(message.text || "")}</p>
    </article>
  `).join("");
  refs.virtualChatList.scrollTop = refs.virtualChatList.scrollHeight;
}

async function joinVirtualLobby(keepPosition = false) {
  const member = getSelectedVirtualMember();
  if (!member) return;
  if (!keepPosition) state.virtualPosition = randomVirtualPosition();
  state.virtualJoined = true;

  const participant = makeVirtualParticipant(member, state.virtualPosition, { resetHp: true, clearJail: true });

  if (state.virtualClient?.enabled) {
    await state.virtualClient.upsertParticipant(participant);
  } else {
    upsertLocalParticipant(participant);
  }

  startVirtualLoop();
  renderVirtualPage();
}

async function leaveVirtualLobby() {
  state.virtualJoined = false;
  stopVirtualLoop();
  if (state.virtualClient?.enabled) {
    await state.virtualClient.leave(state.virtualUserId);
  } else {
    state.virtualParticipants = state.virtualParticipants.filter((item) => item.userId !== state.virtualUserId);
  }
  renderVirtualPage();
}

function moveVirtualRandom() {
  if (!state.virtualJoined) {
    joinVirtualLobby(false);
    return;
  }
  if (isMyVirtualJailed()) {
    setVirtualActionMessage("감옥 안에서는 이동할 수 없습니다.");
    return;
  }
  updateVirtualPosition(randomVirtualPosition());
}

function handleVirtualStageClick(event) {
  if (!state.virtualJoined || !refs.virtualStage) return;
  if (isMyVirtualJailed()) {
    setVirtualActionMessage("감옥 안에서는 이동할 수 없습니다. 잠깐만 기다려주세요.");
    return;
  }
  if (event.target.closest(".virtual-controls, .virtual-chat-panel, .virtual-avatar")) return;
  const rect = refs.virtualStage.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  updateVirtualPosition({ x, y });
}

function handleVirtualKeydown(event) {
  if (state.page !== "virtual" || !state.virtualJoined) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    attackNearestVirtualParticipant();
    return;
  }
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };
  if (!map[event.key]) return;
  event.preventDefault();
  nudgeVirtualAvatar(map[event.key]);
}

function nudgeVirtualAvatar(direction) {
  if (!state.virtualJoined) return;
  if (isMyVirtualJailed()) {
    setVirtualActionMessage("감옥 안에서는 움직일 수 없습니다.");
    return;
  }
  const step = 5.5;
  const next = { ...state.virtualPosition };
  if (direction === "up") next.y -= step;
  if (direction === "down") next.y += step;
  if (direction === "left") next.x -= step;
  if (direction === "right") next.x += step;
  updateVirtualPosition(next);
}

async function updateVirtualPosition(position) {
  const member = getSelectedVirtualMember();
  if (!member) return;
  if (isMyVirtualJailed()) {
    state.virtualPosition = { ...VIRTUAL_JAIL_POSITION };
    renderVirtualWorld();
    return;
  }
  state.virtualPosition = {
    x: clamp(Number(position.x), 5, 95),
    y: clamp(Number(position.y), 10, 90)
  };

  await syncVirtualParticipant(true);
  renderVirtualWorld();
}

async function sendVirtualChat() {
  if (!state.virtualJoined || !refs.virtualChatInput) return;
  const text = refs.virtualChatInput.value.trim().slice(0, 120);
  if (!text) return;
  const member = getSelectedVirtualMember();
  const message = {
    id: `local-${Date.now()}`,
    userId: state.virtualUserId,
    nickname: member?.nickname || "익명",
    guild: member?.guild || "-",
    text,
    createdAt: new Date().toISOString()
  };

  refs.virtualChatInput.value = "";

  if (state.virtualClient?.enabled) {
    await state.virtualClient.sendMessage(message);
    await state.virtualClient.upsertParticipant({
      ...makeVirtualParticipant(member, state.virtualPosition),
      lastMessage: text
    });
  } else {
    state.virtualMessages = [...state.virtualMessages, message].slice(-80);
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify({ messages: state.virtualMessages }));
    upsertLocalParticipant({ ...makeVirtualParticipant(member, state.virtualPosition), lastMessage: text });
    renderVirtualChat();
    renderVirtualWorld();
  }
}


function startVirtualLoop() {
  if (state.virtualLoopTimer) return;
  state.virtualLoopTimer = window.setInterval(tickVirtualLobby, 1000);
}

function stopVirtualLoop() {
  if (!state.virtualLoopTimer) return;
  window.clearInterval(state.virtualLoopTimer);
  state.virtualLoopTimer = null;
}

async function tickVirtualLobby() {
  if (!state.virtualJoined) return;
  const me = getMyVirtualParticipant();

  if (shouldReleaseVirtualJail(me)) {
    await releaseVirtualFromJail();
    return;
  }

  if (getVirtualJailRemaining(me) > 0) {
    state.virtualPosition = { ...VIRTUAL_JAIL_POSITION };
    await syncVirtualParticipant(false);
  } else if (Date.now() - state.virtualLastSyncAt > 3500) {
    await syncVirtualParticipant(false);
  }

  if (state.page === "virtual") {
    renderVirtualSelected(getSelectedVirtualMember());
    renderVirtualWorld();
  }
}

async function syncVirtualParticipant(force = false, options = {}) {
  if (!state.virtualJoined) return;
  const now = Date.now();
  if (!force && now - state.virtualLastSyncAt < 2600) return;
  state.virtualLastSyncAt = now;
  const member = getSelectedVirtualMember();
  const participant = makeVirtualParticipant(member, state.virtualPosition, options);
  if (state.virtualClient?.enabled) {
    await state.virtualClient.upsertParticipant(participant);
  } else {
    upsertLocalParticipant(participant);
  }
}

function syncVirtualStateFromServer(participants) {
  const me = participants.find((participant) => participant.userId === state.virtualUserId);
  if (!me || !state.virtualJoined) return;
  state.virtualPosition = {
    x: clamp(Number(me.x ?? state.virtualPosition.x), 5, 95),
    y: clamp(Number(me.y ?? state.virtualPosition.y), 10, 90)
  };
  if (me.attackedAt && me.attackedAt !== state.virtualLastAttackedAt) {
    state.virtualLastAttackedAt = me.attackedAt;
    if (getVirtualJailRemaining(me) > 0) {
      setVirtualActionMessage(`${me.lastAttacker || "누군가"}에게 공격당해 5초 감옥에 갇혔습니다.`);
    } else if (me.lastAttacker) {
      setVirtualActionMessage(`${me.lastAttacker}에게 공격당했습니다. 체력이 줄었어요.`);
    }
  }
}

async function releaseVirtualFromJail() {
  const member = getSelectedVirtualMember();
  if (!member) return;
  state.virtualPosition = randomVirtualPosition();
  state.virtualActionMessage = "감옥에서 풀려났습니다. 체력이 다시 회복됐어요.";
  const participant = makeVirtualParticipant(member, state.virtualPosition, { resetHp: true, clearJail: true });
  participant.lastMessage = "감옥 탈출!";
  if (state.virtualClient?.enabled) {
    await state.virtualClient.upsertParticipant(participant);
  } else {
    upsertLocalParticipant(participant);
  }
  if (state.page === "virtual") renderVirtualPage();
}

async function attackNearestVirtualParticipant() {
  if (!state.virtualJoined) {
    await joinVirtualLobby(false);
    return;
  }

  if (isMyVirtualJailed()) {
    setVirtualActionMessage("감옥 안에서는 공격할 수 없습니다.");
    return;
  }

  const cooldownRemaining = state.virtualAttackCooldownUntil - Date.now();
  if (cooldownRemaining > 0) {
    setVirtualActionMessage(`공격 대기 중입니다. ${Math.ceil(cooldownRemaining / 1000)}초만 기다려주세요.`);
    return;
  }

  const target = findNearestVirtualAttackTarget();
  if (!target) {
    setVirtualActionMessage("공격할 수 있는 상대가 근처에 없습니다. 더 가까이 가보세요.");
    return;
  }

  const meMember = getSelectedVirtualMember();
  const targetMember = target.member || findMemberByName(target.guild, target.nickname) || {};
  const damage = calculateVirtualAttackDamage(meMember, targetMember);
  const targetMaxHp = getVirtualMaxHp(targetMember, target);
  const targetHp = getVirtualHp(target, targetMember);
  const nextHp = Math.max(0, targetHp - damage);
  const now = new Date();
  const myName = meMember?.nickname || "익명";
  const targetName = target.nickname || "상대";
  const patch = {
    hp: Math.round(nextHp),
    maxHp: Math.round(targetMaxHp),
    attackedAt: now.toISOString(),
    lastAttacker: myName,
    lastMessage: `${myName} 공격!`
  };

  let text = `${myName} → ${targetName} 공격! -${formatKoreanPower(damage)} 체력`;
  if (nextHp <= 0) {
    patch.hp = 0;
    patch.x = VIRTUAL_JAIL_POSITION.x;
    patch.y = VIRTUAL_JAIL_POSITION.y;
    patch.jailedUntil = new Date(Date.now() + VIRTUAL_JAIL_MS).toISOString();
    patch.lastMessage = "감옥 5초!";
    text = `${myName} → ${targetName} 제압! ${targetName} 감옥 5초`; 
  }

  if (state.virtualClient?.enabled && !target.isGhost) {
    await state.virtualClient.patchParticipant(target.userId, patch);
  } else {
    upsertLocalParticipant({ ...target, ...patch });
  }

  state.virtualAttackCooldownUntil = Date.now() + VIRTUAL_ATTACK_COOLDOWN_MS;
  state.virtualActionMessage = text;
  await addVirtualSystemMessage(text);
  await syncVirtualParticipant(true);
  if (state.page === "virtual") renderVirtualPage();
}

function findNearestVirtualAttackTarget() {
  const me = makeVirtualParticipant(getSelectedVirtualMember(), state.virtualPosition);
  return getVirtualParticipantsForRender()
    .filter((participant) => participant.userId !== state.virtualUserId)
    .filter((participant) => isRecentParticipant(participant))
    .filter((participant) => getVirtualJailRemaining(participant) <= 0)
    .map((participant) => ({
      ...participant,
      distance: Math.hypot(Number(participant.x || 50) - Number(me.x || 50), Number(participant.y || 55) - Number(me.y || 55))
    }))
    .filter((participant) => participant.distance <= VIRTUAL_ATTACK_RANGE)
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

function calculateVirtualAttackDamage(attackerMember, targetMember) {
  const attackerPower = getVirtualMaxHp(attackerMember);
  const targetPower = getVirtualMaxHp(targetMember);
  const powerRatio = targetPower > 0 ? attackerPower / targetPower : 1;
  const ratioBonus = clamp(powerRatio, 0.45, 1.8);
  return Math.max(1, Math.round(attackerPower * 0.18 * ratioBonus));
}

async function addVirtualSystemMessage(text) {
  const message = {
    id: `battle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: "plaza-battle",
    nickname: "광장 전투",
    guild: "SYSTEM",
    text: String(text || "").slice(0, 120),
    createdAt: new Date().toISOString()
  };

  if (state.virtualClient?.enabled) {
    await state.virtualClient.sendMessage(message);
    return;
  }

  state.virtualMessages = [...state.virtualMessages, message].slice(-80);
  try {
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify({ messages: state.virtualMessages }));
  } catch {}
}

function getMyVirtualParticipant() {
  return (state.virtualParticipants || []).find((participant) => participant.userId === state.virtualUserId) || null;
}

function getVirtualMaxHp(member, participant = null) {
  const power = Number(member?.powerValue ?? participant?.maxHp ?? participant?.hp ?? 0);
  return Math.max(1, Math.round(Number.isFinite(power) ? power : 1));
}

function getVirtualHp(participant, member = null) {
  const maxHp = getVirtualMaxHp(member, participant);
  if (!participant) return maxHp;
  const hp = Number(participant.hp ?? maxHp);
  return Math.round(clamp(Number.isFinite(hp) ? hp : maxHp, 0, maxHp));
}

function getVirtualJailRemaining(participant) {
  const until = new Date(participant?.jailedUntil || "").getTime();
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, until - Date.now());
}

function shouldReleaseVirtualJail(participant) {
  if (!participant?.jailedUntil) return false;
  const until = new Date(participant.jailedUntil).getTime();
  if (!Number.isFinite(until) || until > Date.now()) return false;
  return getVirtualHp(participant) <= 0;
}

function isMyVirtualJailed() {
  return getVirtualJailRemaining(getMyVirtualParticipant()) > 0;
}

function setVirtualActionMessage(message) {
  state.virtualActionMessage = message;
  if (state.page === "virtual") {
    renderVirtualSelected(getSelectedVirtualMember());
    renderVirtualWorld();
  }
  window.clearTimeout(setVirtualActionMessage.timer);
  setVirtualActionMessage.timer = window.setTimeout(() => {
    if (state.virtualActionMessage === message) {
      state.virtualActionMessage = "";
      if (state.page === "virtual") renderVirtualWorld();
    }
  }, 2600);
}

function getVirtualParticipantsForRender() {
  const map = new Map();
  const membersByKey = new Map((state.data?.members || []).map((member) => [virtualMemberKey(member), member]));

  for (const participant of state.virtualParticipants || []) {
    const member = membersByKey.get(participant.memberKey) || findMemberByName(participant.guild, participant.nickname);
    map.set(participant.userId, {
      ...participant,
      member,
      x: Number(participant.x ?? 50),
      y: Number(participant.y ?? 55)
    });
  }

  if (state.virtualJoined && !map.has(state.virtualUserId)) {
    const member = getSelectedVirtualMember();
    map.set(state.virtualUserId, makeVirtualParticipant(member, state.virtualPosition));
  }

  const realParticipants = [...map.values()].filter((item) => isRecentParticipant(item));
  if (state.virtualClient?.enabled && realParticipants.length >= 2) return realParticipants;

  return getDemoVirtualParticipants(realParticipants);
}

function getDemoVirtualParticipants(realParticipants) {
  const already = new Set(realParticipants.map((item) => item.memberKey));
  const demoMembers = [...(state.data?.members || [])]
    .filter((member) => !already.has(virtualMemberKey(member)))
    .sort((a, b) => Number(b.powerValue || 0) - Number(a.powerValue || 0))
    .slice(0, 7);

  return [
    ...realParticipants,
    ...demoMembers.map((member, index) => ({
      userId: `ghost-${index}`,
      memberKey: virtualMemberKey(member),
      nickname: member.nickname,
      guild: member.guild,
      job: member.job,
      x: [18, 34, 50, 67, 82, 24, 74][index] || 50,
      y: [28, 64, 42, 70, 34, 78, 52][index] || 50,
      lastSeen: new Date().toISOString(),
      member,
      isGhost: true
    }))
  ];
}

function makeVirtualParticipant(member, position, options = {}) {
  const existing = options.existing || getMyVirtualParticipant();
  const maxHp = getVirtualMaxHp(member, existing);
  const currentHp = options.resetHp
    ? maxHp
    : getVirtualHp(existing, member);
  const jailedUntil = options.clearJail ? "" : String(existing?.jailedUntil || "");
  const finalPosition = getVirtualJailRemaining({ jailedUntil }) > 0 ? VIRTUAL_JAIL_POSITION : position;

  return {
    userId: state.virtualUserId,
    memberKey: virtualMemberKey(member),
    nickname: member?.nickname || "익명",
    guild: member?.guild || "-",
    job: member?.job || "-",
    x: clamp(Number(finalPosition?.x ?? 50), 5, 95),
    y: clamp(Number(finalPosition?.y ?? 55), 10, 90),
    hp: Math.round(clamp(currentHp, 0, maxHp)),
    maxHp: Math.round(maxHp),
    jailedUntil,
    attackedAt: String(existing?.attackedAt || ""),
    lastAttacker: String(existing?.lastAttacker || ""),
    lastMessage: String(existing?.lastMessage || ""),
    lastSeen: new Date().toISOString()
  };
}

function upsertLocalParticipant(participant) {
  const byId = new Map((state.virtualParticipants || []).map((item) => [item.userId, item]));
  const previous = byId.get(participant.userId) || {};
  byId.set(participant.userId, { ...previous, ...participant });
  state.virtualParticipants = [...byId.values()];
}

function getSelectedVirtualMember() {
  const members = state.data?.members || [];
  return members.find((member) => virtualMemberKey(member) === state.virtualSelectedKey) || members[0] || null;
}

function virtualMemberKey(member) {
  return `${String(member?.guild || "").trim()}::${String(member?.nickname || "").trim()}`;
}

function findMemberByName(guild, nickname) {
  return (state.data?.members || []).find((member) => member.guild === guild && member.nickname === nickname) || null;
}

function randomVirtualPosition() {
  return {
    x: 14 + Math.random() * 72,
    y: 18 + Math.random() * 64
  };
}

function readLocalVirtualMessages() {
  try {
    const raw = localStorage.getItem(LOCAL_CHAT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

function getOrCreateVirtualUserId() {
  try {
    const existing = localStorage.getItem(LOCAL_VIRTUAL_KEY);
    if (existing) return existing;
    const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(LOCAL_VIRTUAL_KEY, id);
    return id;
  } catch {
    return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function isRecentParticipant(participant) {
  if (participant.isGhost) return true;
  const lastSeen = new Date(participant.lastSeen || participant.updatedAt || Date.now()).getTime();
  if (!Number.isFinite(lastSeen)) return true;
  return Date.now() - lastSeen < 1000 * 60 * 60 * 2;
}

function formatChatTime(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "방금";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}


function initGameFood() {
  if (state.gameFood.length) return;
  state.gameFood = createGameFood(72);
}

function initGameBots() {
  const members = [...(state.data?.members || [])]
    .sort((a, b) => Number(b.powerValue || 0) - Number(a.powerValue || 0))
    .slice(0, 8);

  state.gameBots = members.map((member, index) => ({
    userId: `bot-${index}`,
    memberKey: virtualMemberKey(member),
    nickname: member.nickname,
    guild: member.guild,
    job: member.job,
    team: ["solo", "blue", "violet", "green", "orange"][index % 5],
    x: [18, 36, 58, 76, 28, 66, 48, 82][index] || randomGamePosition().x,
    y: [24, 66, 34, 72, 46, 22, 80, 42][index] || randomGamePosition().y,
    mass: 18 + index * 5,
    score: index * 80,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    lastSeen: new Date().toISOString(),
    member,
    isBot: true
  }));
}

function initJellyGameClient() {
  state.gameEvents = readLocalGameEvents();
  state.gameClient = createJellyGameClient({
    config: FIREBASE_CONFIG,
    collectionName: FIREBASE_GAME_COLLECTION,
    onPlayers: (players) => {
      state.gamePlayers = players;
      syncLocalJellyFromServer(players);
      if (state.page === "game") renderGamePage();
    },
    onEvents: (events) => {
      state.gameEvents = events;
      if (state.page === "game") renderGameEventLog();
    },
    onStatus: (status, message) => {
      state.gameStatus = message || status || "";
      if (state.page === "game") renderGameStatus();
    },
    onError: (error) => {
      console.error(error);
      state.gameStatus = `게임 연결 실패: ${error.message}`;
      if (state.page === "game") renderGameStatus();
    }
  });

  if (!state.gameClient?.enabled) {
    state.gameStatus = "Firebase 설정 전: 이 브라우저에서 봇과 연습하는 데모 모드";
  }
}

function renderGamePage() {
  if (!state.data) return;
  if (!state.gameSelectedKey) initGamePicker();
  if (!state.gameFood.length) initGameFood();
  if (!state.gameBots.length) initGameBots();

  const member = getSelectedGameMember();
  refs.title.textContent = "메키 젤리난투";
  refs.subtitle.textContent = "길드 캐릭터로 먹이 먹고, 작은 상대 흡수하고, 팀으로 살아남기";

  renderGameStatus();
  renderGameSelected(member);
  renderGameArena();
  renderGameScoreboard();
  renderGameEventLog();

  const playerCount = getGamePlayersForRender().filter((item) => !item.isBot).length;
  refs.footerText.textContent = state.gameClient?.enabled
    ? `실시간 젤리난투 연결 · 현재 ${playerCount}명 참여 중 · 같은 팀은 흡수 불가`
    : "데모 모드 · Firebase 규칙을 배포하면 길드원끼리 실시간 난투가 가능합니다.";
}

function renderGameStatus() {
  if (!refs.gameStatus) return;
  const mode = state.gameClient?.enabled ? "online" : "local";
  refs.gameStatus.className = `game-status ${mode}`;
  refs.gameStatus.textContent = state.gameStatus || (mode === "online" ? "실시간 게임 서버 연결됨" : "데모 모드");
}

function renderGameSelected(member) {
  if (member && refs.gameSelectedName) refs.gameSelectedName.textContent = `${member.nickname || "-"} · ${member.job || "-"}`;
  if (refs.gameMass) refs.gameMass.textContent = `${Math.round(state.gameMass)}점`;
  if (refs.gameScore) refs.gameScore.textContent = numberFormat(Math.round(state.gameScore));
  if (refs.gameStart) refs.gameStart.textContent = state.gameJoined ? "캐릭터/팀 적용" : "게임 시작";
  if (refs.gameLeave) refs.gameLeave.disabled = !state.gameJoined;
  if (refs.gameReset) refs.gameReset.disabled = !state.gameJoined;
}

function renderGameArena() {
  if (!refs.gameFoodLayer || !refs.gamePlayerLayer) return;

  refs.gameFoodLayer.innerHTML = state.gameFood.map((food) => `
    <span class="game-food food-${escapeAttr(food.type)}" style="--x:${food.x}%; --y:${food.y}%; --s:${food.size}px"></span>
  `).join("");

  const players = getGamePlayersForRender();
  const activeCount = players.filter((item) => !item.isBot).length;
  if (refs.gameAliveCount) refs.gameAliveCount.textContent = `${activeCount}명`;
  if (refs.gameHint) refs.gameHint.textContent = state.gameJoined
    ? "게임장을 누르면 그 위치로 이동합니다. 방향키/버튼도 가능해요. 큰 상대에게 가까이 가면 위험합니다."
    : "게임 시작 후 먹이를 먹어 질량을 키우고, 작은 상대를 흡수하세요.";

  refs.gamePlayerLayer.innerHTML = players.map((player) => renderJellyPlayer(player)).join("");
  renderGameTarget();
}

function renderGameTarget() {
  if (!refs.gameTarget) return;
  if (!state.gameJoined || !state.gameTarget) {
    refs.gameTarget.classList.remove("active");
    return;
  }
  refs.gameTarget.classList.add("active");
  refs.gameTarget.style.left = `${clamp(state.gameTarget.x, 0, 100)}%`;
  refs.gameTarget.style.top = `${clamp(state.gameTarget.y, 0, 100)}%`;
}

function renderJellyPlayer(player) {
  const member = player.member || findMemberByName(player.guild, player.nickname) || {};
  const isMe = player.userId === state.gameUserId;
  const relation = getJellyRelationClass(player);
  const x = clamp(Number(player.x ?? 50), 3, 97);
  const y = clamp(Number(player.y ?? 52), 5, 95);
  const mass = Math.max(12, Number(player.mass || 18));
  const size = massToBlobSize(mass);
  const imageUrl = getCharacterImageUrl(member.nickname || player.nickname);
  const teamName = getGameTeamLabel(player.team);
  const shield = isMe && Date.now() < state.gameSafeUntil ? `<span class="jelly-shield">보호</span>` : "";

  return `
    <article class="jelly-player ${isMe ? "is-me" : ""} ${player.isBot ? "is-bot" : ""} ${relation} team-${escapeAttr(player.team || "solo")}" style="--x:${x}%; --y:${y}%; --size:${size}px; --z:${Math.round(size)}" title="${escapeAttr(player.nickname || "캐릭터")}">
      ${shield}
      <div class="jelly-blob">
        <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(player.nickname || "캐릭터")}" loading="lazy" decoding="async" onerror="this.closest('.jelly-player').classList.add('is-missing'); this.remove();" />
        <span class="jelly-fallback">${escapeHtml((player.nickname || "?").slice(0, 1))}</span>
      </div>
      <strong>${escapeHtml(player.nickname || "-")}</strong>
      <small>${escapeHtml(teamName)} · ${Math.round(mass)}</small>
    </article>
  `;
}

function renderGameScoreboard() {
  if (!refs.gameScoreboard) return;
  const players = getGamePlayersForRender()
    .filter((player) => isRecentGamePlayer(player))
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(b.mass || 0) - Number(a.mass || 0))
    .slice(0, 10);

  if (!players.length) {
    refs.gameScoreboard.innerHTML = `<div class="virtual-empty">아직 참여자가 없습니다.</div>`;
    return;
  }

  refs.gameScoreboard.innerHTML = players.map((player, index) => `
    <article class="score-row ${player.userId === state.gameUserId ? "is-me" : ""}">
      <span class="badge">${index + 1}</span>
      <div>
        <strong>${escapeHtml(player.nickname || "-")}</strong>
        <small>${escapeHtml(getGameTeamLabel(player.team))}${player.isBot ? " · 봇" : ""}</small>
      </div>
      <b>${numberFormat(Math.round(player.score || 0))}</b>
    </article>
  `).join("");
}

function renderGameEventLog() {
  if (!refs.gameEventLog) return;
  const events = [...(state.gameEvents || [])].slice(-18).reverse();

  if (!events.length) {
    refs.gameEventLog.innerHTML = `<div class="virtual-empty">아직 난투 기록이 없습니다.</div>`;
    return;
  }

  refs.gameEventLog.innerHTML = events.map((event) => `
    <article class="game-event ${event.type === "eat" ? "is-eat" : ""}">
      <span>${formatChatTime(event.createdAt)}</span>
      <p>${escapeHtml(event.text || "")}</p>
    </article>
  `).join("");
}

async function startJellyGame(keepPosition = false) {
  const member = getSelectedGameMember();
  if (!member) return;

  if (!keepPosition) {
    state.gamePosition = randomGamePosition();
    state.gameTarget = null;
    state.gameMass = 22;
    state.gameScore = 0;
    state.gameSafeUntil = Date.now() + 2500;
  }

  state.gameJoined = true;
  startGameLoop();
  await syncGamePlayer(true);
  void addGameEvent(`${member.nickname || "익명"} 입장! 먹이부터 챙기는 중`, "join");
  renderGamePage();
}

async function leaveJellyGame() {
  state.gameJoined = false;
  state.gameTarget = null;
  stopGameLoop();
  if (state.gameClient?.enabled) {
    await state.gameClient.leave(state.gameUserId);
  } else {
    state.gamePlayers = state.gamePlayers.filter((item) => item.userId !== state.gameUserId);
  }
  renderGamePage();
}

async function resetJellySelf() {
  if (!state.gameJoined) {
    await startJellyGame(false);
    return;
  }
  state.gamePosition = randomGamePosition();
  state.gameTarget = null;
  state.gameMass = 22;
  state.gameScore = Math.max(0, Math.floor(Number(state.gameScore || 0) * 0.35));
  state.gameSafeUntil = Date.now() + 2500;
  await syncGamePlayer(true);
  void addGameEvent(`${getSelectedGameMember()?.nickname || "익명"} 작게 리스폰`, "respawn");
  renderGamePage();
}

function handleGameArenaPointer(event) {
  if (!state.gameJoined || !refs.gameArena) return;
  refs.gameArena.focus({ preventScroll: true });
  const rect = refs.gameArena.getBoundingClientRect();
  state.gameTarget = {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 2, 98),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 4, 96)
  };
  renderGameTarget();
}

function handleGameKeydown(event) {
  if (state.page !== "game" || !state.gameJoined) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right"
  };
  const direction = map[event.key];
  if (!direction) return;
  event.preventDefault();
  nudgeJellyPlayer(direction);
}

function nudgeJellyPlayer(direction) {
  if (!state.gameJoined) return;
  const step = getJellyMoveStep();
  const next = { ...state.gamePosition };
  if (direction === "up") next.y -= step;
  if (direction === "down") next.y += step;
  if (direction === "left") next.x -= step;
  if (direction === "right") next.x += step;
  state.gameTarget = null;
  updateJellyPosition(next, true);
}

function startGameLoop() {
  if (state.gameLoopTimer) return;
  state.gameLoopTimer = window.setInterval(tickJellyGame, 90);
}

function stopGameLoop() {
  if (!state.gameLoopTimer) return;
  window.clearInterval(state.gameLoopTimer);
  state.gameLoopTimer = null;
}

function tickJellyGame() {
  if (!state.gameJoined) return;
  moveGameBots();
  moveJellyTowardTarget();
  eatNearbyFood();
  checkJellyCollisions();
  void syncGamePlayer(false);
  if (state.page === "game") {
    renderGameArena();
    renderGameScoreboard();
    renderGameSelected(getSelectedGameMember());
  }
}

function moveJellyTowardTarget() {
  if (!state.gameTarget) return;
  const dx = state.gameTarget.x - state.gamePosition.x;
  const dy = state.gameTarget.y - state.gamePosition.y;
  const distance = Math.hypot(dx, dy);
  const step = getJellyMoveStep();
  if (distance <= step) {
    state.gamePosition = { ...state.gameTarget };
    state.gameTarget = null;
    return;
  }
  updateJellyPosition({
    x: state.gamePosition.x + (dx / distance) * step,
    y: state.gamePosition.y + (dy / distance) * step
  }, false);
}

function updateJellyPosition(position, renderNow) {
  state.gamePosition = {
    x: clamp(Number(position.x), 2, 98),
    y: clamp(Number(position.y), 4, 96)
  };
  if (renderNow && state.page === "game") renderGameArena();
}

function eatNearbyFood() {
  let ate = 0;
  const radius = massToArenaRadius(state.gameMass);
  state.gameFood = state.gameFood.map((food) => {
    const distance = Math.hypot(food.x - state.gamePosition.x, food.y - state.gamePosition.y);
    if (distance > radius * 0.82 + 1.2) return food;
    ate += Number(food.value || 1);
    return makeGameFood(food.id);
  });

  if (!ate) return;
  state.gameMass = clamp(state.gameMass + ate * 0.9, 14, 260);
  state.gameScore += ate * 12;
}

function checkJellyCollisions() {
  if (Date.now() < state.gameSafeUntil) return;
  const me = makeGamePlayer(getSelectedGameMember());
  const players = getGamePlayersForRender();
  for (const other of players) {
    if (!other || other.userId === state.gameUserId) continue;
    if (!canJellyPlayersFight(me, other)) continue;
    const distance = Math.hypot(Number(other.x || 50) - state.gamePosition.x, Number(other.y || 50) - state.gamePosition.y);
    const myRadius = massToArenaRadius(state.gameMass);
    const otherRadius = massToArenaRadius(other.mass || 18);

    if (state.gameMass > Number(other.mass || 18) * 1.15 && distance < myRadius * 0.9) {
      eatJellyPlayer(other);
      return;
    }

    if (Number(other.mass || 18) > state.gameMass * 1.15 && distance < otherRadius * 0.86) {
      getEatenByJelly(other);
      return;
    }
  }
}

function eatJellyPlayer(other) {
  const member = getSelectedGameMember();
  const gain = Math.max(4, Math.round(Number(other.mass || 18) * 0.42));
  state.gameMass = clamp(state.gameMass + gain, 18, 280);
  state.gameScore += Math.max(60, Math.round(Number(other.mass || 18) * 18));
  const text = `${member?.nickname || "익명"} → ${other.nickname || "상대"} 흡수! +${gain} 질량`;
  void addGameEvent(text, "eat");

  if (other.isBot) {
    respawnGameBot(other.userId);
  } else if (state.gameClient?.enabled) {
    const respawn = randomGamePosition();
    void state.gameClient.markPlayerEaten(other.userId, {
      x: respawn.x,
      y: respawn.y,
      mass: 18,
      score: Math.max(0, Math.floor(Number(other.score || 0) * 0.45)),
      eatenAt: new Date().toISOString(),
      lastEvent: `${member?.nickname || "누군가"}에게 흡수됨`
    });
  }

  void syncGamePlayer(true);
}

function getEatenByJelly(other) {
  const member = getSelectedGameMember();
  const text = `${other.nickname || "상대"} → ${member?.nickname || "익명"} 흡수! 도망 실패`;
  void addGameEvent(text, "eat");
  state.gamePosition = randomGamePosition();
  state.gameTarget = null;
  state.gameMass = 18;
  state.gameScore = Math.max(0, Math.floor(Number(state.gameScore || 0) * 0.45));
  state.gameSafeUntil = Date.now() + 2800;
  void syncGamePlayer(true);
}

function moveGameBots() {
  if (!state.gameBots.length) return;
  state.gameBots = state.gameBots.map((bot) => {
    let vx = Number(bot.vx || 0);
    let vy = Number(bot.vy || 0);
    if (Math.random() < 0.055) {
      vx = (Math.random() - 0.5) * 1.8;
      vy = (Math.random() - 0.5) * 1.8;
    }
    let x = Number(bot.x || 50) + vx;
    let y = Number(bot.y || 50) + vy;
    if (x < 5 || x > 95) vx *= -1;
    if (y < 8 || y > 92) vy *= -1;
    x = clamp(x, 5, 95);
    y = clamp(y, 8, 92);
    return { ...bot, x, y, vx, vy };
  });
}

function respawnGameBot(userId) {
  state.gameBots = state.gameBots.map((bot) => {
    if (bot.userId !== userId) return bot;
    const next = randomGamePosition();
    return {
      ...bot,
      x: next.x,
      y: next.y,
      mass: 16 + Math.random() * 20,
      score: Math.max(0, Math.floor(Number(bot.score || 0) * 0.35)),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5
    };
  });
}

async function syncGamePlayer(force = false) {
  if (!state.gameJoined) return;
  const now = Date.now();
  if (!force && now - state.gameLastSyncAt < 240) return;
  state.gameLastSyncAt = now;

  const player = makeGamePlayer(getSelectedGameMember());
  if (state.gameClient?.enabled) {
    await state.gameClient.upsertPlayer(player);
  } else {
    upsertLocalGamePlayer(player);
  }
}

function syncLocalJellyFromServer(players) {
  if (!state.gameJoined) return;
  const me = players.find((player) => player.userId === state.gameUserId);
  if (!me) return;
  if (me.eatenAt && me.eatenAt !== state.gameLastEatenAt) {
    state.gameLastEatenAt = me.eatenAt;
    state.gamePosition = { x: clamp(me.x, 2, 98), y: clamp(me.y, 4, 96) };
    state.gameTarget = null;
    state.gameMass = Math.max(18, Number(me.mass || 18));
    state.gameScore = Math.max(0, Number(me.score || 0));
    state.gameSafeUntil = Date.now() + 2800;
    return;
  }

  if (Number(me.mass || 0) > state.gameMass + 2) state.gameMass = Number(me.mass);
  if (Number(me.score || 0) > state.gameScore) state.gameScore = Number(me.score);
}

function makeGamePlayer(member) {
  return {
    userId: state.gameUserId,
    memberKey: virtualMemberKey(member),
    nickname: member?.nickname || "익명",
    guild: member?.guild || "-",
    job: member?.job || "-",
    team: state.gameTeam || "solo",
    x: clamp(Number(state.gamePosition.x), 2, 98),
    y: clamp(Number(state.gamePosition.y), 4, 96),
    mass: Math.round(Number(state.gameMass || 18)),
    score: Math.round(Number(state.gameScore || 0)),
    safeUntil: state.gameSafeUntil ? new Date(state.gameSafeUntil).toISOString() : "",
    lastSeen: new Date().toISOString()
  };
}

function upsertLocalGamePlayer(player) {
  const byId = new Map((state.gamePlayers || []).map((item) => [item.userId, item]));
  byId.set(player.userId, player);
  state.gamePlayers = [...byId.values()];
}

function getGamePlayersForRender() {
  const map = new Map();
  const membersByKey = new Map((state.data?.members || []).map((member) => [virtualMemberKey(member), member]));

  for (const player of state.gamePlayers || []) {
    if (!isRecentGamePlayer(player)) continue;
    const member = membersByKey.get(player.memberKey) || findMemberByName(player.guild, player.nickname);
    map.set(player.userId, { ...player, member });
  }

  if (state.gameJoined) {
    map.set(state.gameUserId, makeGamePlayer(getSelectedGameMember()));
  }

  const realCount = [...map.values()].filter((item) => !item.isBot).length;
  if (!state.gameClient?.enabled || realCount < 4) {
    for (const bot of state.gameBots) {
      if (!map.has(bot.userId)) map.set(bot.userId, bot);
    }
  }

  return [...map.values()].sort((a, b) => Number(a.mass || 0) - Number(b.mass || 0));
}

function getJellyRelationClass(player) {
  if (!state.gameJoined || player.userId === state.gameUserId) return "";
  const me = makeGamePlayer(getSelectedGameMember());
  if (!canJellyPlayersFight(me, player)) return "is-team";
  if (state.gameMass > Number(player.mass || 18) * 1.15) return "can-eat";
  if (Number(player.mass || 18) > state.gameMass * 1.15) return "is-danger";
  return "is-even";
}

function canJellyPlayersFight(a, b) {
  const teamA = a?.team || "solo";
  const teamB = b?.team || "solo";
  if (teamA === "solo" || teamB === "solo") return true;
  return teamA !== teamB;
}

function getSelectedGameMember() {
  const members = state.data?.members || [];
  return members.find((member) => virtualMemberKey(member) === state.gameSelectedKey) || members[0] || null;
}

function createGameFood(count) {
  return Array.from({ length: count }, (_, index) => makeGameFood(`food-${index}`));
}

function makeGameFood(id) {
  const roll = Math.random();
  const type = roll > 0.9 ? "gold" : roll > 0.68 ? "mint" : roll > 0.42 ? "blue" : "pink";
  const value = type === "gold" ? 4 : type === "mint" ? 2 : 1;
  return {
    id,
    type,
    value,
    size: type === "gold" ? 14 : type === "mint" ? 11 : 8,
    x: Math.round((4 + Math.random() * 92) * 10) / 10,
    y: Math.round((6 + Math.random() * 88) * 10) / 10
  };
}

function randomGamePosition() {
  return {
    x: 8 + Math.random() * 84,
    y: 10 + Math.random() * 80
  };
}

function getJellyMoveStep() {
  return clamp(3.35 - Math.sqrt(Number(state.gameMass || 18)) / 12, 0.85, 2.65);
}

function massToBlobSize(mass) {
  return clamp(30 + Math.sqrt(Number(mass || 18)) * 10.8, 48, 152);
}

function massToArenaRadius(mass) {
  return clamp(2.2 + Math.sqrt(Number(mass || 18)) * 0.32, 3.1, 11.8);
}

function isRecentGamePlayer(player) {
  if (player.isBot) return true;
  const lastSeen = new Date(player.lastSeen || player.updatedAt || Date.now()).getTime();
  if (!Number.isFinite(lastSeen)) return true;
  return Date.now() - lastSeen < 1000 * 60 * 20;
}

async function addGameEvent(text, type = "info") {
  const member = getSelectedGameMember();
  const event = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: state.gameUserId,
    nickname: member?.nickname || "익명",
    guild: member?.guild || "-",
    type,
    text: String(text || "").slice(0, 160),
    createdAt: new Date().toISOString()
  };

  if (state.gameClient?.enabled) {
    await state.gameClient.addEvent(event);
    return;
  }

  state.gameEvents = [...state.gameEvents, event].slice(-80);
  try {
    localStorage.setItem(LOCAL_GAME_EVENTS_KEY, JSON.stringify({ events: state.gameEvents }));
  } catch {}
  if (state.page === "game") renderGameEventLog();
}

function readLocalGameEvents() {
  try {
    const raw = localStorage.getItem(LOCAL_GAME_EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

function getOrCreateGameUserId() {
  try {
    const existing = localStorage.getItem(LOCAL_GAME_KEY);
    if (existing) return existing;
    const id = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(LOCAL_GAME_KEY, id);
    return id;
  } catch {
    return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function getGameTeamLabel(team) {
  switch (team) {
    case "blue": return "파랑팀";
    case "violet": return "보라팀";
    case "green": return "초록팀";
    case "orange": return "주황팀";
    default: return "개인전";
  }
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
  refs.passwordMessage && (refs.passwordMessage.textContent = "");
  refs.editorMessage.textContent = "";
  state.editorUnlocked = true;
  showEditorView();
}

function closeEditor() {
  refs.editDialog.close();
}

function unlockEditor() {
  if (!refs.editorPassword) return;
  if (refs.editorPassword.value !== EDIT_PASSWORD) {
    refs.passwordMessage.textContent = "비밀번호가 맞지 않습니다.";
    refs.editorPassword.select();
    return;
  }

  state.editorUnlocked = true;
  showEditorView();
}

function showEditorView() {
  refs.passwordView?.classList.add("hidden");
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
    const powerValue = valueFromManual(override, "power", member.powerValue);
    const previousPowerValue = valueFromManual(override, "previousPower", member.previousPowerValue);
    const tobeolValue = valueFromManual(override, "tobeol", member.tobeolValue);
    const previousTobeolValue = valueFromManual(override, "previousTobeol", member.previousTobeolValue);

    return `
      <tr data-index="${index}">
        <td>${escapeHtml(member.guild || "-")}</td>
        <td>
          <strong>${escapeHtml(member.nickname)}</strong>
          <div class="muted">${escapeHtml(member.job || "-")} · Lv.${member.level || "-"}</div>
        </td>
        <td>
          <input data-field="powerText" value="${escapeAttr(formatEditablePower(powerValue))}" placeholder="예: 1조 2345억" />
        </td>
        <td>
          <input data-field="previousPowerText" value="${escapeAttr(formatEditablePower(previousPowerValue))}" placeholder="예: 1조 2345억" />
        </td>
        <td>
          <input data-field="tobeolText" value="${escapeAttr(formatEditablePower(tobeolValue))}" placeholder="예: 987억" />
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

    const powerText = row.querySelector('[data-field="powerText"]')?.value.trim() || "";
    const previousPowerText = row.querySelector('[data-field="previousPowerText"]')?.value.trim() || "";
    const tobeolText = row.querySelector('[data-field="tobeolText"]')?.value.trim() || "";
    const previousTobeolText = row.querySelector('[data-field="previousTobeolText"]')?.value.trim() || "";
    const memo = row.querySelector('[data-field="memo"]')?.value.trim() || "";

    const powerValue = parseEditablePowerValue(powerText);
    const previousPowerValue = parseEditablePowerValue(previousPowerText);
    const tobeolValue = parseEditablePowerValue(tobeolText);
    const previousTobeolValue = parseEditablePowerValue(previousTobeolText);

    const basePower = nullableNumber(member.powerValue);
    const basePreviousPower = nullableNumber(member.previousPowerValue);
    const baseTobeol = nullableNumber(member.tobeolValue);
    const basePreviousTobeol = nullableNumber(member.previousTobeolValue);

    const powerChanged = !sameNullableNumber(powerValue, basePower);
    const previousPowerChanged = !sameNullableNumber(previousPowerValue, basePreviousPower);
    const tobeolChanged = !sameNullableNumber(tobeolValue, baseTobeol);
    const previousTobeolChanged = !sameNullableNumber(previousTobeolValue, basePreviousTobeol);

    if (!powerChanged && !previousPowerChanged && !tobeolChanged && !previousTobeolChanged && !memo) continue;

    const item = {
      guild: member.guild,
      nickname: member.nickname
    };

    if (powerChanged) {
      item.powerText = powerText;
      item.powerValue = powerValue;
    }

    if (previousPowerChanged) {
      item.previousPowerText = previousPowerText;
      item.previousPowerValue = previousPowerValue;
    }

    if (tobeolChanged) {
      item.tobeolText = tobeolText;
      item.tobeolValue = tobeolValue;
    }

    if (previousTobeolChanged) {
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
    ? "서버에 수동 보정값을 저장 중입니다..."
    : "Firebase 설정 전이라 이 브라우저에 저장 중입니다...";

  try {
    if (state.manualClient?.enabled) {
      await state.manualClient.saveManual(manual);
      state.serverManual = manual;
      refs.editorMessage.textContent = `수동 보정값 ${manual.items.length}건을 서버에 저장했습니다. 새로고침 후에도 전체 사용자에게 동일하게 반영됩니다.`;
    } else {
      state.localManual = manual;
      localStorage.setItem(LOCAL_MANUAL_KEY, JSON.stringify(manual));
      refs.editorMessage.textContent = `수동 보정값 ${manual.items.length}건을 이 브라우저에 저장했습니다. Firebase 설정을 완료하면 전체 사용자에게 반영됩니다.`;
    }

    rebuildData();
    initGuildFilter();
    initVisualFilters();
    initVirtualPicker();
    initGamePicker();
    render();
    if (state.page === "characters") renderCharactersPage();
    if (state.page === "virtual") renderVirtualPage();
    if (state.page === "game") renderGamePage();
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

  if (!confirm("저장된 수동 보정값을 초기화할까요?")) return;

  refs.clearManual.disabled = true;
  try {
    if (state.manualClient?.enabled) {
      await state.manualClient.saveManual(emptyManual);
      state.serverManual = emptyManual;
      refs.editorMessage.textContent = "서버에 저장된 수동 보정값을 초기화했습니다.";
    } else {
      localStorage.removeItem(LOCAL_MANUAL_KEY);
      state.localManual = null;
      refs.editorMessage.textContent = "이 브라우저에 저장된 수동 보정값을 초기화했습니다.";
    }

    rebuildData();
    render();
    if (state.page === "characters") renderCharactersPage();
    if (state.page === "virtual") renderVirtualPage();
    if (state.page === "game") renderGamePage();
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
      if (state.page === "characters") {
        renderCharactersPage();
      }
      if (state.page === "virtual") {
        renderVirtualPage();
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

    const hasPower = hasManualValue(override, "power");
    const hasPreviousPower = hasManualValue(override, "previousPower");
    const hasTobeol = hasManualValue(override, "tobeol");
    const hasPreviousTobeol = hasManualValue(override, "previousTobeol");
    const next = {
      ...member,
      isManual: Boolean(hasPower || hasPreviousPower || hasTobeol || hasPreviousTobeol || override.memo),
      manualMemo: override.memo || ""
    };

    if (hasPower) {
      next.powerValue = valueFromManual(override, "power", next.powerValue);
      next.powerText = next.powerValue == null ? "" : formatKoreanPower(next.powerValue);
    }

    if (hasPreviousPower) {
      next.previousPowerValue = valueFromManual(override, "previousPower", next.previousPowerValue);
      next.previousPowerText = next.previousPowerValue == null ? "" : formatKoreanPower(next.previousPowerValue);
    }

    if (hasPower || hasPreviousPower) {
      next.powerGrowthValue = next.previousPowerValue == null ? null : Number(next.powerValue || 0) - Number(next.previousPowerValue || 0);
      next.powerGrowthText = next.powerGrowthValue == null ? null : formatSignedKoreanPower(next.powerGrowthValue);
      next.powerGrowthRate = calcGrowthRate(next.powerValue, next.previousPowerValue);
    }

    if (hasTobeol) {
      next.tobeolValue = valueFromManual(override, "tobeol", next.tobeolValue);
      next.tobeolText = next.tobeolValue == null ? "" : formatKoreanPower(next.tobeolValue);
    }

    if (hasPreviousTobeol) {
      next.previousTobeolValue = valueFromManual(override, "previousTobeol", next.previousTobeolValue);
      next.previousTobeolText = next.previousTobeolValue == null ? "" : formatKoreanPower(next.previousTobeolValue);
    }

    if (hasTobeol || hasPreviousTobeol) {
      next.tobeolGrowthValue = next.previousTobeolValue == null ? null : Number(next.tobeolValue || 0) - Number(next.previousTobeolValue || 0);
      next.tobeolGrowthText = next.tobeolGrowthValue == null ? null : formatSignedKoreanPower(next.tobeolGrowthValue);
      next.tobeolGrowthRate = calcGrowthRate(next.tobeolValue, next.previousTobeolValue);
    }

    return next;
  });
}

function hasManualValue(item, prefix) {
  return item?.[`${prefix}Value`] !== undefined || item?.[`${prefix}Text`] !== undefined;
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


// src/main.js 의 renderTable 함수를 이렇게 수정해보세요
function renderTable() {
  const members = getFilteredMembers();
  const table = getTableSpec(state.tab);

  refs.panelTitle.textContent = table.title;
  refs.panelDesc.textContent = table.desc;
  refs.tableHead.innerHTML = `<tr>${table.columns.map((column) => `<th>${column.label}</th>`).join("")}</tr>`;

  if (members.length === 0) {
    refs.tableBody.innerHTML = `<tr><td colspan="${table.columns.length}" class="empty">표시할 데이터가 없습니다.</td></tr>`;
    if (refs.mobileCardList) {
      refs.mobileCardList.innerHTML = `<div class="empty mobile-empty">표시할 데이터가 없습니다.</div>`;
    }
    return;
  }

  refs.tableBody.innerHTML = members.map((member, index) => `
    <tr class="${member.isManual ? "manual-row" : ""}">
      ${table.columns.map((column) => `<td>${column.render(member, index)}</td>`).join("")}
    </tr>
  `).join("");

  if (refs.mobileCardList) {
    refs.mobileCardList.innerHTML = members.map((member, index) => renderMemberCard(member, index)).join("");
  }
}

function renderMemberCard(member, index) {
  const isTobeol = state.tab === "tobeol";
  const currentLabel = isTobeol ? "현재 점수" : "현재 전투력";
  const previousLabel = isTobeol ? "7일 전 점수" : "7일 전 전투력";
  const currentValue = isTobeol ? formatKoreanPower(member.tobeolValue) : formatKoreanPower(member.powerValue);
  const previousValue = isTobeol ? (member.previousTobeolText || "-") : (member.previousPowerText || "-");
  const growthValue = isTobeol
    ? renderGrowth(member.tobeolGrowthValue, member.tobeolGrowthText)
    : renderGrowth(member.powerGrowthValue, member.powerGrowthText);
  const rateValue = isTobeol ? renderRate(member.tobeolGrowthRate) : renderRate(member.powerGrowthRate);
  const rank = member.rank ? `#${escapeHtml(member.rank)}` : `#${index + 1}`;
  const manualBadge = member.isManual ? `<span class="manual-badge">수동</span>` : "";

  return `
    <article class="member-card ${member.isManual ? "manual-card" : ""}">
      <div class="member-card-top">
        <div>
          <div class="member-name">${escapeHtml(member.nickname || "-")} ${manualBadge}</div>
          <div class="member-sub">${escapeHtml(member.job || "-")} · Lv.${escapeHtml(member.level || "-")}</div>
        </div>
        <div class="member-rank">
          <span>${rank}</span>
          ${renderGuild(member)}
        </div>
      </div>
      <div class="member-metrics">
        ${renderMetric(currentLabel, escapeHtml(currentValue))}
        ${renderMetric(previousLabel, escapeHtml(previousValue))}
        ${renderMetric("성장", growthValue)}
        ${renderMetric("성장률", rateValue)}
      </div>
    </article>
  `;
}

function renderMetric(label, value) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

