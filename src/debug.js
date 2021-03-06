/**
 * @file 日志debug模块
 * @author xiaowu <fe.xiaowu@gmail.com>
 */

(function (window, $, Log) {
    'use strict';

    var debug = Log.debug = {};

    /**
     * 获取完成链接, 如果是以 / 开头, 则匹配当前的链接
     *
     * @param  {string} url 链接
     *
     * @return {string}
     */
    var getLogPath = function (url) {
        if (/^\/[^\/]/.test(url)) {
            url = location.origin + url;
        }
        return url;
    };

    /**
     * 日志链接最大长度
     *
     * @type {number}
     */
    debug.URL_MAX_LENGTH = 100;

    /**
     * 参数值最大长度
     *
     * @type {number}
     */
    debug.PARAM_MAX_LENGTH = 10;

    /**
     * 报错
     */
    debug.error = function () {
        /* istanbul ignore next */
        if (window.console && window.console.error) {
            console.error.apply(console, [].slice.call(arguments));
        }
    };

    /**
     * 警告
     */
    debug.warn = function () {
        /* istanbul ignore next */
        if (window.console && window.console.warn) {
            console.warn.apply(console, [].slice.call(arguments));
        }
    };

    /**
     * 拦截数据
     *
     * @param  {string}   name     名字
     * @param  {Function} callback 回调, 参数是调用时的参数, 只执行回调, 不阻止代码
     */
    debug.mock = function (name, callback) {
        var old;
        var type = name.split('.')[0].toLowerCase();
        var fn = function () {
            var context = this;
            var args = [].slice.call(arguments);

            callback.apply(context, args);

            return old.apply(context, args);
        };

        name = name.split('.')[1];

        if (type === 'log') {
            old = Log[name];
            Log[name] = fn;
        }
        else if (type === 'class') {
            old = Log.Class.prototype[name];
            Log.Class.prototype[name] = fn;
        }
        else {
            throw new TypeError('name错误');
        }

    };

    // 创建时校验参数
    debug.mock('Log.create', function (url, options) {
        if ('undefined' === typeof url) {
            debug.error('Log.create(url) - url不能为空');
        }
        else if ('string' !== typeof url || !url) {
            debug.error('Log.create(url) - url必须为非空字符串');
        }
        else if (options && !$.isPlainObject(options)) {
            debug.error('Log.create(url, options) - options必须为对象');
        }
    });

    // 检测全局覆盖时有没有参数重复
    // 检测空参数
    // 检测超长参数
    debug.mock('Class._makeGlobal', function (data) {
        var options = this.global;
        var params = {};

        // 循环全局参数, 判断send()参数里存在则报警
        $.each(options, function (key, value) {
            // global里支持fn
            if ($.isFunction(value)) {
                value = value();
            }

            if (data.hasOwnProperty(key)) {
                debug.warn([
                    'send里存在全局global里重复参数 "' + key + '" , ',
                    '参数值将由全局的 "' + value + '" 更新为 "' + data[key] + '"'
                ].join(''));
            }

            params[key] = value;
        });

        $.each(data, function (key, value) {
            params[key] = value;
        });

        $.each(params, function (key, value) {
            // for in会把undefined的key转成string
            if ('undefined' === key || key === '') {
                debug.warn('存在空参数');
            }
            else if ('undefined' === typeof value || value === 'undefined' || value === '') {
                debug.warn('存在空参数: ' + key);
            }

            else if (String(value).length > debug.PARAM_MAX_LENGTH) {
                debug.warn('存在超长参数: ' + key + '=' + value + ', 长度为: ' + String(value).length);
            }

            // decodeURIComponent之后数字会转字符串
            else if (decodeURIComponent(key) !== String(key)) {
                debug.warn('存在urlencode后的key: ' + key);
            }
            else if (decodeURIComponent(value) !== String(value)) {
                debug.warn('存在urlencode后的value, key: ' + key);
            }
        });
    });

    // 在发送图片时检测参数
    debug.mock('Log._sendImg', function (data, url) {
        var length = Log._parseUrl(data, getLogPath(url)).length;

        if (length > debug.URL_MAX_LENGTH) {
            debug.warn('日志链接超长, 长度为: ' + length);
        }
    });
})(window, window.$, window.Log);
