const workTypes = {
  as: {
    label: "AS文",
    max: 10,
    description:
      "≤10分。指故事剧情围绕女性展开。世界观不含男，亦不含拟男（如男机器人）。为纯理想状态。凡含男皆非此类。",
  },
  semiAs: {
    label: "半AS文",
    max: 8,
    description: "≤8分。指主角团全体为女性且无性缘，但存在男性配角和路人等。",
  },
  nonAs: {
    label: "非AS文",
    max: 0,
    description:
      "≤0分。指主角团内存在男性，或主角团有性缘。反派为重要配角且为男时按作者情感倾向判断，倾向积极多高光则判定主角团含男，批判为主则判定主角团不含男。",
  },
};

const rules = [
  { id: "r01", text: "未明确说明不随蝻姓、无随母姓意识（针对主角）。", points: 1 },
  { id: "r02", text: "未使用女义词。", points: 1 },
  { id: "r03", text: "女性角色塑造不用心（取名随意如abb、脸谱化、平面化等）。", points: 1 },
  { id: "r04", text: "性别认知障碍（自称哥、爸、爷等）。", points: 1 },
  { id: "r05", text: "女男比低于2:1。", points: 1 },
  { id: "r06", text: "刻板印象。", points: 1 },
  {
    id: "r07",
    text: "描写男性凝视（服美役、白幼瘦、高跟鞋、胸臀腿特写等）批判、坚决反对除外。",
    points: 1,
  },
  {
    id: "r08",
    text: "美化男性（母父对比、男性深情、男性友情、男性导师、好弟弟等）。",
    points: 1,
  },
  { id: "r09", text: "作者偏爱男性（为男性取爱称、称儿子等）。", points: 1 },
  { id: "r10", text: "扶持男性（扶弟、扶贫等）。", points: 1 },
  { id: "r12a", text: "作者上一本为BL或男主文扣3分。", points: 3 },
  {
    id: "r12b",
    text: "下一本预收为GB扣2分（预收&连载中BL/男主文为禁红不禁黑）。",
    points: 2,
  },
  {
    id: "r13",
    text: "男角色（或拟男）有完整的成长线或复杂的人性或高光时刻。",
    points: 1,
  },
  { id: "r14", text: "虏竟情节。", points: 1 },
  {
    id: "r15",
    text: "以性、虐待、虐杀惩罚女性，对此类过程加以详细描写。",
    points: 1,
  },
  { id: "r16", text: "女扮男。", points: 1 },
  { id: "r17", text: "文中不多或无女性意识。", points: 1 },
  {
    id: "r18",
    text: "描写苦难过多，描写反抗情节的情节百分比过少。",
    points: 1,
  },
  { id: "r19", text: "男权社会无性战。", points: 1 },
  {
    id: "r20",
    text: "作品评论区发表厌女评论且为主流声音、作者关闭评论区等。",
    points: 1,
  },
  { id: "r11", text: "不足50章的连载文打分≤5。", points: 0, cap: 5, type: "限制项" },
];

const STORAGE_KEY = "literary-scoring-form-v1";
let isRestoring = false;
let exportImages = [];

const els = {
  form: document.querySelector("#scoreForm"),
  rules: document.querySelector("#rules"),
  finalScore: document.querySelector("#finalScore"),
  scoreHint: document.querySelector("#scoreHint"),
  sideScore: document.querySelector("#sideScore"),
  mobileScore: document.querySelector("#mobileScore"),
  mobileDeduct: document.querySelector("#mobileDeduct"),
  mobileSaveBtn: document.querySelector("#mobileSaveBtn"),
  mobileClearBtn: document.querySelector("#mobileClearBtn"),
  baseScore: document.querySelector("#baseScore"),
  bonusScore: document.querySelector("#bonusScore"),
  deductScore: document.querySelector("#deductScore"),
  capScore: document.querySelector("#capScore"),
  report: document.querySelector("#report"),
  exportImageBtn: document.querySelector("#exportImageBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  printBtn: document.querySelector("#printBtn"),
  saveStatus: document.querySelector("#saveStatus"),
  imageModal: document.querySelector("#imageModal"),
  imageList: document.querySelector("#imageList"),
  closeImageModal: document.querySelector("#closeImageModal"),
};

function ruleNumber(rule) {
  if (rule.id === "r12a") return "12-1";
  if (rule.id === "r12b") return "12-2";
  return String(Number(rule.id.replace("r", "")));
}

function renderRules() {
  els.rules.innerHTML = rules
    .map((rule) => {
      const number = ruleNumber(rule);
      const badgeText = rule.cap ? `限制 ≤${rule.cap}` : `-${rule.points}分`;
      const badgeClass = rule.cap ? "rule-badge is-cap" : "rule-badge";

      return `<article class="rule-card" data-rule="${rule.id}" data-active="false">
          <div class="rule-head">
            <input type="checkbox" id="${rule.id}" data-check="${rule.id}" />
            <label class="rule-title" for="${rule.id}">
              ${number}. ${rule.text}
            </label>
            <span class="${badgeClass}">${badgeText}</span>
          </div>
          <label class="evidence">
            备注
            <textarea data-note="${rule.id}" placeholder="选填"></textarea>
          </label>
        </article>`;
    })
    .join("");
}

function selectedType() {
  const value = new FormData(els.form).get("workType");
  return workTypes[value] || workTypes.as;
}

function collectState() {
  const type = selectedType();
  const activeRules = rules
    .map((rule) => {
      const checked = document.querySelector(`[data-check="${rule.id}"]`).checked;
      const note = document.querySelector(`[data-note="${rule.id}"]`).value.trim();
      const points = rule.cap ? 0 : rule.points;
      return { ...rule, checked, note, points };
    })
    .filter((rule) => rule.checked);

  const rawDeduct = activeRules.reduce((sum, rule) => sum + (rule.cap ? 0 : rule.points), 0);
  const bonus = document.querySelector("#bonusPoint").checked ? 1 : 0;
  const capRules = activeRules.filter((rule) => rule.cap);
  const cap = capRules.length ? Math.min(...capRules.map((rule) => rule.cap)) : null;
  const scoreWithoutCap = Math.min(type.max, type.max - rawDeduct + bonus);
  const cappedBonus = Math.max(0, scoreWithoutCap - (type.max - rawDeduct));
  let score = scoreWithoutCap;

  if (cap !== null) {
    score = Math.min(score, cap);
  }

  return {
    workTitle: document.querySelector("#workTitle").value.trim(),
    author: document.querySelector("#author").value.trim(),
    sourcePlatform: document.querySelector("#sourcePlatform").value.trim(),
    workTypeValue: new FormData(els.form).get("workType"),
    type,
    activeRules,
    rawDeduct,
    bonus,
    cappedBonus,
    cap,
    score,
    overallNote: document.querySelector("#overallNote").value.trim(),
  };
}

function buildStoredState() {
  return {
    workTitle: document.querySelector("#workTitle").value,
    author: document.querySelector("#author").value,
    sourcePlatform: document.querySelector("#sourcePlatform").value,
    workType: new FormData(els.form).get("workType") || "as",
    bonusPoint: document.querySelector("#bonusPoint").checked,
    overallNote: document.querySelector("#overallNote").value,
    rules: rules.map((rule) => {
      return {
        id: rule.id,
        checked: document.querySelector(`[data-check="${rule.id}"]`).checked,
        note: document.querySelector(`[data-note="${rule.id}"]`).value,
      };
    }),
    savedAt: new Date().toISOString(),
  };
}

function saveFormState() {
  if (isRestoring) return;
  try {
    const payload = buildStoredState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (els.saveStatus) {
      const time = new Date(payload.savedAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      els.saveStatus.textContent = `已自动保存到当前浏览器（${time}）。换浏览器或换手机不会同步。`;
    }
  } catch {
    if (els.saveStatus) {
      els.saveStatus.textContent = "当前浏览器未允许自动保存（可能为无痕模式）。";
    }
  }
}

function restoreFormState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    isRestoring = true;
    document.querySelector("#workTitle").value = saved.workTitle || "";
    document.querySelector("#author").value = saved.author || "";
    document.querySelector("#sourcePlatform").value = saved.sourcePlatform || "";
    document.querySelector("#overallNote").value = saved.overallNote || "";
    document.querySelector("#bonusPoint").checked = Boolean(saved.bonusPoint);

    const typeInput = document.querySelector(`input[name="workType"][value="${saved.workType || "as"}"]`);
    if (typeInput) typeInput.checked = true;

    (saved.rules || []).forEach((savedRule) => {
      const check = document.querySelector(`[data-check="${savedRule.id}"]`);
      const note = document.querySelector(`[data-note="${savedRule.id}"]`);
      if (check) check.checked = Boolean(savedRule.checked);
      if (note) note.value = savedRule.note || "";
    });

    if (els.saveStatus && saved.savedAt) {
      const time = new Date(saved.savedAt).toLocaleString("zh-CN");
      els.saveStatus.textContent = `已恢复上次保存内容（${time}）。`;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  } finally {
    isRestoring = false;
  }
}

function buildReport(state) {
  const title = state.workTitle || "未填写";
  const author = state.author || "未填写";
  const sourcePlatform = state.sourcePlatform || "未填写";
  const filledRules = state.activeRules;
  const filledNumbers = filledRules.map(ruleNumber);

  const lines = ["【已填写项目摘要】"];

  if (state.overallNote) {
    lines.push(`总评备注：${state.overallNote}`, "");
  }

  lines.push(
    `作品名称：${title}`,
    `作者：${author}`,
    `来源平台：${sourcePlatform}`,
    `分类：${state.type.label}（上限 ${state.type.max} 分）`,
    `当前得分：${state.score} 分`,
    `加分：${state.cappedBonus ? `+${state.cappedBonus}` : "0"}`,
    `扣分：${state.rawDeduct ? `-${state.rawDeduct}` : "0"}`,
    `限制项：${state.cap === null ? "无" : `题11，总分≤${state.cap}`}`,
    `已填写题号：${filledNumbers.length ? filledNumbers.join("、") : "无"}`,
  );

  if (state.bonus) {
    lines.push("加分项：从女男平等发展为全女");
  }

  return lines.join("\n");
}

function update() {
  const state = collectState();

  document.querySelectorAll(".rule-card").forEach((card) => {
    const ruleId = card.dataset.rule;
    const checked = document.querySelector(`[data-check="${ruleId}"]`).checked;
    card.dataset.active = String(checked);
  });
  document.querySelectorAll(".type-picker label").forEach((label) => {
    const input = label.querySelector("input");
    label.classList.toggle("is-selected", Boolean(input && input.checked));
  });
  document.querySelector(".bonus-card")?.setAttribute("data-active", String(Boolean(state.bonus)));

  els.finalScore.textContent = state.score;
  els.scoreHint.textContent = `${state.type.label}上限 ${state.type.max} 分`;
  els.sideScore.textContent = state.score;
  els.mobileScore.textContent = state.score;
  els.mobileDeduct.textContent = state.rawDeduct ? `-${state.rawDeduct}` : "0";
  els.baseScore.textContent = state.type.max;
  els.bonusScore.textContent = state.cappedBonus ? `+${state.cappedBonus}` : "0";
  els.deductScore.textContent = state.rawDeduct ? `-${state.rawDeduct}` : "0";
  els.capScore.textContent = state.cap === null ? "无" : `≤${state.cap}`;
  els.report.value = buildReport(state);
  saveFormState();

  return state;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/[\\/:*?"<>|]/g, "_");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[\\/:*?"<>|]/g, "_");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function wrapText(ctx, text, maxWidth) {
  const normalized = String(text || "").replace(/\r/g, "");
  const lines = [];

  normalized.split("\n").forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }

    let line = "";
    Array.from(paragraph).forEach((char) => {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    });
    lines.push(line);
  });

  return lines;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawLines(ctx, lines, x, firstBaseline, lineHeight, color) {
  ctx.fillStyle = color;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, firstBaseline + index * lineHeight);
  });
}

const IMG_COLORS = {
  dark: "#20212A",
  muted: "#7D7A84",
  faint: "#AAA7B0",
  scoreRed: "#D72638",
  // 扣分 / 总评：红
  red: "#D72638",
  redSoft: "#FFFFFF",
  redTint: "#FFF1F0",
  redLine: "#EED8D6",
  bannerBg: "#FFFDFC",
  bannerText: "#8A2E36",
  // 结构 / 备注：紫
  line: "#7B4A86",
  purple: "#7B3FA1",
  purpleSoft: "#F6EFFA",
  purplePale: "#FDFBFF",
  purpleLine: "#E4D6EA",
  // 加分：绿
  green: "#3D9A55",
  greenSoft: "#FFFFFF",
  greenLine: "#D9E8DD",
  // 限制项：橙
  orange: "#C97925",
  orangeSoft: "#FFFFFF",
  orangeLine: "#EADCC8",
  graySoft: "#FFFFFF",
  grayLine: "#E7E0EA",
  badgeBg: "#EFEEF1",
  bar: "#CFCBD6",
  noteText: "#7B3FA1", // 备注：紫色
};

const FONT_FAMILY =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function buildSplitRows(state) {
  const selected = [];
  const unselected = [];

  selected.push({
    kind: "type",
    qid: "分类",
    value: `上限${state.type.max}分`,
    title: `作品分类：${state.type.label}`,
    note: state.type.description,
    isChecked: true,
  });

  const bonusRow = {
    kind: "bonus",
    qid: "加分",
    value: state.bonus ? `✓ +${state.cappedBonus || 0}分` : "未加分",
    title: "从女男平等发展为全女，可加一分。不超过上限。",
    note: "",
    isChecked: Boolean(state.bonus),
  };
  if (state.bonus) selected.push(bonusRow);
  else unselected.push(bonusRow);

  rules.forEach((rule) => {
    const card = document.querySelector(`.rule-card[data-rule="${rule.id}"]`);
    const isChecked = card && card.dataset.active === "true";
    const noteInput = card ? card.querySelector(".evidence textarea") : null;
    const note = noteInput ? noteInput.value.trim() : "";
    const isCap = rule.cap !== undefined;
    const kind = isCap ? "cap" : "deduct";
    let value;
    if (isCap) value = isChecked ? `限制≤${rule.cap}` : "○ 0";
    else value = isChecked ? `✂︎ -${rule.points}分` : "○ 0";

    const row = {
      kind,
      qid: `Q${ruleNumber(rule)}`,
      value,
      title: rule.text,
      note,
      isChecked,
    };

    if (isChecked || note) selected.push(row);
    else unselected.push(row);
  });

  return { selected, unselected };
}

function renderCard(state, rows, config) {
  const width = 920;
  const scale = 2;
  const padding = 44;
  const contentWidth = width - padding * 2;
  const scoreBlockWidth = 200;
  const qidWidth = 88;
  const compact = config.variant !== "selected";
  const valueWidth = compact ? 116 : 132;
  const qidX = padding + 28;
  const textX = padding + qidWidth + 30;
  const valueX = width - padding - valueWidth - (compact ? 20 : 14);
  const rowTextWidth = valueX - textX - (compact ? 28 : 22);
  const rowGap = 12;
  const c = IMG_COLORS;
  const ff = FONT_FAMILY;
  const showMeta = !compact;
  const showScore = !compact;
  const showSummary = !compact;
  const showBanner = Boolean(config.overallNote) && !compact;
  const showFooter = !compact;
  const scoreColor = c.scoreRed;
  const footerText =
    "以上减分情节楼主应当排雷；若未排雷，组员指出应当接受补充。打分表来源：世界全女联盟打分表。";

  const now = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const titleText = `《${state.workTitle || "未填写作品名称"}》`;
  const titleFont = compact ? `800 30px ${ff}` : `900 38px ${ff}`;
  const titleLH = compact ? 40 : 46;
  const titleAreaWidth = compact ? contentWidth : contentWidth - scoreBlockWidth - 20;
  ctx.font = titleFont;
  const titleLines = wrapText(ctx, titleText, titleAreaWidth);
  const titleH = titleLines.length * titleLH;

  let metaLines = [];
  let metaH = 0;
  if (showMeta) {
    ctx.font = `18px ${ff}`;
    const metaLine1 = `作者：${state.author || "未填写"}　来源平台：${state.sourcePlatform || "未填写"}`;
    const metaLine2 = `分类：${state.type.label}（上限${state.type.max}分）`;
    metaLines = wrapText(ctx, metaLine1, titleAreaWidth).concat(wrapText(ctx, metaLine2, titleAreaWidth));
    metaH = metaLines.length * 26;
  }

  const chipH = 36;
  const headerContentH = compact ? titleH + 14 + chipH : Math.max(titleH + 12 + metaH + 14 + chipH, 104);

  let bannerLines = [];
  let bannerH = 0;
  if (showBanner) {
    ctx.font = `650 20px ${ff}`;
    bannerLines = wrapText(ctx, config.overallNote, contentWidth - 64);
    bannerH = 20 + 30 + 10 + bannerLines.length * 30 + 22;
  }

  const summaryH = showSummary ? 112 : 0;

  const rowMeta = rows.map((row) => {
    const hasSub = Boolean(row.note);
    const active = row.isChecked || hasSub || row.kind === "type";
    const lh = active ? 31 : 26;

    ctx.font = active ? `800 22px ${ff}` : `600 18px ${ff}`;
    const tLines = wrapText(ctx, row.title, rowTextWidth);

    let sLines = [];
    if (hasSub) {
      ctx.font = row.kind === "type" ? `600 14px ${ff}` : `700 17px ${ff}`;
      sLines = wrapText(ctx, row.kind === "type" ? row.note : `备注　${row.note}`, rowTextWidth);
    }

    let h = 14 + tLines.length * lh;
    if (hasSub) h += sLines.length * (row.kind === "type" ? 21 : 26) + 8;
    h += 14;
    h = Math.max(h, hasSub ? 76 : active ? 64 : 52);

    return { height: h, active, titleLH: lh, tLines, sLines, hasSub };
  });

  let footerLines = [];
  let footerH = 0;
  if (showFooter) {
    ctx.font = `15px ${ff}`;
    footerLines = wrapText(ctx, footerText, contentWidth);
    footerH = footerLines.length * 23;
  }

  let total = padding + headerContentH + 16;
  total += 18;
  if (showBanner) total += bannerH + 18;
  if (showSummary) total += summaryH + 18;
  total += 6;
  rowMeta.forEach((m) => {
    total += m.height + rowGap;
  });
  if (showFooter) total += footerH + 12;
  total += padding;
  const totalHeight = total;

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(totalHeight * scale);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  ctx.textAlign = "left";

  ctx.font = titleFont;
  drawLines(ctx, titleLines, padding, padding + (compact ? 30 : 34), titleLH, c.dark);

  if (showMeta) {
    ctx.font = `18px ${ff}`;
    drawLines(ctx, metaLines, padding, padding + titleH + 12 + 18, 26, c.muted);
  }

  const chipTop = compact ? padding + titleH + 14 : padding + titleH + 12 + metaH + 14;
  ctx.font = `800 16px ${ff}`;
  const chipTextW = ctx.measureText(config.tag).width;
  const chipW = chipTextW + 28;
  roundRect(ctx, padding, chipTop, chipW, chipH, 10);
  ctx.fillStyle = compact ? c.badgeBg : c.purpleSoft;
  ctx.fill();
  ctx.fillStyle = compact ? c.muted : c.purple;
  ctx.fillText(config.tag, padding + 14, chipTop + chipH / 2 + 6);

  if (showScore) {
    ctx.textAlign = "right";
    ctx.fillStyle = scoreColor;
    ctx.font = `900 62px ${ff}`;
    ctx.fillText(`${state.score} 分`, width - padding, padding + 90);
    ctx.textAlign = "left";
  }

  let y = padding + headerContentH + 16;
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 18;

  if (showBanner) {
    roundRect(ctx, padding, y, contentWidth, bannerH, 14);
    ctx.fillStyle = c.bannerBg;
    ctx.fill();
    ctx.fillStyle = c.red;
    roundRect(ctx, padding, y, 4, bannerH, 2);
    ctx.fill();
    ctx.fillStyle = c.red;
    ctx.font = `850 20px ${ff}`;
    ctx.fillText("◆ 总评 · 必读", padding + 24, y + 32);
    ctx.font = `650 20px ${ff}`;
    drawLines(ctx, bannerLines, padding + 24, y + 68, 30, c.bannerText);
    y += bannerH + 18;
  }

  if (showSummary) {
    roundRect(ctx, padding, y, contentWidth, summaryH, 14);
    ctx.fillStyle = c.purplePale;
    ctx.fill();
    ctx.strokeStyle = c.purpleLine;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = c.purple;
    ctx.font = `850 20px ${ff}`;
    ctx.fillText("本节 / 汇总", padding + 20, y + 32);

    const summaryItems = [
      ["分类上限", `${state.type.max}分`],
      ["加分", state.cappedBonus ? `+${state.cappedBonus}` : "0"],
      ["扣分", state.rawDeduct ? `-${state.rawDeduct}` : "0"],
      ["限制项", state.cap === null ? "无" : `≤${state.cap}`],
      ["最终得分", `${state.score}分`],
    ];
    const itemWidth = (contentWidth - 44) / summaryItems.length;
    summaryItems.forEach(([label, value], index) => {
      const x = padding + 22 + itemWidth * index;
      ctx.fillStyle = c.muted;
      ctx.font = `15px ${ff}`;
      ctx.fillText(label, x, y + 68);
      let valueColor = c.dark;
      if (label === "最终得分" || label === "扣分") valueColor = c.scoreRed;
      if (label === "限制项") valueColor = c.orange;
      ctx.fillStyle = valueColor;
      ctx.font = `850 22px ${ff}`;
      ctx.fillText(value, x, y + 96);
    });
    y += summaryH + 24;
  }

  y += 6;

  rows.forEach((row, index) => {
    const m = rowMeta[index];
    const rowHeight = m.height;
    const active = m.active;
    const isBonus = row.kind === "bonus" && row.isChecked;
    const isCap = row.kind === "cap" && row.isChecked;
    const isDeduct = row.kind === "deduct" && row.isChecked;

    let fill = active ? "#FFFFFF" : c.graySoft;
    let stroke = c.grayLine;
    if (row.kind === "type") {
      fill = "#FFFFFF";
      stroke = c.purpleLine;
    } else if (isBonus) {
      fill = "#FFFFFF";
      stroke = c.grayLine;
    } else if (isCap) {
      fill = "#FFFFFF";
      stroke = c.grayLine;
    } else if (isDeduct) {
      fill = c.redSoft;
      stroke = c.redLine;
    }

    roundRect(ctx, padding, y, contentWidth, rowHeight, 12);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = active ? 1.6 : 1;
    ctx.stroke();

    // 左侧色条
    let barColor = "#D8D4DE";
    let barWidth = 4;
    if (row.kind === "type") {
      barColor = c.purple;
      barWidth = 7;
    } else if (isDeduct) {
      barColor = c.scoreRed;
      barWidth = 8;
    } else if (isCap) {
      barColor = c.orange;
      barWidth = 6;
    } else if (isBonus) {
      barColor = c.green;
      barWidth = 6;
    }
    ctx.fillStyle = barColor;
    roundRect(ctx, padding + 1, y + 1, barWidth, rowHeight - 2, 3);
    ctx.fill();

    // 题号徽章（紫色）
    const badgeY = y + (rowHeight - 36) / 2;
    roundRect(ctx, qidX, badgeY, qidWidth - 26, 36, 9);
    ctx.fillStyle = "#FAF6FC";
    ctx.fill();
    ctx.strokeStyle = "#E9DDED";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = c.purple;
    ctx.font = `900 16px ${ff}`;
    ctx.textAlign = "center";
    ctx.fillText(row.qid, qidX + (qidWidth - 26) / 2, badgeY + 23);
    ctx.textAlign = "left";

    // 分值徽章
    drawValueBadge(ctx, row, valueX, badgeY, valueWidth, 36);

    // 标题
    ctx.font = active ? `800 22px ${ff}` : `600 18px ${ff}`;
    const titleColor = active ? c.dark : "#8F8A96";
    let cursor = y + 14;
    drawLines(ctx, m.tLines, textX, cursor + m.titleLH - 8, m.titleLH, titleColor);
    cursor += m.tLines.length * m.titleLH;

    // 分类说明 / 备注（统一紫色行内显示）
    if (m.hasSub && row.kind === "type") {
      ctx.font = `600 14px ${ff}`;
      drawLines(ctx, m.sLines, textX, cursor + 6 + 14, 21, "#68636F");
    } else if (m.hasSub) {
      ctx.font = `700 17px ${ff}`;
      drawLines(ctx, m.sLines, textX, cursor + 6 + 17, 26, c.noteText);
    }

    y += rowHeight + rowGap;
  });

  if (showFooter) {
    ctx.font = `15px ${ff}`;
    drawLines(ctx, footerLines, padding, y + 8, 23, c.faint);
  }

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  return {
    blob: dataUrlToBlob(dataUrl),
    dataUrl,
  };
}

function drawValueBadge(ctx, row, x, y, w, h) {
  const c = IMG_COLORS;
  const ff = FONT_FAMILY;
  const active = row.isChecked;
  let fill = "#F5F4F7";
  let text = c.faint;
  let stroke = "#E2DFE7";
  if (row.kind === "type") {
    fill = c.purpleSoft;
    text = c.purple;
    stroke = c.purpleLine;
  } else if (row.kind === "bonus" && active) {
    fill = "#F1FAF4";
    text = c.green;
    stroke = c.greenLine;
  } else if (row.kind === "cap" && active) {
    fill = "#FFF7E8";
    text = c.orange;
    stroke = c.orangeLine;
  } else if (row.kind === "deduct" && active) {
    fill = c.redTint;
    text = c.red;
    stroke = c.redLine;
  } else if (row.kind === "note") {
    fill = c.purpleSoft;
    text = c.purple;
    stroke = c.purpleLine;
  }

  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.font = row.value.length > 6 ? `800 15px ${ff}` : `800 19px ${ff}`;
  ctx.textAlign = "center";
  ctx.fillText(row.value, x + w / 2, y + h / 2 + 6.5);
  ctx.textAlign = "left";
}

function isInAppWebView() {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("micromessenger") ||
    ua.includes("douban") ||
    ua.includes("qq/") ||
    ua.includes("dingtalk") ||
    ua.includes("wxwork")
  );
}

function isMobileBrowser() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.matchMedia("(max-width: 640px)").matches;
}

function clearExportImages() {
  exportImages.forEach((img) => {
    if (img.url) URL.revokeObjectURL(img.url);
  });
  exportImages = [];
}

function showExportModal(images) {
  clearExportImages();
  exportImages = images.map((img) => ({ ...img, url: URL.createObjectURL(img.blob) }));

  els.imageList.innerHTML = exportImages
    .map(
      (img, i) => `
      <figure class="export-figure">
        <figcaption><span class="fig-tag">${img.label}</span><span class="fig-hint">手机请长按图片保存原图，电脑可点下方按钮下载</span></figcaption>
        <img src="${img.dataUrl}" alt="${img.label}" />
        <div class="figure-actions">
          <a class="dl" href="${img.dataUrl}" download="${img.filename}" target="_blank" rel="noopener">打开/下载这张</a>
          <button type="button" class="copy" data-index="${i}">复制</button>
        </div>
      </figure>`,
    )
    .join("");

  els.imageModal.classList.add("show");
  els.imageModal.setAttribute("aria-hidden", "false");
}

async function exportImage(event) {
  const state = collectState();
  const triggerBtns = [els.exportImageBtn, els.mobileSaveBtn, els.printBtn].filter(Boolean);
  const originals = triggerBtns.map((b) => b.innerHTML);
  triggerBtns.forEach((b) => {
    b.disabled = true;
  });
  if (els.exportImageBtn) els.exportImageBtn.textContent = "生成中...";

  try {
    const { selected, unselected } = buildSplitRows(state);
    const base = (state.workTitle || "文艺作品").replace(/[\\/:*?"<>|]/g, "_");
    const images = [];

    const selectedImage = renderCard(state, selected, {
      variant: "selected",
      tag: "① 扣分题目",
      overallNote: state.overallNote,
    });
    if (selectedImage) {
      images.push({
        blob: selectedImage.blob,
        dataUrl: selectedImage.dataUrl,
        label: "① 扣分与备注",
        filename: `${base}-打分-扣分.jpg`,
      });
    }

    if (unselected.length) {
      const unselectedImage = renderCard(state, unselected, {
        variant: "unselected",
        tag: "② 未扣分题目（参考）",
        overallNote: "",
      });
      if (unselectedImage) {
        images.push({
          blob: unselectedImage.blob,
          dataUrl: unselectedImage.dataUrl,
          label: "② 未扣分（参考）",
          filename: `${base}-打分-未扣分.jpg`,
        });
      }
    }

    if (!images.length) return;
    showExportModal(images);
    const triggeredByMobileButton = event?.currentTarget === els.mobileSaveBtn;
    const canAutoDownload = !triggeredByMobileButton && !isMobileBrowser() && !isInAppWebView();
    if (canAutoDownload) {
      images.forEach((img) => downloadDataUrl(img.dataUrl, img.filename));
    }
  } finally {
    triggerBtns.forEach((b, i) => {
      b.disabled = false;
      b.innerHTML = originals[i];
    });
  }
}

async function copyImageByIndex(index, button) {
  const img = exportImages[index];
  if (!img || !navigator.clipboard || !window.ClipboardItem) {
    button.textContent = "请长按图片保存";
    setTimeout(() => {
      button.textContent = "复制";
    }, 1500);
    return;
  }

  try {
    await navigator.clipboard.write([new ClipboardItem({ [img.blob.type]: img.blob })]);
    button.textContent = "已复制 ✓";
  } catch {
    button.textContent = "请长按图片保存";
  }

  setTimeout(() => {
    button.textContent = "复制";
  }, 1500);
}

function closeImageModal() {
  els.imageModal.classList.remove("show");
  els.imageModal.setAttribute("aria-hidden", "true");
}

function resetForm(clearSaved = true) {
  isRestoring = Boolean(clearSaved);
  els.form.reset();
  document.querySelectorAll("[data-note]").forEach((note) => {
    note.value = "";
  });
  if (clearSaved) {
    localStorage.removeItem(STORAGE_KEY);
    if (els.saveStatus) {
      els.saveStatus.textContent = "已清空，浏览器内保存也已删除。";
    }
  }
  update();
  isRestoring = false;
}

function confirmAndReset() {
  if (window.confirm("确定要清空当前填写内容吗？此操作不可撤销。")) {
    resetForm(true);
  }
}

function toggleCardCheckbox(event) {
  if (event.target.closest("input, textarea, button, a, label")) return;

  const card = event.target.closest(".rule-card, .bonus-card");
  if (!card) return;

  const checkbox = card.querySelector('input[type="checkbox"]');
  if (!checkbox) return;

  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
}

// 核心初始化流
renderRules();
restoreFormState();
els.form.addEventListener("input", update);
els.form.addEventListener("change", update);
els.rules.addEventListener("click", toggleCardCheckbox);
document.querySelector(".bonus-card")?.addEventListener("click", toggleCardCheckbox);
els.exportImageBtn.addEventListener("click", exportImage);
els.mobileSaveBtn.addEventListener("click", exportImage);
els.clearBtn.addEventListener("click", confirmAndReset);
els.mobileClearBtn.addEventListener("click", confirmAndReset);
els.printBtn.addEventListener("click", exportImage);
els.closeImageModal.addEventListener("click", closeImageModal);
els.imageModal.addEventListener("click", (event) => {
  if (event.target === els.imageModal) closeImageModal();
});
els.imageList.addEventListener("click", (event) => {
  const button = event.target.closest("button.copy");
  if (button) copyImageByIndex(Number(button.dataset.index), button);
});
update();
