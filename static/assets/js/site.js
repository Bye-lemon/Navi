// 站点交互：主题切换、搜索对话框、图片兜底与滚动辅助。
// 原生 ES2020+，不依赖 jQuery；jQuery/Bootstrap 仅用于兼容旧侧边栏弹层。
(() => {
    "use strict";

    const THEME_KEY = "color-scheme";
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = themeToggle?.querySelector(".mode-ico");
    const metaScheme = document.querySelector('meta[name="color-scheme"]');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    const isDark = () => {
        if (document.body.classList.contains("io-black-mode")) return true;
        if (document.body.classList.contains("io-grey-mode")) return false;
        return metaScheme?.content === "dark";
    };

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
        if (themeIcon) {
            themeIcon.classList.toggle("icon-light", dark);
            themeIcon.classList.toggle("icon-night", !dark);
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

    // 搜索对话框：原生 <dialog>，Esc 关闭、焦点回收由浏览器处理。
    const dialog = document.getElementById("search-modal");
    if (dialog) {
        const focusSearch = () => dialog.querySelector('input[type="search"]')?.focus();

        document.querySelectorAll("[data-search-open]").forEach((button) => {
            button.addEventListener("click", () => {
                if (dialog.open) return;
                dialog.showModal();
                focusSearch();
            });
        });

        dialog.querySelectorAll("[data-search-close]").forEach((button) => {
            button.addEventListener("click", () => dialog.close());
        });

        // Safari 等尚未支持 closedby="any" 时，补上点击遮罩关闭。
        if (typeof HTMLDialogElement === "undefined" || !("closedBy" in HTMLDialogElement.prototype)) {
            const outside = (event) => {
                const rect = dialog.getBoundingClientRect();
                return event.clientX < rect.left || event.clientX > rect.right ||
                    event.clientY < rect.top || event.clientY > rect.bottom;
            };
            let pressedOutside = false;
            dialog.addEventListener("pointerdown", (event) => {
                pressedOutside = outside(event);
            });
            dialog.addEventListener("pointerup", (event) => {
                if (pressedOutside && outside(event)) dialog.close();
            });
        }
    }

    // 加载动画：保持原有视觉，改成原生实现。
    const loader = document.getElementById("loading");
    if (loader) {
        loader.classList.add("close");
        window.setTimeout(() => loader.remove(), 600);
    }

    // 移动端点击锚点后收起侧边栏；滚动本身交给 CSS scroll-behavior。
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a.smooth");
        if (!link) return;
        const sidebar = document.getElementById("sidebar");
        if (!sidebar?.classList.contains("show") || link.classList.contains("change-href")) return;
        if (window.jQuery?.fn?.modal) {
            window.jQuery(sidebar).modal("toggle");
        }
    });
})();
