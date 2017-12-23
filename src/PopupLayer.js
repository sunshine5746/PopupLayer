/*
    弹出层(移动端)
    作者：yxs
    项目地址：https://github.com/qq597392321/PopupLayer
*/
(function (window) {
    'use strict'
    //常用功能
    var oftenFunc = {
        //判断指定对象的数据类型(指定对象，类型名称(可选，如果为空，则返回指定对象的类型字符串))
        isType: function (obj, name) {
            var toString = Object.prototype.toString.call(obj).toLowerCase();
            if (name === undefined) {
                return /^\[object (\w+)\]$/.exec(toString)[1];
            } else {
                return toString === '[object ' + name.toLowerCase() + ']';
            }
        },
        //indexOf增强版，可以指定多级属性(指定数组对象，指定需要匹配的值，链式调用路径)
        indexOf2: function (_this, value, tier) {
            var i, z;
            var tier = (tier && tier.split('.')) || [];
            var length = (tier && tier.length) || 0;
            var errorsign = [];
            var temporary = null;
            for (var i = 0; i < _this.length; i++) {
                temporary = _this[i];
                for (var z = 0; z < length; z++) {
                    try {
                        temporary = temporary[tier[z]];
                    } catch (e) {
                        temporary = errorsign;
                        break;
                    }
                }
                if (temporary !== errorsign &&
                    temporary === value) {
                    return i;
                }
            }
            return -1;
        },
        //对象克隆(指定对象)
        clone: function (_this) {
            var obj = null;
            switch (oftenFunc.isType(_this)) {
                case 'array':
                    obj = [];
                    _this.forEach(function (item, i) {
                        obj[i] = oftenFunc.clone(item);
                    });
                    break;
                case 'object':
                    obj = {};
                    Object.keys(_this).forEach(function (name) {
                        obj[name] = oftenFunc.clone(_this[name]);
                    });
                    break;
                default: return _this;
            }
            return obj;
        },
        //数组去重(指定对象，链式调用路径(可选，如果不为空，则只判断该链式路径下的值))
        unique: function (_this, tier) {
            var i, z;
            var len1 = _this.length;
            var tier = (tier && tier.split('.')) || [];
            var len2 = (tier && tier.length) || 0;
            var newdata = [];
            var valuelist = [];
            var errorsign = [];
            var temporary = null;
            for (i = 0; i < len1; i++) {
                var temporary = _this[i];
                for (z = 0; z < len2; z++) {
                    try {
                        temporary = temporary[tier[z]];
                    } catch (e) {
                        temporary = errorsign;
                        break;
                    }
                }
                if (temporary === errorsign) {
                    newdata.push(_this[i]);
                } else if (valuelist.indexOf(temporary) === -1) {
                    newdata.push(_this[i]);
                    valuelist.push(temporary);
                }
            }
            return newdata;
        },
        //对象继承(指定继承对象，指定继承自对象，当继承对象已存在属性，是否用新的值覆盖旧的值(可选，默认false))
        extend: function (target, obj, isrep) {
            Object.keys(obj).forEach(function (name) {
                if (target[name] !== undefined && !isrep) return;
                target[name] = obj[name];
            });
        },
        //绑定上下文(指定对象，指定上下文对象)
        bindContext: function (obj, context) {
            var type = oftenFunc.isType(obj);
            if (type === 'object' || type === 'function') {
                Object.keys(obj).forEach(function (name) {
                    switch (oftenFunc.isType(obj[name])) {
                        case 'function':
                            obj[name] = obj[name].bind(context);
                            break;
                        case 'object':
                            oftenFunc.bindContext(obj[name], context);
                            break;
                    }
                });
            }
        },
    };
    /*
        事件推送
    */
    var EventPush = {
        //自定义数据key名
        keyName: '__CustomData' + Date.now() + '__',
        //注册
        register: function (obj) {
            var s = this;
            if (obj[s.keyName] === undefined) {
                obj[s.keyName] = {};
                obj['dispatchEvent'] = s.dispatchEvent.bind(obj);
                obj['addEvent'] = obj['on'] = s.addEvent.bind(obj);
                obj['removeEvent'] = obj['off'] = s.removeEvent.bind(obj);
            }
        },
        //取消注册
        destroy: function (obj) {
            var names = ['on', 'off', 'dispatchEvent', 'addEvent', 'removeEvent', 'emptyEvent'];
            names.forEach(function (name) {
                delete obj[name];
            });
        },
        //派送事件
        dispatchEvent: function (name, data) {
            var s = this;
            var customData = s[EventPush.keyName];
            if (oftenFunc.isType(name) === 'string') {
                name = name.toLowerCase();
                if (customData[name]) {
                    customData[name].forEach(function (item) {
                        item.call(s, data);
                    });
                }
                var humpName = 'on' + name[0].toUpperCase() + name.substring(1);
                if (oftenFunc.isType(s[humpName]) === 'function') {
                    s[humpName].call(s, data);
                }
            }
        },
        //添加事件
        addEvent: function (name, callback) {
            var s = this;
            var customData = s[EventPush.keyName];
            if (oftenFunc.isType(name) === 'string' &&
                oftenFunc.isType(callback) === 'function') {
                name = name.toLowerCase();
                (customData[name] = customData[name] || []).push(callback);
            }
        },
        //删除事件
        removeEvent: function (name, callback) {
            var s = this;
            var customData = s[EventPush.keyName];
            if (oftenFunc.isType(name) === 'string') {
                name = name.toLowerCase();
                if (callback === undefined) {
                    customData[name] = [];
                } else {
                    var index = customData[name].indexOf(callback);
                    if (index > -1) {
                        customData[name].splice(index, 1);
                    }
                }
            }
        }
    };
    //dom常用功能封装
    var oftenDomFunc = {
        //自定义数据key名
        keyName: '__CustomData' + Date.now() + '__',
        //css3兼容前缀
        browserPrefix: ['-webkit-', '-moz-', '-o-', '-ms-'],
        //css3兼容列表
        browserAttrList: ['transform', 'transition', 'animation', 'clipPath'],
        //继承
        extend: function (element) {
            var s = this;
            Object.keys(s).forEach(function (name) {
                if (oftenFunc.isType(s[name], 'function')) {
                    element[name] = s[name].bind(element);
                }
            });
            element[s.keyName] = {
                //队列数据
                'queue': {
                    //默认队列
                    'def': {
                        //队列数据列表
                        list: [],
                        //计时器id
                        timerid: null
                    }
                },
                //事件列表
                'event': {}
            };
            return element;
        },
        //取消继承
        destroy: function (element) {
            Object.keys(s).forEach(function (name) {
                if (oftenFunc.isType(oftenDomFunc[name], 'function')) {
                    delete element[name];
                }
            });
            delete element[s.keyName];
        },
        //设置样式
        css: function () {
            var s = this;
            var option = arguments[0];
            switch (oftenFunc.isType(option)) {
                case 'string':
                    if (arguments[1] === undefined) {
                        return oftenDomFunc.getStyle.call(s, option);
                    } else {
                        s.style[option] = arguments[1];
                    }
                    break;
                case 'object':
                    Object.keys(option).forEach(function (name) {
                        if (oftenDomFunc.browserAttrList.indexOf(name) > -1) {
                            oftenDomFunc.browserPrefix.forEach(function (prefix) {
                                s.style[prefix + name] = option[name];
                            });
                        }
                        s.style[name] = option[name];
                    });
                    break;
            }
            return s;
        },
        //设置属性
        attr: function () {
            var s = this;
            var option = arguments[0];
            switch (oftenFunc.isType(option)) {
                case 'string':
                    if (arguments[1] === undefined) {
                        return s.getAttribute(option);
                    } else {
                        s.setAttribute(option, arguments[1]);
                    }
                    break;
                case 'object':
                    Object.keys(option).forEach(function (name) {
                        s.setAttribute(name, option[name]);
                    });
                    break;
            }
            return s;
        },
        //删除自己
        remove: function () {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
            return this;
        },
        //获取指定选择器的祖先元素列表
        parents: function (exp) {
            var s = this;
            var list = [];
            //获取祖先元素列表
            var node = s.parentNode;
            var path = [];
            while (node) {
                path.push(node);
                node = node.parentNode;
            }
            //筛选符合选择器的元素
            var explist = document.querySelectorAll(exp);
            var length = explist.length;
            for (var i = 0; i < length; i++) {
                if (path.indexOf(explist[i]) > -1) {
                    list.push(explist[i]);
                }
            }
            return list;
        },
        //判断是否具有指定样式类
        hasClass: function (name) {
            var c = this.className.split(' ');
            for (var i = c.length - 1; i >= 0; i--) {
                if (c[i].toLowerCase() == name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        },
        //添加样式类
        addClass: function (name) {
            var list1 = name.split(' ');
            var list2 = this.className.split(' ');
            list1.forEach(function (item, i) {
                var index = list2.indexOf(item);
                if (index === -1) {
                    list2.push(item);
                }
            });
            this.className = list2.join(' ');
            return this;
        },
        //删除样式类
        removeClass: function (name) {
            var list1 = name.split(' ');
            var list2 = this.className.split(' ');
            list1.forEach(function (item) {
                var index = list2.indexOf(item);
                if (index > -1) {
                    list2.splice(index, 1);
                }
            });
            this.className = list2.join(' ');
            return this;
        },
        //获取指定样式值，像素值只会返回数字
        getStyle: function (name, pseudoElt) {
            var style = getComputedStyle(this, pseudoElt);
            if (/^([0-9.]+)px$/i.test(style[name])) {
                return Number(RegExp.$1);
            }
            return style[name];
        },
        //获取下一个兄弟节点
        getNextSbiling: function () {
            var s = this;
            if (this.parentNode) {
                var list = [].slice.call(this.parentNode.children);
                var index = list.indexOf(s);
                if (index <= list.length) {
                    return list[index + 1];
                }
            }
        },
        //获取上一个兄弟节点
        getPreviousSbiling: function () {
            var s = this;
            if (this.parentNode) {
                var list = [].slice.call(this.parentNode.children);
                var index = list.indexOf(s);
                if (index > 0) {
                    return list[index - 1];
                }
            }
        },
        //判断给定选择器元素是否在事件冒泡路径中
        isEventAgencyTarget: function (exp) {
            var s = this;
            var path = [];
            var target = event.target;
            //获取冒泡路径
            while (target) {
                path.push(target);
                target = target.parentNode;
            }
            var list = s.querySelectorAll(exp);
            var length = list.length;
            for (var i = 0; i < length; i++) {
                if (path.indexOf(list[i]) > -1) {
                    return list[i];
                }
            }
            return false;
        },
        //加入队列
        queue: function () {
            var s = this;
            var data = s[s.keyName]['queue'];
            //修正参数
            var name = 'def', func, delay = 0;
            [].forEach.call(arguments, function (item) {
                switch (oftenFunc.isType(item)) {
                    case 'string': name = item; break;
                    case 'function': func = item; break;
                    case 'number': delay = item; break;
                }
            });
            if (func) {
                if (!data[name]) {
                    data[name] = { list: [], timerid: null };
                }
                data[name].list.push({ func: func, delay: delay });
                //是否有延时队列正在执行
                if (data[name].timerid === null) {
                    s.dequeue(name);
                }
            }
            return s;
        },
        //是否有延时队列正在执行
        isqueue: function () {
            var s = this;
            var name = arguments[0] || 'def';
            var data = s[s.keyName]['queue'];
            return !!data[name].timerid;
        },
        //从队列最前端移除并执行一个队列函数。
        dequeue: function () {
            var s = this;
            var name = arguments[0] || 'def';
            var data = s[oftenDomFunc.keyName]['queue'];
            var first = data[name].list.shift();
            if (first) {
                data[name].timerid = setTimeout(function () {
                    data[name].timerid = null;
                    first.func.call(s);
                    s.dequeue(name);
                }, first.delay);
            }
            return s;
        },
        //清空队列
        clearQueue: function () {
            var s = this;
            var name = arguments[0] || 'def';
            var data = s[oftenDomFunc.keyName]['queue'];
            data[name].list = [];
            clearTimeout(data[name].timerid);
            return s;
        }
    };
    //事件绑定
    !function (oftenDomFunc) {
        var isTouch = 'ontouchstart' in document;
        var interval = 1000;
        var threshold = 20;
        var tapEvent = function () {
            var s = this;
            var downPos = null;
            var downTime = null;
            var customData = s[oftenDomFunc.keyName]['event'];
            function down(e) {
                downPos = {
                    clientX: e.changedTouches[0].clientX,
                    clientY: e.changedTouches[0].clientY
                };
                downTime = Date.now();
            };
            function lift(e) {
                if (downPos) {
                    if (Date.now() - downTime < interval) {
                        var currPos = {
                            clientX: e.changedTouches[0].clientX,
                            clientY: e.changedTouches[0].clientY
                        };
                        if (Math.abs(downPos.clientX - currPos.clientX) < threshold &&
                            Math.abs(downPos.clientY - currPos.clientY) < threshold) {
                            e.currentTarget[oftenDomFunc.keyName]['event']['tap'].forEach(function (item) {
                                item.call(e.currentTarget, e);
                            });
                        }
                        downPos = null;
                        downTime = null;
                    }
                }
            };
            customData['tap-init'] = true;
            customData['tap-bind'] = false;
            customData['tap-touchstart'] = down;
            customData['tap-touchend'] = lift;
        };
        oftenDomFunc.on = function on(name, callback) {
            var s = this;
            var customData = s[oftenDomFunc.keyName]['event'];
            if (oftenFunc.isType(name) === 'string' &&
                oftenFunc.isType(callback) === 'function') {
                name = name.toLowerCase();
                if (name === 'tap' && !isTouch) {
                    name = 'click';
                }
                if (name === 'tap') {
                    if (!customData['tap-init']) {
                        tapEvent.call(s);
                    }
                    if (!customData['tap-bind']) {
                        s.addEventListener('touchstart', customData['tap-touchstart']);
                        s.addEventListener('touchend', customData['tap-touchend']);
                    }
                } else {
                    s.addEventListener(name, callback);
                }
                (customData[name] = customData[name] || []).push(callback);
            }
        };
        oftenDomFunc.off = function off(name, callback) {
            var s = this;
            var customData = s[oftenDomFunc.keyName]['event'];
            if (oftenFunc.isType(name) === 'string') {
                name = name.toLowerCase();
                if (callback === undefined) {
                    customData[name].forEach(function (item) {
                        s.removeEventListener(name, item);
                    });
                    customData[name] = [];
                } else {
                    if (name === 'tap') {
                        customData['tap-bind'] = false;
                        s.removeEventListener('touchstart', customData['tap-touchstart']);
                        s.removeEventListener('touchend', customData['tap-touchend']);
                    } else {
                        s.removeEventListener(name, callback);
                    }
                    var index = customData[name].indexOf(callback);
                    if (index > -1) {
                        customData[name].splice(index, 1);
                    }
                }
            }
        };
    }(oftenDomFunc);
    //字符串算式计算
    var equation = {
        unit: {
            vw: 'window.innerWidth',
            vh: 'window.innerHeight',
        },
        calc: function (exp, custom) {
            Object.keys(equation.unit).forEach(function (name) {
                exp = exp.replace(name, equation.unit[name]);
            });
            if (oftenFunc.isType(custom) === 'object') {
                Object.keys(custom).forEach(function (name) {
                    exp = exp.replace(name, custom[name]);
                });
            }
            try {
                return eval(exp);
            } catch (e) {
                return NaN;
            }
        }
    };
    /*
        弹出框
    */
    function BoxMsg(option) {
        var s = this;
        //绑定上下文
        s.close = s.close.bind(s);
        s.config = s.config.bind(s);
        s.update = s.update.bind(s);
        s.destroy = s.destroy.bind(s);
        s.closeend = s.closeend.bind(s);
        s.updateConfig = s.updateConfig.bind(s);
        s.updatePosition = s.updatePosition.bind(s);
        //注册监听器
        EventPush.register(s);
        //计时器列表
        s.timerlist = [];
        //元素缓存
        s.elementCache = {};
        //当前配置
        s.currentConfig = oftenFunc.clone(s.defaultConfig);
        //生成元素
        var wrapper = document.createElement('div');
        wrapper.innerHTML = ' \
            <div class="popup-layer-wrapper" data-show="0">\
                <div class="pl-mask-layer"></div>\
                <div class="pl-mian-wrapper">\
                    <div class="pl-title-bar pl-border-bottom pl-flex">\
                        <div class="pl-title-text"></div>\
                        <div class="pl-close-btn"><div class="pl-icon pl-icon-close"></div></div>\
                    </div>\
                    <div class="pl-content"></div>\
                    <div class="pl-btn-list pl-flex"></div>\
                </div>\
            </div>\
        ';
        s.elementCache['popup-layer-wrapper'] = oftenDomFunc.extend(wrapper.querySelector('.popup-layer-wrapper'));
        s.elementCache['pl-mask-layer'] = oftenDomFunc.extend(wrapper.querySelector('.pl-mask-layer'));
        s.elementCache['pl-mian-wrapper'] = oftenDomFunc.extend(wrapper.querySelector('.pl-mian-wrapper'));
        s.elementCache['pl-title-bar'] = oftenDomFunc.extend(wrapper.querySelector('.pl-title-bar'));
        s.elementCache['pl-title-text'] = oftenDomFunc.extend(wrapper.querySelector('.pl-title-text'));
        s.elementCache['pl-close-btn'] = oftenDomFunc.extend(wrapper.querySelector('.pl-close-btn'));
        s.elementCache['pl-content'] = oftenDomFunc.extend(wrapper.querySelector('.pl-content'));
        s.elementCache['pl-btn-list'] = oftenDomFunc.extend(wrapper.querySelector('.pl-btn-list'));
        //绑定事件
        s.elementCache['pl-mask-layer'].on('tap', function () {
            if (s.currentConfig.tapMaskClose) {
                s.close();
            }
        });
        s.elementCache['pl-close-btn'].on('tap', function () {
            s.close();
        });
        s.elementCache['pl-btn-list'].on('tap', function () {
            var _this = s.elementCache['pl-btn-list'].isEventAgencyTarget('.pl-btn-item');
            if (_this) {
                var index = _this.getAttribute('data-index');
                var callback = s.currentConfig.btnEvent[index];
                if (oftenFunc.isType(callback) === 'function') {
                    callback.call(s);
                }
            }
        });
        s.elementCache['pl-mian-wrapper'].on('transitionend', function () {
            if (s.elementCache['popup-layer-wrapper'].getAttribute('data-show') === '0') {
                s.closeend();
            }
        });
        s.elementCache['pl-mask-layer'].on('transitionend', function () {
            if (s.elementCache['popup-layer-wrapper'].getAttribute('data-show') === '0' &&
                s.currentConfig.content === null) {
                s.closeend();
            }
        });
        window.addEventListener('resize', s.updatePosition);
        //更新配置
        s.updateConfig(option);
        //加入body
        s.currentConfig.parentContainer.appendChild(s.elementCache['popup-layer-wrapper']);
        //更新位置
        s.updatePosition();
        //显示
        s.elementCache['popup-layer-wrapper'].attr('data-show', 1);
    };
    //默认配置设置
    BoxMsg.prototype.config = function (option) {
        var s = this;
        Object.keys(option).forEach(function (name) {
            if (name in s.defaultConfig) {
                s.defaultConfig[name] = option[name];
            }
        });
        return s;
    };
    //更新
    BoxMsg.prototype.update = function (option) {
        var s = this;
        s.updateConfig(option);
        s.defaultConfig();
    };
    //关闭
    BoxMsg.prototype.close = function () {
        var s = this;
        s.dispatchEvent('close');
        s.timerlist.forEach(function (item) {
            clearTimeout(item);
        });
        if (s.currentConfig.tranOut) {
            s.elementCache['popup-layer-wrapper'].attr('data-tran', s.currentConfig.tranOut);
        } else {
            s.closeend();
        }
        s.elementCache['popup-layer-wrapper'].attr('data-show', 0);
        return s;
    };
    //关闭完成
    BoxMsg.prototype.closeend = function () {
        var s = this;
        s.dispatchEvent('closeend');
        if (s.elementCache.isCloseAfteDestroy) {
            s.destroy();
        }
        if (s.elementCache['content-parent-node']) {
            if (s.elementCache['content-next-sbiling-node']) {
                s.elementCache['content-parent-node'].insertBefore(s.elementCache['content-node'], s.elementCache['content-next-sbiling-node']);
            } else {
                s.elementCache['content-parent-node'].appendChild(s.elementCache['content-node']);
            }
        }
        s.elementCache['content-node'] = null;
        s.elementCache['content-parent-node'] = null;
        s.elementCache['content-next-sbiling-node'] = null;
        s.elementCache['popup-layer-wrapper'].remove();
    };
    //销毁
    BoxMsg.prototype.destroy = function () {
        var s = this;
        s.elementCache['pl-mask-layer'].off('tap');
        s.elementCache['pl-close-btn'].off('tap');
        s.elementCache['pl-btn-list'].off('tap');
        s.elementCache['pl-mian-wrapper'].off('transitionend');
        window.removeEventListener('resize', s.updatePosition);
        s.elementCache['popup-layer-wrapper'].remove();
        return s;
    };
    //更新当前配置
    BoxMsg.prototype.updateConfig = function (option) {
        var s = this;
        var config = s.currentConfig;
        if (oftenFunc.isType(option) === 'object') {
            Object.keys(option).forEach(function (name) {
                if (name in config) {
                    config[name] = option[name];
                }
            });
        }
        if (config.title === null) {
            s.elementCache['pl-title-bar'].addClass('pl-hide');
        } else {
            s.elementCache['pl-title-text'].innerHTML = config.title;
            s.elementCache['pl-title-bar'].removeClass('pl-hide');
        }
        if (config.isCloseBtn) {
            s.elementCache['pl-close-btn'].removeClass('pl-hide');
        } else {
            s.elementCache['pl-close-btn'].addClass('pl-hide');
        }
        if (config.content === null) {
            s.elementCache['pl-mian-wrapper'].addClass('pl-hide');
        } else {
            if (config.content.nodeType === 1) {
                s.elementCache['content-node'] = config.content;
                s.elementCache['content-parent-node'] = config.content.parentNode;
                s.elementCache['content-next-sbiling-node'] = oftenDomFunc.getNextSbiling.call(config.content);
                s.elementCache['pl-content'].appendChild(config.content);
            } else {
                s.elementCache['pl-content'].innerHTML = config.content;
            }
            s.elementCache['pl-mian-wrapper'].removeClass('pl-hide');
        }
        if (config.boxback) {
            s.elementCache['pl-mian-wrapper'].css('background', config.boxback);
        } else {
            s.elementCache['pl-mian-wrapper'].css('background', '#fff');
        }
        if (config.button) {
            var html = '';
            config.button.forEach(function (item, i) {
                html += '<div data-index="' + i + '" class="pl-btn-item pl-border-top pl-border-right">' + item + '</div>';
            });
            s.elementCache['pl-btn-list'].removeClass('pl-hide').innerHTML = html;
        } else {
            s.elementCache['pl-btn-list'].addClass('pl-hide');
        }
        if (config.isMask) {
            s.elementCache['pl-mask-layer'].style.backgroundColor = config.maskColor;
            s.elementCache['pl-mask-layer'].removeClass('pl-hide');
        } else {
            s.elementCache['pl-mask-layer'].addClass('pl-hide');
        }
        switch (config.btnAlign) {
            case 'h':
                s.elementCache['pl-btn-list'].addClass('pl-flex');
                break;
            case 'v':
                s.elementCache['pl-btn-list'].removeClass('pl-flex');
                break;
        }
        if (config.duration) {
            clearTimeout(s.timerlist[0]);
            s.timerlist[0] = setTimeout(function () {
                s.close();
            }, config.duration);
        }
        s.elementCache['pl-content'].attr('data-scroll', config.isScroll ? 1 : 0);
        s.elementCache['pl-mian-wrapper'].css('border-radius', config.borderRadius);
        s.elementCache['popup-layer-wrapper'].attr({
            'data-mode': config.module,
            'data-tran': config.tranIn
        });
        return s;
    };
    //更新显示位置
    BoxMsg.prototype.updatePosition = function () {
        var s = this;
        var config = s.currentConfig;
        var arearect = {};
        var calc_reg = 'calc\\((\\S+)\\)';
        var percent_reg = '(([+-]?)\\d+)%$';
        var number_reg = '^(([+-]?)\\d*\\.?\\d+)$';
        var fixedHeight = s.elementCache['pl-title-bar'].clientHeight + s.elementCache['pl-btn-list'].clientHeight;

        s.elementCache['pl-mian-wrapper'].css({ top: '', left: '' });
        s.elementCache['pl-content'].css({ width: '', height: '' });
        //最小宽度
        if (new RegExp(number_reg).test(config.area.minWidth)) {
            arearect.minWidth = Number(RegExp.$1);
        } else if (new RegExp(calc_reg, 'ig').test(config.area.minWidth)) {
            arearect.minWidth = equation.calc(RegExp.$1) || s.elementCache['pl-content'].clientWidth;
        } else if (new RegExp(percent_reg).test(config.area.minWidth)) {
            arearect.minWidth = window.innerWidth * (Number(RegExp.$1) / 100);
        } else {
            arearect.minWidth = -Infinity;
        }
        //最小高度
        if (new RegExp(number_reg).test(config.area.minHeight)) {
            arearect.minHeight = Number(RegExp.$1);
        } else if (new RegExp(calc_reg, 'ig').test(config.area.minHeight)) {
            arearect.minHeight = equation.calc(RegExp.$1) - fixedHeight || s.elementCache['pl-content'].clientHeight;
        } else if (new RegExp(percent_reg).test(config.area.minHeight)) {
            arearect.minHeight = window.innerWidth * (Number(RegExp.$1) / 100) - fixedHeight;
        } else {
            arearect.minHeight = -Infinity;
        }
        //最大宽度
        if (new RegExp(number_reg).test(config.area.maxWidth)) {
            arearect.maxWidth = Number(RegExp.$1);
        } else if (new RegExp(calc_reg, 'ig').test(config.area.maxWidth)) {
            arearect.maxWidth = equation.calc(RegExp.$1) || window.innerWidth;
        } else if (new RegExp(percent_reg).test(config.area.maxWidth)) {
            arearect.maxWidth = window.innerWidth * (Number(RegExp.$1) / 100);
        } else {
            arearect.maxWidth = window.innerWidth;
        }
        //最大高度
        if (new RegExp(number_reg).test(config.area.maxHeight)) {
            arearect.maxHeight = Number(RegExp.$1);
        } else if (new RegExp(calc_reg, 'ig').test(config.area.maxHeight)) {
            arearect.maxHeight = equation.calc(RegExp.$1) - fixedHeight || window.innerHeight;
        } else if (new RegExp(percent_reg).test(config.area.maxHeight)) {
            arearect.maxHeight = window.innerHeight * (Number(RegExp.$1) / 100) - fixedHeight;
        } else {
            arearect.maxHeight = window.innerHeight;
        }
        if (arearect.minWidth > arearect.maxWidth) {
            arearect.minWidth = arearect.maxWidth;
        }
        if (arearect.minHeight > arearect.maxHeight) {
            arearect.minHeight = arearect.maxHeight;
        }
        //宽度
        switch (config.area.width) {
            case 'full':
                arearect.width = window.innerWidth;
                break;
            default:
                if (new RegExp(number_reg).test(config.area.width)) {
                    arearect.width = Number(RegExp.$1);
                } else if (new RegExp(calc_reg, 'ig').test(config.area.width)) {
                    arearect.width = equation.calc(RegExp.$1);
                } else if (new RegExp(percent_reg).test(config.area.width)) {
                    arearect.width = window.innerWidth * (Number(RegExp.$1) / 100);
                }
                break;
        }
        if (!arearect.width) {
            arearect.width = s.elementCache['pl-content'].clientWidth;
            arearect.isAutoWidth = true;
        }
        if (arearect.isAutoWidth) {
            if (arearect.width < arearect.minWidth || arearect.width > arearect.maxWidth) {
                arearect.width = Math.max(Math.min(arearect.width, arearect.maxWidth), arearect.minWidth);
                s.elementCache['pl-mian-wrapper'].css('width', arearect.width + 'px');
            }
        } else {
            arearect.width = Math.max(Math.min(arearect.width, arearect.maxWidth), arearect.minWidth);
            s.elementCache['pl-mian-wrapper'].css('width', arearect.width + 'px');
        }
        //高度
        switch (config.area.height) {
            case 'full':
                arearect.height = window.innerHeight;
                break;
            default:
                if (new RegExp(number_reg).test(config.area.height)) {
                    arearect.height = Number(RegExp.$1);
                } else if (new RegExp(calc_reg, 'ig').test(config.area.height)) {
                    arearect.height = equation.calc(RegExp.$1) - fixedHeight;
                } else if (new RegExp(percent_reg).test(config.area.height)) {
                    arearect.height = window.innerHeight * (Number(RegExp.$1) / 100) - fixedHeight;
                }
                break;
        }
        if (!arearect.height) {
            arearect.height = s.elementCache['pl-content'].clientHeight;
            arearect.isAutoHeight = true;
        }
        if (arearect.isAutoHeight) {
            if (arearect.height < arearect.minHeight || arearect.height > arearect.maxHeight) {
                arearect.height = Math.max(Math.min(arearect.height, arearect.maxHeight), arearect.minHeight);
                s.elementCache['pl-content'].css('height', arearect.height + 'px');
            }
        } else {
            arearect.height = Math.max(Math.min(arearect.height, arearect.maxHeight), arearect.minHeight);
            s.elementCache['pl-content'].css('height', arearect.height + 'px');
        }
        //水平定位
        switch (config.area.h) {
            case 'left':
                arearect.left = 0;
                break;
            case 'right':
                arearect.left = window.innerWidth - arearect.width;
                break;
            default:
                if (new RegExp(number_reg).test(config.area.h)) {
                    arearect.left = Number(RegExp.$1);
                } else if (new RegExp(calc_reg, 'ig').test(config.area.h)) {
                    arearect.left = equation.calc(RegExp.$1, {
                        'bw': arearect.width,
                        'left': 0,
                        'right': window.innerWidth - arearect.width
                    }) || window.innerWidth / 2 - arearect.width / 2;
                } else if (new RegExp(percent_reg).test(config.area.h)) {
                    arearect.left = window.innerWidth * (Number(RegExp.$1) / 100);
                } else {
                    arearect.left = window.innerWidth / 2 - arearect.width / 2;
                }
                break;
        }
        //垂直定位
        switch (config.area.v) {
            case 'top':
                arearect.top = 0;
                break;
            case 'bottom':
                arearect.top = window.innerHeight - arearect.height - fixedHeight;
                break;
            default:
                if (new RegExp(number_reg).test(config.area.v)) {
                    arearect.top = Number(RegExp.$1);
                } else if (new RegExp(calc_reg, 'ig').test(config.area.v)) {
                    arearect.top = equation.calc(RegExp.$1, {
                        'bh': arearect.height + fixedHeight,
                        'top': 0,
                        'bottom': window.innerHeight - arearect.height
                    }) || window.innerHeight / 2 - (arearect.height + fixedHeight) / 2;
                } else if (new RegExp(percent_reg).test(config.area.v)) {
                    arearect.top = window.innerHeight * (Number(RegExp.$1) / 100);
                } else {
                    arearect.top = window.innerHeight / 2 - (arearect.height + fixedHeight) / 2;
                }
                break;
        }
        s.elementCache['pl-mian-wrapper'].css({
            top: arearect.top + 'px',
            left: arearect.left + 'px'
        });
        return s;
    };
    //默认配置
    BoxMsg.prototype.defaultConfig = (function () {
        return {
            //模块
            module: 'content',
            //标题
            title: null,
            //内容
            content: null,
            //背景
            boxback: '#fff',
            //圆角
            borderRadius: '8px',
            //显示的时间(number:毫秒|false:一直显示)
            duration: 0,
            //按钮列表 Array(string|number,...)
            button: null,
            //按钮事件列表 Array(function,...)
            btnEvent: null,
            //按钮排列方式 String('h'：横排 | 'v'：竖排)
            btnAlign: 'h',
            /*
                指定显示的区域 Object
                    v(垂直坐标位置)：number |
                        'n%':       相对于屏幕高度的百分比
                        'top':      显示在屏幕最顶端
                        'bottom':   显示在屏幕最底端
                        'centre':   居中显示(默认)
                        'calc()'    计算
                    h(水平坐标位置)：number |
                        'n%':       相对于屏幕宽度的百分比
                        'left':     显示在屏幕最左端
                        'right':    显示在屏幕最右端
                        'centre':   居中显示(默认)
                        'calc()'    计算
                    width(宽度)：number |
                        'n%':       相对于屏幕宽度的百分比
                        'full':     铺满屏幕
                        'calc()'    计算
                    height(高度)：number |
                        'n%':       相对于屏幕高度的百分比
                        'full':     铺满屏幕
                        'calc()'    计算
                    minWidth(最小宽度)：number |
                        'n%':       相对于屏幕宽度的百分比
                        'calc()'    计算
                    minHeight(最小高度)：number |
                        'n%':       相对于屏幕高度的百分比
                        'calc()'    计算
                    maxWidth(最大宽度)：number |
                        'n%':       相对于屏幕宽度的百分比
                        'calc()'    计算
                    maxHeight(最大高度)：number |
                        'n%':       相对于屏幕高度的百分比
                        'calc()'    计算
                    计算单位：
                        vw:         屏幕宽度
                        vh:         屏幕高度
                        bw:         消息框宽度(仅h v可用)
                        bh:         消息框高度(仅h v可用)
                        left：      屏幕最左端(仅h可用)
                        right：     屏幕最右端(仅h可用)
                        top：       屏幕最顶端(仅v可用)
                        bottom：    屏幕最底端(仅v可用)
            */
            area: {},
            //内容是否可以滚动
            isScroll: false,
            //是否显示关闭按钮
            isCloseBtn: true,
            //是否显示遮罩层
            isMask: true,
            //遮罩层颜色
            maskColor: 'rgba(0,0,0,.6)',
            //点击遮罩层是否关闭消息框
            tapMaskClose: true,
            //父容器
            parentContainer: document.body,
            //显示时的过渡动画
            tranIn: 'popup',
            //关闭时的过渡动画
            tranOut: 'popup',
            //是否关闭后自动销毁对象
            isCloseAfteDestroy: true
        };
    })();
    //入口
    var ylayer = {
        //自增id
        incrementID: 0,
        //历史
        history: [],
        //默认选项
        defaultConfig: (function () {
            return {
                msg: {
                    area: {
                        'maxWidth': '60%',
                        'maxHeight': '60%'
                    },
                    content: null,
                    boxback: 'rgba(0,0,0,.6)',
                    tranIn: 'popup',
                    tranOut: 'popup',
                    borderRadius: '4px',
                    duration: 2000,
                    isCloseAfteDestroy: true,
                    //是否关闭其他弹框
                    isCloseOther: false,
                    //不可修改属性
                    isMask: false
                },
                tips: {
                    content: null,
                    boxback: 'rgba(0,0,0,.6)',
                    tranIn: 'popup',
                    tranOut: 'popup',
                    borderRadius: '4px',
                    duration: 2000,
                    isCloseOther: false,
                    isCloseAfteDestroy: true,
                    //显示方向(如果指定方向无法显示完整，则按照top bottom left right顺序依次计算，如果没有一个方向能显示完整，则使用指定方向显示)
                    direction: 'top',
                    //吸附元素
                    adsorbElement: null,
                    //不可修改属性
                    module: 'tips'
                },
                open: {
                    area: {
                        'maxWidth': '80%',
                        'maxHeight': '80%'
                    },
                    title: null,
                    content: null,
                    tranIn: 'popup',
                    tranOut: 'popup',
                    borderRadius: '8px',
                    isScroll: true,
                    isCloseBtn: true,
                    tapMaskClose: true,
                    isCloseOther: false,
                    isCloseAfteDestroy: true
                },
                mask: {
                    maskColor: 'rgba(0,0,0,.6)',
                    isCloseOther: false,
                    isCloseAfteDestroy: true
                },
                alert: {
                    area: {
                        'v': '30%',
                        'minWidth': '200',
                        'maxWidth': '60%',
                        'maxHeight': '60%'
                    },
                    title: null,
                    content: null,
                    button: ['确定'],
                    btnEvent: [function () {
                        this.close();
                    }],
                    isCloseBtn: false,
                    tapMaskClose: true,
                    isCloseOther: false,
                    isCloseAfteDestroy: true
                },
                prompt: {
                    area: {
                        'v': '30%',
                        'minWidth': '200',
                        'maxWidth': '80%',
                        'maxHeight': '80%'
                    },
                    content: null,
                    //回调函数
                    callback: null,
                    //正则验证
                    verifyRegExp: /\S+/,
                    //验证失败提示文本
                    verifyErrorText: '不能为空',
                    //输入框类型
                    inputType: 'text',
                    //输入框是否可以为空
                    isCanEmpty: true,
                    isCloseBtn: true,
                    tapMaskClose: false,
                    isCloseOther: false,
                    isCloseAfteDestroy: true,
                    //不可修改属性
                    button: ['取消', '确定'],
                    btnEvent: [function () {
                        this.close();
                    }, function () {
                        this.close();
                    }]
                },
                confirm: {
                    area: {
                        'v': '30%',
                        'minWidth': '200',
                        'maxWidth': '60%',
                        'maxHeight': '60%'
                    },
                    title: null,
                    content: null,
                    button: ['否', '是'],
                    btnAlign: 'h',
                    btnEvent: [function () {
                        this.close();
                    }, function () {
                        this.close();
                    }],
                    isCloseBtn: true,
                    tapMaskClose: true,
                    isCloseOther: false,
                    isCloseAfteDestroy: true
                },
                loading: {
                    //不可修改属性
                    module: 'loading'
                }
            };
        })(),
        //获取自增id
        getAutoIncrementID: function () {
            ylayer.incrementID += 1;
            return ylayer.incrementID;
        }
    };
    //消息框
    ylayer.msg = function () {
        var s = this;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.msg);
        switch (oftenFunc.isType(option)) {
            case 'object':
                var fixedAttr = ['isMask'];
                Object.keys(option).forEach(function (name) {
                    if (name in config && fixedAttr.indexOf(name) === -1) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                if (arguments[1] !== undefined) {
                    config.duration = arguments[1];
                }
                break;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            config.content = '<div class="pl-msg">' + config.content + '</div>';
            var box = new BoxMsg(config);
            s.history.push(box);
            return box;
        }
    };
    //遮罩层
    ylayer.mask = function () {
        var s = this;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.mask);
        switch (oftenFunc.isType(option)) {
            case 'object':
                Object.keys(option).forEach(function (name) {
                    if (name in config) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.maskColor = option;
                break;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            var box = new BoxMsg(config);
            s.history.push(box);
            return box;
        }
    };
    //tips
    ylayer.tips = function () {
        var s = this;
        var msgbox;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.prompt);
        var wrapper = document.createElement('div');
        wrapper.innerHTML = '<div class="pl-tips"></div>';
        var elementCache = {
            'pl-tips': wrapper.querySelector('.pl-tips')
        };
        switch (oftenFunc.isType(option)) {
            case 'object':
                var fixedAttr = ['module'];
                Object.keys(option).forEach(function (name) {
                    if (name in config && fixedAttr.indexOf(name) === -1) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                if (oftenFunc.isType(arguments[1]) === 'function') {
                    config.callback = arguments[1];
                }
                if (arguments[2] !== undefined) {
                    config.isCanEmpty = arguments[2];
                }
                break;
        }
        if (oftenFunc.isType(config.callback) === 'function') {
            config.btnEvent[1] = callback;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            elementCache['pl-text'].innerText = config.content;
            elementCache['pl-input'].setAttribute('type', config.inputType);
            config.content = elementCache['pl-prompt'];

            msgbox = new BoxMsg(config);
            s.history.push(msgbox);
            return msgbox;
        }
    };
    //页面弹出框
    ylayer.open = function () {
        var s = this;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.open);
        switch (oftenFunc.isType(option)) {
            case 'object':
                Object.keys(option).forEach(function (name) {
                    if (name in config) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                if (arguments[1] !== undefined) {
                    config.title = arguments[1];
                }
                break;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            var box = new BoxMsg(config);
            s.history.push(box);
            return box;
        }
    };
    //提示框
    ylayer.alert = function () {
        var s = this;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.alert);
        switch (oftenFunc.isType(option)) {
            case 'object':
                Object.keys(option).forEach(function (name) {
                    if (name in config) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                break;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            config.content = '<div class="pl-alert">' + config.content + '</div>';
            var box = new BoxMsg(config);
            s.history.push(box);
            return box;
        }
    };
    //输入框
    ylayer.prompt = function () {
        var s = this;
        var msgbox;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.prompt);
        var wrapper = document.createElement('div');
        wrapper.innerHTML = ' \
            <div class="pl-prompt">\
                <div class="pl-text"></div>\
                <div class="pl-input"><input value=""></div>\
            </div>\
        ';
        var elementCache = {
            'pl-prompt': wrapper.querySelector('.pl-prompt'),
            'pl-text': wrapper.querySelector('.pl-text'),
            'pl-input': wrapper.querySelector('.pl-input input')
        };
        var callback = function () {
            if (oftenFunc.isType(config.callback) === 'function') {
                var val = elementCache['pl-input'].value;
                if (!config.isCanEmpty && !config.verifyRegExp.test(val)) {
                    ylayer.msg(config.verifyErrorText);
                } else {
                    config.callback.call(msgbox, val);
                }
            }
        };
        switch (oftenFunc.isType(option)) {
            case 'object':
                var fixedAttr = ['button', 'btnEvent'];
                Object.keys(option).forEach(function (name) {
                    if (name in config && fixedAttr.indexOf(name) === -1) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                if (oftenFunc.isType(arguments[1]) === 'function') {
                    config.callback = arguments[1];
                }
                if (arguments[2] !== undefined) {
                    config.isCanEmpty = arguments[2];
                }
                break;
        }
        if (oftenFunc.isType(config.callback) === 'function') {
            config.btnEvent[1] = callback;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            elementCache['pl-text'].innerText = config.content;
            elementCache['pl-input'].setAttribute('type', config.inputType);
            config.content = elementCache['pl-prompt'];

            msgbox = new BoxMsg(config);
            s.history.push(msgbox);
            return msgbox;
        }
    };
    //询问框
    ylayer.confirm = function () {
        var s = this;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.confirm);
        switch (oftenFunc.isType(option)) {
            case 'object':
                Object.keys(option).forEach(function (name) {
                    if (name in config) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                if (oftenFunc.isType(arguments[1]) === 'function') {
                    config.btnEvent[0] = arguments[1];
                }
                if (oftenFunc.isType(arguments[2]) === 'function') {
                    config.btnEvent[1] = arguments[2];
                }
                break;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            config.content = '<div class="pl-prompt">' + config.content + '</div>';
            var box = new BoxMsg(config);
            s.history.push(box);
            return box;
        }
    };
    //加载提示
    ylayer.loading = function () {
        var s = this;
        var msgbox;
        var option = arguments[0];
        var config = oftenFunc.clone(s.defaultConfig.prompt);
        var wrapper = document.createElement('div');
        wrapper.innerHTML = ' \
            <div class="popup-layer-wrapper" data-mode="content" data-tran="popup" data-exist="0" data-show="0">\
                <div class="pl-mian-wrapper">\
                    <div class="pl-content">\
                        <div class="pl-loading">\
                            <div class="pl-icon pl-icon-loading"></div>\
                            <div class="pl-text">加载中...</div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        ';
        var elementCache = {
            'pl-prompt': wrapper.querySelector('.pl-prompt'),
            'pl-text': wrapper.querySelector('.pl-text'),
            'pl-input': wrapper.querySelector('.pl-input input')
        };
        var callback = function () {
            if (oftenFunc.isType(config.callback) === 'function') {
                var val = elementCache['pl-input'].value;
                if (!config.isCanEmpty && !config.verifyRegExp.test(val)) {
                    ylayer.msg(config.verifyErrorText);
                } else {
                    config.callback.call(msgbox, val);
                }
            }
        };
        switch (oftenFunc.isType(option)) {
            case 'object':
                var fixedAttr = ['button', 'btnEvent'];
                Object.keys(option).forEach(function (name) {
                    if (name in config && fixedAttr.indexOf(name) === -1) {
                        config[name] = option[name];
                    }
                });
                break;
            default:
                config.content = option;
                if (oftenFunc.isType(arguments[1]) === 'function') {
                    config.callback = arguments[1];
                }
                if (arguments[2] !== undefined) {
                    config.isCanEmpty = arguments[2];
                }
                break;
        }
        if (oftenFunc.isType(config.callback) === 'function') {
            config.btnEvent[1] = callback;
        }
        if (config.isCloseOther) {
            s.history.forEach(function (item) {
                item.close();
            });
            s.history = [];
        }
        if (config.content !== null) {
            elementCache['pl-text'].innerText = config.content;
            elementCache['pl-input'].setAttribute('type', config.inputType);
            config.content = elementCache['pl-prompt'];

            msgbox = new BoxMsg(config);
            s.history.push(msgbox);
            return msgbox;
        }
    };
    //暴露入口
    window.ylayer = ylayer;
})(window);