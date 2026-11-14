// 站点交互：主题切换、回到顶部、图片兜底。
// 原生 ES2020，不依赖任何库。首页 / 关于 / 404 共用。
(() => {
    "use strict";

    const THEME_KEY = "color-scheme";
    const themeToggle = document.getElementById("theme-toggle");
    const metaScheme = document.querySelector('meta[name="color-scheme"]');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    const isDark = () => {
        if (document.body.classList.contains("io-black-mode")) return true;
        if (document.body.classList.contains("io-grey-mode")) return false;
        return metaScheme?.content === "dark";
    };

    // 图标由 body 上的 io-black-mode / io-grey-mode 决定（见 desk.css），这里不再改图标 class
    const applyTheme = (scheme) => {
        const dark = scheme === "dark";
        document.body.classList.toggle("io-black-mode", dark);
        document.body.classList.toggle("io-grey-mode", !dark);
        if (metaScheme) metaScheme.content = scheme;
        if (metaThemeColor) metaThemeColor.content = dark ? "#111111" : "#f9f9f9";
        if (themeToggle) {
            themeToggle.setAttribute("aria-pressed", String(dark));
            themeToggle.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
        }
    };

    themeToggle?.addEventListener("click", () => {
        const next = isDark() ? "light" : "dark";
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (_) { /* 存储被禁用时仍然切换当前页面 */ }
        applyTheme(next);
    });

    window.addEventListener("storage", (event) => {
        if (event.key === THEME_KEY && (event.newValue === "light" || event.newValue === "dark")) {
            applyTheme(event.newValue);
        }
    });

    applyTheme(isDark() ? "dark" : "light");

    // 图片加载失败时回退到 data-fallback 指向的默认 logo（监听在 desk_boot.html 预先挂好）

    // 右下角「回到顶部」：滚动超过一屏再出现。缓动自己算，时长封顶，可被用户滚动打断。
    const topButton = document.querySelector("[data-desk-top]");
    if (topButton) {
        const syncTopButton = () => {
            const show = window.scrollY > 360;
            if (topButton.hidden === !show) return;
            topButton.hidden = !show;
            topButton.classList.toggle("is-on", show);
        };
        window.addEventListener("scroll", syncTopButton, { passive: true });
        syncTopButton();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        let cancelScroll = null;
        const scrollToTop = () => {
            const start = window.scrollY;
            if (start <= 0) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                window.scrollTo(0, 0);
                return;
            }
            const root = document.documentElement;
            const previousBehavior = root.style.scrollBehavior;
            root.style.scrollBehavior = "auto";
            const duration = Math.min(420, 200 + start * 0.08);
            const startedAt = performance.now();
            const finish = (snapToTop) => {
                if (cancelScroll === null) return;
                cancelScroll = null;
                window.removeEventListener("wheel", cancel);
                window.removeEventListener("touchstart", cancel);
                root.style.scrollBehavior = previousBehavior;
                if (snapToTop) window.scrollTo(0, 0);
            };
            const cancel = () => finish(false);
            const step = (now) => {
                if (cancelScroll !== step) return;
                const progress = Math.min(1, (now - startedAt) / duration);
                window.scrollTo(0, Math.round(start * (1 - easeOutCubic(progress))));
                if (progress < 1) requestAnimationFrame(step);
                else finish(true);
            };
            cancelScroll = step;
            window.addEventListener("wheel", cancel, { passive: true });
            window.addEventListener("touchstart", cancel, { passive: true });
            requestAnimationFrame(step);
        };
        topButton.addEventListener("click", () => {
            scrollToTop();
            topButton.blur();
        });
    }
})();
