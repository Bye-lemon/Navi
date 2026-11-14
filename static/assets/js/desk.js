// 首页索引台（方向 A）：即时过滤、命中高亮、键盘操作与分类滚动联动。
// 原生 ES2020，不依赖 jQuery。
(() => {
    "use strict";

    const desk = document.getElementById("desk");
    if (!desk) return;

    const input = document.getElementById("desk-filter");
    const clearBtn = desk.querySelector("[data-desk-clear]");
    const countEl = document.getElementById("desk-count");
    const hintEl = desk.querySelector("[data-desk-hint]");
    const emptyEl = desk.querySelector(".desk-empty");
    const emptySearch = emptyEl?.querySelector("[data-desk-empty-search]");
    const emptyQuery = emptyEl?.querySelector("[data-desk-empty-query]");

    const rows = Array.from(desk.querySelectorAll(".desk-row"));
    const sections = Array.from(desk.querySelectorAll(".desk-section"));
    const subs = Array.from(desk.querySelectorAll(".desk-subsection"));
    const railGroups = Array.from(desk.querySelectorAll(".desk-group-link[data-group]"));
    const railSubs = Array.from(desk.querySelectorAll(".desk-sub a[data-term]"));

    // ---- 搜索引擎（与站内筛选共用同一个输入框）----
    const engineToggle = desk.querySelector("[data-engine-toggle]");
    const engineMenu = desk.querySelector("[data-engine-menu]");
    const engineName = desk.querySelector("[data-engine-name]");
    const engineItems = Array.from(desk.querySelectorAll(".em-item"));
    const emSearch = desk.querySelector("[data-engine-search]");
    const emptyEngine = desk.querySelector("[data-desk-empty-engine]");
    const ENGINE_KEY = "desk-search-engine";
    let engine = { name: "谷歌", url: "https://www.google.com/search?q=", copy: false };

    try {
        const saved = JSON.parse(localStorage.getItem(ENGINE_KEY) || "null");
        if (saved && typeof saved.name === "string" && typeof saved.url === "string") {
            engine = { name: saved.name, url: saved.url, copy: saved.copy === true };
        }
    } catch (_) { /* 存储被禁用时退回默认引擎 */ }

    function applyEngine(next, persist) {
        engine = next;
        if (engineName) engineName.textContent = engine.name;
        if (emptyEngine) emptyEngine.textContent = engine.name;
        for (const item of engineItems) {
            item.setAttribute("aria-selected", String(item.dataset.engineName === engine.name));
        }
        if (persist) {
            try { localStorage.setItem(ENGINE_KEY, JSON.stringify(engine)); } catch (_) { /* 忽略 */ }
        }
    }
    applyEngine(engine, false);

    const toast = desk.querySelector("[data-desk-toast]");
    let toastTimer = 0;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.hidden = false;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
    }

    function fallbackCopy(text) {
        try {
            const area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.top = "-9999px";
            document.body.append(area);
            area.select();
            const ok = document.execCommand("copy");
            area.remove();
            return ok;
        } catch (_) {
            return false;
        }
    }

    function webSearch(value) {
        const query = (value || "").trim();
        if (!query) return;
        if (engine.copy) {
            // DeepSeek 这类站点不接受把查询放进 URL：先把关键词放进剪贴板，再打开站点
            const okMessage = "已复制「" + query + "」，粘贴到 " + engine.name + " 发送即可";
            const failMessage = "打开 " + engine.name + " 后粘贴「" + query + "」发送";
            showToast(okMessage);
            const clip = navigator.clipboard;
            if (clip && window.isSecureContext) {
                // 复制被拒绝时把提示改成手动粘贴的说法，不让界面停在“已复制”
                clip.writeText(query).catch(() => {
                    if (!fallbackCopy(query)) showToast(failMessage);
                });
            } else if (!fallbackCopy(query)) {
                showToast(failMessage);
            }
            window.open(engine.url, "_blank", "noopener,noreferrer");
            return;
        }
        window.open(engine.url + encodeURIComponent(query), "_blank", "noopener,noreferrer");
    }

    function engineRow() {
        if (!emSearch) return;
        const query = (input?.value || "").trim();
        emSearch.hidden = !query;
        if (!query) {
            emSearch.textContent = "";
            return;
        }
        emSearch.textContent = engine.copy
            ? "打开「" + engine.name + "」并复制「" + query + "」"
            : "用「" + engine.name + "」搜「" + query + "」";
    }

    function closeMenu() {
        if (!engineMenu) return;
        engineMenu.hidden = true;
        engineToggle?.setAttribute("aria-expanded", "false");
    }

    if (engineToggle && engineMenu) {
        engineToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const open = engineMenu.hidden;
            engineMenu.hidden = !open;
            engineToggle.setAttribute("aria-expanded", String(open));
            if (open) (engineMenu.querySelector('[aria-selected="true"]') || engineMenu.querySelector(".em-item"))?.focus();
        });
        document.addEventListener("pointerdown", (event) => {
            if (engineMenu.hidden) return;
            if (engineMenu.contains(event.target) || engineToggle.contains(event.target)) return;
            closeMenu();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape" || engineMenu.hidden) return;
            closeMenu();
            engineToggle.focus();
        });
        engineMenu.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            const items = Array.from(engineMenu.querySelectorAll(".em-item, [data-engine-search]:not([hidden])"));
            const at = items.indexOf(document.activeElement);
            event.preventDefault();
            const next = event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
            items[next]?.focus();
        });
    }
    for (const item of engineItems) {
        item.addEventListener("click", () => {
            applyEngine({
                name: item.dataset.engineName,
                url: item.dataset.engineUrl,
                copy: item.dataset.engineCopy === "true"
            }, true);
            closeMenu();
            apply(input?.value || "");
            input?.focus();
        });
    }
    emSearch?.addEventListener("click", () => {
        webSearch(input?.value);
        closeMenu();
    });
    emptySearch?.addEventListener("click", () => webSearch(input?.value));

    // 首屏前 14 行错峰入场，其余按 0 延迟（只在加载时跑一次）
    rows.slice(0, 14).forEach((row, index) => {
        row.style.setProperty("--d", (index * 20) + "ms");
    });

    // 浮动按钮在 #desk 之外，按文档查
    document.querySelectorAll("[data-search-open]").forEach((button) => {
        button.addEventListener("click", () => {
            input?.focus();
            input?.select();
        });
    });

    const total = rows.length;
    const TOP_OFFSET = 56;
    const kbd = desk.querySelector("[data-kbd]");
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    if (kbd && !isMac) kbd.textContent = "Ctrl K";
    if (input && window.matchMedia("(max-width: 620px)").matches) {
        input.placeholder = "筛选或搜索网页";
    }
    const norm = (value) => (value || "").toLowerCase().trim();

    // 预存原始文案，供过滤后还原与高亮重建。
    const paintables = [];
    for (const row of rows) {
        row.dataset.haystack = norm([
            row.dataset.name,
            row.dataset.host,
            row.dataset.desc
        ].join(" "));
        for (const el of row.querySelectorAll(".r-name, .r-desc, .r-host")) {
            el.dataset.orig = el.textContent;
            paintables.push(el);
        }
    }

    // 计数：每个分组、子分组各一份，过滤时同步收敛。
    const groupCount = new Map();
    const subCount = new Map();
    for (const row of rows) {
        groupCount.set(row.dataset.group, (groupCount.get(row.dataset.group) || 0) + 1);
    }
    for (const row of rows) {
        subCount.set(row.dataset.term, (subCount.get(row.dataset.term) || 0) + 1);
    }

    const groupCountEls = new Map();
    for (const section of sections) {
        const el = section.querySelector(".desk-section-count");
        if (el) groupCountEls.set(section.dataset.group, el);
    }
    const subCountEls = new Map();
    for (const sub of subs) {
        const el = sub.querySelector(".desk-sub-head span");
        if (el) subCountEls.set(sub.dataset.term, el);
    }
    const railCountEls = new Map();
    for (const link of railGroups) {
        railCountEls.set(link.dataset.group, link.querySelector(".g-count"));
    }
    const railSubCountEls = new Map();
    for (const link of railSubs) {
        railSubCountEls.set(link.dataset.term, link.querySelector(".s-count"));
    }

    function paint(el, query) {
        const text = el.dataset.orig || "";
        if (!query) {
            if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3 || el.textContent !== text) {
                el.textContent = text;
            }
            return;
        }
        const lower = text.toLowerCase();
        // 大小写转换会改变长度时（极少数字符）放弃高亮，避免切错位置。
        if (lower.length !== text.length) {
            el.textContent = text;
            return;
        }
        let index = 0;
        let last = 0;
        let hits = 0;
        const fragment = document.createDocumentFragment();
        while ((index = lower.indexOf(query, last)) !== -1) {
            if (index > last) fragment.append(text.slice(last, index));
            const mark = document.createElement("mark");
            mark.textContent = text.slice(index, index + query.length);
            fragment.append(mark);
            last = index + query.length;
            hits += 1;
        }
        if (!hits) {
            el.textContent = text;
            return;
        }
        fragment.append(text.slice(last));
        el.textContent = "";
        el.append(fragment);
    }

    function setCount(el, shown, all, filtering) {
        if (!el) return;
        if (!filtering) {
            el.textContent = String(all);
            return;
        }
        el.textContent = String(shown);
        el.classList.toggle("is-zero", shown === 0);
    }

    let visibleRows = rows;

    function apply(query) {
        const q = norm(query);
        const filtering = q.length > 0;
        const shownGroups = new Map();
        const shownSubs = new Map();
        const matched = [];

        const revealed = [];
        for (const row of rows) {
            const hit = !filtering || row.dataset.haystack.includes(q);
            const wasHidden = row.hidden;
            row.hidden = !hit;
            if (!hit) continue;
            if (wasHidden && filtering) revealed.push(row);
            matched.push(row);
            shownGroups.set(row.dataset.group, (shownGroups.get(row.dataset.group) || 0) + 1);
            shownSubs.set(row.dataset.term, (shownSubs.get(row.dataset.term) || 0) + 1);
        }
        visibleRows = matched;

        for (const sub of subs) {
            const shown = shownSubs.get(sub.dataset.term) || 0;
            sub.hidden = shown === 0;
            setCount(subCountEls.get(sub.dataset.term), shown, subCount.get(sub.dataset.term) || 0, filtering);
        }
        for (const section of sections) {
            const shown = shownGroups.get(section.dataset.group) || 0;
            section.hidden = shown === 0;
            setCount(groupCountEls.get(section.dataset.group), shown, groupCount.get(section.dataset.group) || 0, filtering);
        }
        for (const link of railGroups) {
            const shown = shownGroups.get(link.dataset.group) || 0;
            const dim = filtering && shown === 0;
            setCount(railCountEls.get(link.dataset.group), shown, groupCount.get(link.dataset.group) || 0, filtering);
            link.classList.toggle("is-dim", dim);
            link.setAttribute("aria-disabled", String(dim));
            link.tabIndex = dim ? -1 : 0;
        }
        for (const link of railSubs) {
            const shown = shownSubs.get(link.dataset.term) || 0;
            const dim = filtering && shown === 0;
            setCount(railSubCountEls.get(link.dataset.term), shown, subCount.get(link.dataset.term) || 0, filtering);
            link.parentElement?.classList.toggle("is-dim", dim);
            link.setAttribute("aria-disabled", String(dim));
            link.tabIndex = dim ? -1 : 0;
        }

        for (const el of paintables) paint(el, filtering ? q : "");

        desk.classList.toggle("has-query", filtering);
        desk.classList.toggle("is-empty", matched.length === 0);
        if (countEl) {
            countEl.textContent = "";
            const strong = document.createElement("b");
            strong.textContent = String(filtering ? matched.length : total);
            countEl.append(strong);
            if (filtering) {
                const sep = document.createElement("span");
                sep.className = "c-sep";
                sep.textContent = " / ";
                countEl.append(sep, String(total));
            } else {
                countEl.append(" 条");
            }
        }

        if (emptyQuery) {
            emptyQuery.textContent = query.trim();
        }
        // 新出现的行闪一下，让“筛选变了”看得见；一次性出现很多行时不动画，避免抖动
        if (revealed.length && revealed.length <= 48) {
            for (const row of revealed) {
                row.classList.remove("is-flash");
                void row.offsetWidth;
                row.classList.add("is-flash");
            }
            window.setTimeout(() => {
                for (const row of revealed) row.classList.remove("is-flash");
            }, 320);
        }

        if (hintEl) {
            hintEl.textContent = filtering
                ? "Enter 打开第一条 · Shift+Enter 用「" + engine.name + "」搜网页"
                : "";
        }
        engineRow();

        spy();
    }

    // ---- 过滤输入 ----
    if (input) {
        input.addEventListener("input", () => {
            apply(input.value);
        });
        input.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                input.value = "";
                apply("");
                return;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                visibleRows[0]?.querySelector(".desk-row-link")?.focus();
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                if (!input.value.trim()) return;
                // Shift+Enter 总是在网页上搜；否则打开第一条站内结果，没有结果时退回网页搜索
                if (event.shiftKey) {
                    webSearch(input.value);
                    return;
                }
                const first = visibleRows[0]?.querySelector(".desk-row-link");
                if (first) window.open(first.href, "_blank", "noopener,noreferrer");
                else webSearch(input.value);
            }
        });
    }

    // 筛选状态下点到 0 命中的分类：先清掉筛选，再让它跳过去，不要静默失效
    for (const link of [...railGroups, ...railSubs]) {
      link.addEventListener("click", () => {
        if (!link.classList.contains("is-dim") && !link.parentElement?.classList.contains("is-dim")) return;
        if (input) input.value = "";
        apply("");
      });
    }

    clearBtn?.addEventListener("click", () => {
        if (!input) return;
        input.value = "";
        apply("");
        input.focus();
    });

    // ---- 行内键盘导航 ----
    desk.addEventListener("keydown", (event) => {
        const link = event.target.closest?.(".desk-row-link");
        if (!link) return;
        const links = visibleRows.map((row) => row.querySelector(".desk-row-link")).filter(Boolean);
        const current = links.indexOf(link);
        let next = -1;
        if (event.key === "ArrowDown") next = Math.min(current + 1, links.length - 1);
        else if (event.key === "ArrowUp") next = Math.max(current - 1, 0);
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = links.length - 1;
        else if (event.key === "Escape") {
            event.preventDefault();
            input?.focus();
            return;
        } else return;
        event.preventDefault();
        links[next]?.focus();
    });

    // ---- 全局快捷键 ----
    document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if ((event.metaKey || event.ctrlKey) && key === "k") {
            event.preventDefault();
            input?.focus();
            input?.select();
            return;
        }
        if (key === "/" && !event.metaKey && !event.ctrlKey) {
            const tag = document.activeElement?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            event.preventDefault();
            input?.focus();
        }
    });

    // ---- 分类滚动联动 ----
    const activeMap = new Map();
    for (const link of railGroups) activeMap.set(link.dataset.group, link);

    let spyTimer = 0;
    const subActiveMap = new Map();
    for (const link of railSubs) subActiveMap.set(link.dataset.term, link);

    function spy() {
        let current = null;
        for (const section of sections) {
            if (section.hidden) continue;
            const rect = section.getBoundingClientRect();
            if (rect.top - TOP_OFFSET <= 96) current = section;
        }
        if (!current) current = sections.find((section) => !section.hidden) || null;

        let currentSub = null;
        for (const sub of subs) {
            if (sub.hidden) continue;
            if (current && sub.closest(".desk-section") !== current) continue;
            const rect = sub.getBoundingClientRect();
            if (rect.top - TOP_OFFSET <= 96) currentSub = sub;
        }

        for (const link of railGroups) {
            link.classList.toggle("is-active", !!current && link.dataset.group === current.dataset.group);
        }
        for (const link of railSubs) {
            link.classList.toggle("is-active", !!currentSub && link.dataset.term === currentSub.dataset.term);
        }

        if (window.innerWidth > 960) return;
        // 窄屏：让当前分类 chip 留在可视区。
        // 这里不能再用 scrollIntoView —— 它会连带把文档一起平滑滚动，
        // 和滚动本身（以及返回顶部的动画）互相拉扯，长页面上就会慢到离谱。
        const active = current ? activeMap.get(current.dataset.group) : null;
        const rail = desk.querySelector(".desk-rail");
        if (!active || !rail) return;
        const railBox = rail.getBoundingClientRect();
        const chipBox = active.getBoundingClientRect();
        const margin = 20;
        if (chipBox.left >= railBox.left + margin && chipBox.right <= railBox.right - margin) return;
        if (rail.scrollWidth <= rail.clientWidth + 1) return;
        // 直接写 scrollLeft：不触发平滑动画，也不会和文档滚动互相干扰
        rail.scrollLeft = rail.scrollLeft + (chipBox.left - railBox.left) - margin;
    }

    // 用定时器节流而不是 rAF：后台标签页里 rAF 会被节流到不触发，滚动联动会停住。
    window.addEventListener("scroll", () => {
        if (spyTimer) return;
        spyTimer = window.setTimeout(() => {
            spyTimer = 0;
            spy();
        }, 40);
    }, { passive: true });

    apply(input?.value || "");
})();
