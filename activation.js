/**
 * 激活码校验已移除（授权改造版本）
 *
 * 页面加载后直接放行进入小手机主界面：
 *  - 不再弹出激活码输入遮罩
 *  - 不再向后端发起激活码联网验证
 *  - 保留原模块使用的 localStorage 键名，避免其他脚本读取异常
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
})();
