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
 *  - manifest 指向仓库内静态 manifest.json（blob manifest 无法通过安装校验）
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

    // 2) 指向仓库内静态 manifest.json
    //    （blob: 协议的 manifest 在 Edge/Chrome 安装校验中不被认可，
    //     且 blob 上下文下图标相对路径会解析失败，因此必须用静态文件）
    function applyManifest() {
        var link = document.querySelector('#manifest-link');
        if (!link) return;
        link.setAttribute('href', './manifest.json');
        console.log('[PWA] manifest 指向静态 manifest.json');
    }

    // 立即挂上静态 manifest；script.js 在 DOMContentLoaded 会改成 blob，
    // 这里在其后再次改回静态文件，确保安装校验读到静态 manifest。
    applyManifest();
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
