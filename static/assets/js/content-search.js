// 百度搜索联想（原生 JS + JSONP）。
// 百度联想接口只提供 JSONP，因此这里保留脚本注入方式，但不依赖 jQuery。
(() => {
    "use strict";

    const input = document.getElementById("search-text");
    const list = document.getElementById("word");
    const form = input?.closest("form");
    if (!input || !list || !form) return;

    const searchRoot = input.closest(".s-search") ?? form;
    const DEBOUNCE_MS = 200;
    const TIMEOUT_MS = 5000;
    let timer = 0;
    let sequence = 0;
    let activeScript = null;

    const hide = () => {
        list.hidden = true;
        list.replaceChildren();
    };

    const jsonp = (url, callbackName) => new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timerId = window.setTimeout(() => {
            cleanup();
            reject(new Error("suggestion request timed out"));
        }, TIMEOUT_MS);

        function cleanup() {
            window.clearTimeout(timerId);
            delete window[callbackName];
            script.remove();
            if (activeScript === script) activeScript = null;
        }

        window[callbackName] = (data) => {
            cleanup();
            resolve(data);
        };
        script.onerror = () => {
            cleanup();
            reject(new Error("suggestion request failed"));
        };
        script.src = url;
        activeScript = script;
        document.head.append(script);
    });

    const render = (items) => {
        list.replaceChildren();
        items.slice(0, 9).forEach((text, index) => {
            const item = document.createElement("li");
            const rank = document.createElement("span");
            rank.textContent = String(index + 1);
            item.dataset.value = text;
            item.append(rank, document.createTextNode(text));
            list.append(item);
        });
        list.hidden = items.length === 0;
    };

    const request = async (keyword, currentSequence) => {
        const callbackName = `__baiduSug${Date.now()}_${currentSequence}`;
        try {
            const data = await jsonp(
                `https://suggestion.baidu.com/su?wd=${encodeURIComponent(keyword)}&cb=${callbackName}`,
                callbackName
            );
            if (currentSequence !== sequence) return;
            const items = Array.isArray(data?.s) ? data.s : [];
            render(items);
        } catch (_) {
            if (currentSequence === sequence) hide();
        }
    };

    input.addEventListener("input", () => {
        const keyword = input.value.trim();
        window.clearTimeout(timer);
        if (!keyword) {
            sequence += 1;
            hide();
            return;
        }
        timer = window.setTimeout(() => {
            request(keyword, ++sequence);
        }, DEBOUNCE_MS);
    });

    list.addEventListener("click", (event) => {
        const item = event.target.closest("li");
        if (!item || !item.dataset.value) return;
        input.value = item.dataset.value;
        hide();
        form.requestSubmit();
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") hide();
    });

    document.addEventListener("click", (event) => {
        if (!searchRoot.contains(event.target)) hide();
    });

    input.addEventListener("blur", () => {
        // 延迟隐藏，保证联想项可以接收点击。
        window.setTimeout(hide, 150);
    });

    window.addEventListener("pagehide", () => {
        activeScript?.remove();
        activeScript = null;
    });
})();
