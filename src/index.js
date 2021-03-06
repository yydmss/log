/**
 * @file 研究日志
 * @author xieyaowu <fe.xiaowu@gmail.com>
 */

(function (window, $) {
    'use strict';

    var Log = {};

    /**
     * 版本号
     *
     * @type {string}
     */
    Log.version = '0.0.1';

    /**
     * 日志构造函数
     *
     * @class
     * @param {string} url gif图链接
     * @param {Object} options 日志全局参数
     */
    Log.Class = function (url, options) {
        this.url = url;
        this.global = options;

        // 如果有调试url
        if (Log.debug && Log.debug.url) {
            this.url = Log.debug.url;
        }
    };

    $.extend(Log.Class.prototype, {

        /**
         * 发送日志
         *
         * @param  {Object|string} key   参数key或者数据对象, 会把全局里同名参数覆盖. 如果不是对象, 只能是string
         * @param  {string|undefined} value 参数值
         *
         * @return {Object}       this
         */
        send: function (key, value) {
            var self = this;
            var data = {};

            if ($.isPlainObject(key)) {
                data = key;
            }
            else if ('string' === typeof key && key) {
                data[key] = value;
            }

            // 立即发送日志
            Log._sendImg(self._makeGlobal(data), this.url);

            return self;
        },

        /**
         * 合并全局参数
         *
         * @private
         * @param  {Object} target 合并源对象
         *
         * @return {Object}
         */
        _makeGlobal: function (target) {
            // 复制对象, 防止全局对象
            var data = $.extend({}, this.global);

            $.each(data, function (key, val) {
                if ($.isFunction(val)) {
                    data[key] = val();
                }
            });

            return $.extend(data, target);
        }
    });


    /**
     * 全局唯一标识
     *
     * @type {number}
     */
    Log.guid = 0;

    /**
     * 全局key
     *
     * @type {string}
     */
    Log.expando = '__log__' + new Date().getTime();

    /**
     * 创建日志
     *
     * @description 参数统一判断类型
     * @param {string} url gif图链接
     * @param {Object} options 日志全局参数
     *
     * @return {Object}
     */
    Log.create = function (url, options) {
        return new Log.Class($.type(url) === 'string' ? url : '', $.isPlainObject(options) ? options : {});
    };

    /**
     * 解析stringify
     *
     * @private
     * @description 参数不做判断, 直接使用
     * @param {Object} data 数据对象, 只支持一维json
     * @param {string} url 链接
     * @return {string}
     */
    Log._parseUrl = function (data, url) {
        var arr = [];

        $.each(data, function (key, value) {
            if (key && (!!value || $.inArray(value, [0, false, null]) > -1)) {
                arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        });

        url += url.indexOf('?') > -1 ? '&' : '?';

        return url + arr.join('&');
    };

    /**
     * 发送图片
     *
     * @private
     * @description 参数不做判断, 直接使用
     * @param  {Object} data 日志参数
     * @param {string} url 图片地址
     */
    Log._sendImg = function (data, url) {
        var key = Log.expando + (Log.guid++);

        // 以下来参考fex
        // 这里一定要挂在window下
        // 在IE中，如果没挂在window下，这个img变量又正好被GC的话，img的请求会abort
        // 导致服务器收不到日志
        var img = window[key] = new Image();

        img.onload = img.onerror = img.onabort = function () {
            // 下面这句非常重要
            // 如果这个img很不幸正好加载了一个存在的资源，又是个gif动画
            // 则在gif动画播放过程中，img会多次触发onload
            // 因此一定要清空
            img.onload = img.onerror = img.onabort = null;

            // 清空window变量
            // https://github.com/jquery/jquery/blob/1.12.4/dist/jquery.js#L8662-L8666
            try {
                window[key] = undefined;
                delete window[key];
            }
            catch (e) {
            }

            // 下面这句非常重要
            // new Image创建的是DOM，DOM的事件中形成闭包环引用DOM是典型的内存泄露
            // 因此这里一定要置为null
            img = key = null;
        };

        // 一定要在注册了事件之后再设置src
        // 不然如果图片是读缓存的话，会错过事件处理
        // 最后，对于url最好是添加客户端时间来防止缓存
        // 同时服务器也配合一下传递Cache-Control: no-cache;
        img.src = Log._parseUrl(data, url);
    };

    window.Log = Log;
})(window, window.$);
