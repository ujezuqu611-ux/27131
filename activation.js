/**
 * 激活码校验已移除（授权改造版本）
 *
 * 页面加载后直接放行进入小手机主界面：
 *  - 不再弹出激活码输入遮罩
 *  - 不再向后端发起激活码联网验证
 *  - 保留原模块使用的 localStorage 键名，避免其他脚本读取异常
 *
 * PWA 可安装性修复：
 *  - 注册同源外部 sw.js（原项目用 Blob URL 注册 SW，现代浏览器禁止，导致 SW 未注册、无法安装）
 *  - 覆写 manifest，图标使用仓库内本地 PNG（icon-192.png / icon-512.png）
 *
 * 其余业务功能（导入/导出备份、角色卡、世界书、主题等）均未改动。
 */
(function () {
    'use strict';

    // 与原模块保持一致的存储键名
    var STORAGE_KEY = 'activation_verified';
    var STORAGE_CODE_KEY = 'activation_code';

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            activated: true,
            code: 'BYPASS',
            qq: null,
            time: Date.now(),
            useNewFormat: true
        }));
        localStorage.setItem(STORAGE_CODE_KEY, 'BYPASS');
    } catch (e) {
        // localStorage 不可用时（隐私模式等）忽略，仍继续放行
    }

    // 兜底：若 DOM 中残留旧版本遗留的激活遮罩，直接移除
    function removeOverlay() {
        var el = document.getElementById('activation-overlay');
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeOverlay);
    } else {
        removeOverlay();
    }

    // ==================== PWA 修复 ====================

    // 1) 注册同源外部 Service Worker（满足可安装性：需已注册且带 fetch 处理的 SW）
    function registerExternalSW() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('./sw.js')
            .then(function (reg) {
                console.log('[PWA] 外部 SW 已注册:', reg.scope);
            })
            .catch(function (err) {
                console.warn('[PWA] 外部 SW 注册失败:', err && err.message);
            });
    }

    // 2) 覆写 manifest：图标改为仓库内本地 PNG
    function applyManifest() {
        var link = document.querySelector('#manifest-link');
        if (!link) return;
        var manifest = {
            name: '芽芽机',
            short_name: '芽芽机',
            id: './index.html',
            start_url: './index.html',
            scope: './',
            display: 'fullscreen',
            background_color: '#ffffff',
            theme_color: '#ffffff',
            lang: 'zh-CN',
            orientation: 'portrait',
            icons: [
                {
                    src: './icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable'
                },
                {
                    src: './icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable'
                }
            ]
        };
        try {
            var blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            console.log('[PWA] manifest 已覆写（本地图标）');
        } catch (e) {
            console.warn('[PWA] manifest 覆写失败:', e && e.message);
        }
    }

    // script.js 在 DOMContentLoaded 里用 Blob 覆写过一次 manifest，
    // 这里在其后再次覆写，确保最终生效。
    if (document.readyState === 'loading') {
        window.addEventListener('load', registerExternalSW);
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(applyManifest, 400);
        });
    } else {
        registerExternalSW();
        setTimeout(applyManifest, 400);
    }
})();
