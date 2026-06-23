const state = {
  data: null,
  tab: "power",
  guildFilter: "all",
  keyword: "",
  sort: "powerGrowth"
};

const refs = {
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  summaryGrid: document.getElementById("summary-grid"),
  tabs: document.querySelectorAll(".tab"),
  guildFilter: document.getElementById("guild-filter"),
  keyword: document.getElementById("keyword"),
  sort: document.getElementById("sort"),
  panelTitle: document.getElementById("panel-title"),
  panelDesc: document.getElementById("panel-desc"),
  tableHead: document.getElementById("table-head"),
  tableBody: document.getElementById("table-body"),
  footerText: document.getElementById("footer-text")
};

init();

async function init() {
  bindEvents();

  try {
    const res = await fetch(`data/latest.json?ts=${Date.now()}`);
    if (!res.ok) throw new Error(`latest.json 로딩 실패: ${res.status}`);
    state.data = await res.json();
    initGuildFilter();
    render();
  } catch (error) {
    refs.tableBody.innerHTML = `<tr><td colspan="99" class="empty">${escapeHtml(error.message)}</td></tr>`;
    refs.footerText.textContent = "data/latest.json 파일을 확인해주세요.";
  }
}

function bindEvents() {
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
  const declared = Array.isArray(state.data?.guilds) ? state.data.guilds : [];
  const fromMembers = [...new Set((state.data?.members || []).map((member) => member.guild).filter(Boolean))];
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
  refs.subtitle.textContent = `전투력 · 토벌전 현황 · ${data.capturedDate || "-"} 기준`;

  renderSummary();
  renderTable();

  refs.footerText.textContent = `${selectedGuildText || "-"} 길드 내부 참고용 · ${data.capturedDate || "-"} 수집`;
}

function renderSummary() {
  const members = getGuildFilteredMembers();
  const summary = buildSummary(members);
  const cards = [
    ["조회 길드", state.guildFilter === "all" ? `${summary.guildCount || 0}개` : state.guildFilter],
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
    <tr>
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
      desc: "반짝/풍년순대국밥 길드원 닉네임 기준으로 매칭한 토벌전 점수입니다.",
      columns: [
        col("#", (_, index) => `<span class="badge">${index + 1}</span>`),
        col("길드", renderGuild),
        col("닉네임", renderName),
        col("레벨", (m) => `Lv.${m.level}`),
        col("현재 점수", (m) => formatKoreanPower(m.tobeolValue)),
        col("이전 점수", (m) => m.previousTobeolText || "-"),
        col("성장", (m) => renderGrowth(m.tobeolGrowthValue, m.tobeolGrowthText)),
        col("성장률", (m) => renderRate(m.tobeolGrowthRate))
      ]
    };
  }

  return {
    title: "전투력 성장",
    desc: "길드원 전투력 수집 데이터 기준입니다.",
    columns: [
      col("#", (_, index) => `<span class="badge">${index + 1}</span>`),
      col("길드", renderGuild),
      col("길드순위", (m) => `<span class="badge">${m.rank}</span>`),
      col("닉네임", renderName),
      col("레벨", (m) => `Lv.${m.level}`),
      col("현재 전투력", (m) => formatKoreanPower(m.powerValue)),
      col("이전 전투력", (m) => m.previousPowerText || "-"),
      col("성장", (m) => renderGrowth(m.powerGrowthValue, m.powerGrowthText)),
      col("성장률", (m) => renderRate(m.powerGrowthRate))
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
  return `
    <div class="nickname">${escapeHtml(member.nickname)}</div>
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

function buildSummary(members) {
  return {
    guildCount: new Set(members.map((member) => member.guild).filter(Boolean)).size,
    memberCount: members.length,
    totalPowerValue: members.reduce((sum, member) => sum + Number(member.powerValue || 0), 0),
    totalTobeolValue: members.reduce((sum, member) => sum + Number(member.tobeolValue || 0), 0)
  };
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

function numberFormat(value) {
  return Number(value || 0).toLocaleString("ko-KR");
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
