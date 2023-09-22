/**
 * Roundcube common js library
 *
 * This file is part of the Roundcube Webmail client
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (c) The Roundcube Dev Team
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */
var CONTROL_KEY = 1
  , SHIFT_KEY = 2
  , CONTROL_SHIFT_KEY = 3;
function roundcube_browser() {
    var e = navigator;
    this.agent = e.userAgent,
    this.agent_lc = e.userAgent.toLowerCase(),
    this.name = e.appName,
    this.vendor = e.vendor || "",
    this.vendver = e.vendorSub ? parseFloat(e.vendorSub) : 0,
    this.product = e.product || "",
    this.platform = String(e.platform).toLowerCase(),
    this.lang = e.language ? e.language.substring(0, 2) : e.browserLanguage ? e.browserLanguage.substring(0, 2) : e.systemLanguage ? e.systemLanguage.substring(0, 2) : "en",
    this.win = 0 <= this.platform.indexOf("win"),
    this.mac = 0 <= this.platform.indexOf("mac"),
    this.linux = 0 <= this.platform.indexOf("linux"),
    this.unix = 0 <= this.platform.indexOf("unix"),
    this.dom = !!document.getElementById,
    this.dom2 = document.addEventListener && document.removeEventListener,
    this.edge = 0 < this.agent_lc.indexOf(" edge/") || 0 < this.agent_lc.indexOf(" edg/"),
    this.webkit = !this.edge && 0 < this.agent_lc.indexOf("applewebkit"),
    this.ie = document.all && !window.opera || this.win && 0 < this.agent_lc.indexOf("trident/"),
    window.opera ? (this.opera = !0,
    this.vendver = opera.version()) : this.ie || this.edge || (this.chrome = 0 < this.agent_lc.indexOf("chrome"),
    this.opera = this.webkit && 0 < this.agent.indexOf(" OPR/"),
    this.safari = !this.chrome && !this.opera && (this.webkit || 0 < this.agent_lc.indexOf("safari")),
    this.konq = 0 < this.agent_lc.indexOf("konqueror"),
    this.mz = this.dom && !this.chrome && !this.safari && !this.konq && !this.opera && 0 <= this.agent.indexOf("Mozilla"),
    this.iphone = this.safari && (0 < this.agent_lc.indexOf("iphone") || 0 < this.agent_lc.indexOf("ipod") || "ipod" == this.platform || "iphone" == this.platform),
    this.ipad = this.safari && (0 < this.agent_lc.indexOf("ipad") || "ipad" == this.platform)),
    this.vendver || (pattern = this.ie ? /(msie|rv)(\s|:)([0-9\.]+)/ : this.edge ? /(edge?)(\/)([0-9\.]+)/ : this.opera ? /(opera|opr)(\/)([0-9\.]+)/ : this.konq ? /(konqueror)(\/)([0-9\.]+)/ : this.safari ? /(version)(\/)([0-9\.]+)/ : this.chrome ? /(chrome)(\/)([0-9\.]+)/ : this.mz ? /(firefox)(\/)([0-9\.]+)/ : /(khtml|safari|applewebkit|rv)(\s|\/|:)([0-9\.]+)/,
    this.vendver = pattern.test(this.agent_lc) ? parseFloat(RegExp.$3) : 0),
    this.safari && /;\s+([a-z]{2})-[a-z]{2}\)/.test(this.agent_lc) && (this.lang = RegExp.$1),
    this.mobile = /iphone|ipod|blackberry|iemobile|opera mini|opera mobi|mobile/i.test(this.agent_lc),
    this.tablet = !this.mobile && /ipad|android|xoom|sch-i800|playbook|tablet|kindle/i.test(this.agent_lc),
    this.touch = this.mobile || this.tablet,
    this.pointer = "function" == typeof window.PointerEvent,
    this.cookies = e.cookieEnabled,
    this.set_html_class = function() {
        var e = " js";
        this.ie ? e += " ms ie ie" + parseInt(this.vendver) : this.edge && 74 < this.vendver ? e += " chrome" : this.edge ? e += " ms edge" : this.opera ? e += " opera" : this.konq ? e += " konqueror" : this.safari || this.chrome ? e += " chrome" : this.mz && (e += " mozilla"),
        this.iphone ? e += " iphone" : this.ipad ? e += " ipad" : this.webkit && (e += " webkit"),
        this.mobile && (e += " mobile"),
        this.tablet && (e += " tablet"),
        document.documentElement && (document.documentElement.className += e)
    }
}
var rcube_event = {
    get_target: function(e) {
        return (e = e || window.event) && e.target ? e.target : e.srcElement || document
    },
    get_keycode: function(e) {
        return (e = e || window.event) && e.keyCode ? e.keyCode : e && e.which ? e.which : 0
    },
    get_button: function(e) {
        return (e = e || window.event) && void 0 !== e.button ? e.button : e && e.which ? e.which : 0
    },
    get_modifier: function(e) {
        var t = 0;
        return e = e || window.event,
        bw.mac && e ? t += (e.metaKey && CONTROL_KEY) + (e.shiftKey && SHIFT_KEY) : e && (t += (e.ctrlKey && CONTROL_KEY) + (e.shiftKey && SHIFT_KEY)),
        t
    },
    get_mouse_pos: function(e) {
        var t = (e = e || window.event).pageX || e.clientX
          , n = e.pageY || e.clientY;
        return document.body && document.all && (t += document.body.scrollLeft,
        n += document.body.scrollTop),
        e._offset && (t += e._offset.left,
        n += e._offset.top),
        {
            x: t,
            y: n
        }
    },
    add_listener: function(t) {
        var e;
        t.object && t.method && (t.element || (t.element = document),
        t.object._rc_events || (t.object._rc_events = {}),
        e = t.event + "*" + t.method,
        t.object._rc_events[e] || (t.object._rc_events[e] = function(e) {
            return t.object[t.method](e)
        }
        ),
        t.element.addEventListener ? t.element.addEventListener(t.event, t.object._rc_events[e], !1) : t.element.attachEvent ? (t.element.detachEvent("on" + t.event, t.object._rc_events[e]),
        t.element.attachEvent("on" + t.event, t.object._rc_events[e])) : t.element["on" + t.event] = t.object._rc_events[e])
    },
    remove_listener: function(e) {
        e.element || (e.element = document);
        var t = e.event + "*" + e.method;
        e.object && e.object._rc_events && e.object._rc_events[t] && (e.element.removeEventListener ? e.element.removeEventListener(e.event, e.object._rc_events[t], !1) : e.element.detachEvent ? e.element.detachEvent("on" + e.event, e.object._rc_events[t]) : e.element["on" + e.event] = null)
    },
    cancel: function(e) {
        e = e || window.event;
        return e.preventDefault ? e.preventDefault() : e.returnValue = !1,
        e.stopPropagation && e.stopPropagation(),
        !(e.cancelBubble = !0)
    },
    is_keyboard: function(e) {
        return !!e && (e.type ? !!e.type.match(/^key/) || "click" == e.type && !e.clientX : !e.pageX && (e.pageY || 0) <= 0 && !e.clientX && (e.clientY || 0) <= 0)
    },
    keyboard_only: function(e) {
        return !!rcube_event.is_keyboard(e) || rcube_event.cancel(e)
    },
    touchevent: function(e) {
        return {
            pageX: e.pageX,
            pageY: e.pageY,
            offsetX: e.pageX - e.target.offsetLeft,
            offsetY: e.pageY - e.target.offsetTop,
            target: e.target,
            istouch: !0
        }
    }
};
function rcube_event_engine() {
    this._events = {}
}
function rcube_check_email(e, t, n, i) {
    if (!e)
        return !!n && 0;
    n && (t = !0);
    var o = i ? "([^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+|\\x22([^\\x0d\\x22\\x5c\\x80-\\xff]|\\x5c[\\x00-\\x7f])*\\x22)" : "[^\\u0000-\\u0020\\u002e\\u00a0\\u0040\\u007f\\u2028\\u2029]+"
      , i = "[,;\\s\\n]"
      , o = "((" + (o + "(\\x2e" + o + ")*") + "\\x40(((\\[(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}\\])|(\\[IPv6:[0-9a-f:.]+\\]))|(([^@.]+\\.)+([^\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\x7f]{2,}|s|xn--[a-z0-9]{2,}))))|(" + ("mailtest\\x40(" + ["\\u0645\\u062b\\u0627\\u0644\\x2e\\u0625\\u062e\\u062a\\u0628\\u0627\\u0631", "\\u4f8b\\u5b50\\x2e\\u6d4b\\u8bd5", "\\u4f8b\\u5b50\\x2e\\u6e2c\\u8a66", "\\u03c0\\u03b1\\u03c1\\u03ac\\u03b4\\u03b5\\u03b9\\u03b3\\u03bc\\u03b1\\x2e\\u03b4\\u03bf\\u03ba\\u03b9\\u03bc\\u03ae", "\\u0909\\u0926\\u093e\\u0939\\u0930\\u0923\\x2e\\u092a\\u0930\\u0940\\u0915\\u094d\\u0937\\u093e", "\\u4f8b\\u3048\\x2e\\u30c6\\u30b9\\u30c8", "\\uc2e4\\ub840\\x2e\\ud14c\\uc2a4\\ud2b8", "\\u0645\\u062b\\u0627\\u0644\\x2e\\u0622\\u0632\\u0645\\u0627\\u06cc\\u0634\\u06cc", "\\u043f\\u0440\\u0438\\u043c\\u0435\\u0440\\x2e\\u0438\\u0441\\u043f\\u044b\\u0442\\u0430\\u043d\\u0438\\u0435", "\\u0b89\\u0ba4\\u0bbe\\u0bb0\\u0ba3\\u0bae\\u0bcd\\x2e\\u0baa\\u0bb0\\u0bbf\\u0b9f\\u0bcd\\u0b9a\\u0bc8", "\\u05d1\\u05f2\\u05b7\\u05e9\\u05e4\\u05bc\\u05d9\\u05dc\\x2e\\u05d8\\u05e2\\u05e1\\u05d8"].join("|") + ")") + "))"
      , o = t ? new RegExp("(^|<|" + i + ")" + o + "($|>|" + i + ")",n ? "ig" : "i") : new RegExp("^" + o + "$","i");
    if (n) {
        n = e.match(o);
        return n ? n.length : 0
    }
    return o.test(e)
}
function rcube_clone_object(e) {
    var t, n = {};
    for (t in e)
        e[t] && "object" == typeof e[t] ? n[t] = rcube_clone_object(e[t]) : n[t] = e[t];
    return n
}
function urlencode(e) {
    return window.encodeURIComponent ? encodeURIComponent(e).replace("*", "%2A") : escape(e).replace("+", "%2B").replace("*", "%2A").replace("/", "%2F").replace("@", "%40")
}
function rcube_find_object(e, t) {
    var n, i, o, r;
    if ((t = t || document).getElementById && (o = t.getElementById(e)))
        return o;
    if (!(o = !(o = !(o = !o && t.getElementsByName && (r = t.getElementsByName(e)) ? r[0] : o) && t.all ? t.all[e] : o) && t.images.length ? t.images[e] : o) && t.forms.length)
        for (i = 0; i < t.forms.length; i++)
            t.forms[i].name == e ? o = t.forms[i] : t.forms[i].elements[e] && (o = t.forms[i].elements[e]);
    if (!o && t.layers)
        for (t.layers[e] && (o = t.layers[e]),
        n = 0; !o && n < t.layers.length; n++)
            o = rcube_find_object(e, t.layers[n].document);
    return o
}
function rcube_mouse_is_over(e, t) {
    var n = rcube_event.get_mouse_pos(e)
      , e = $(t).offset();
    return n.x >= e.left && n.x < e.left + t.offsetWidth && n.y >= e.top && n.y < e.top + t.offsetHeight
}
function setCookie(e, t, n, i, o, r) {
    r = e + "=" + escape(t) + (n ? "; expires=" + n.toGMTString() : "") + (i ? "; path=" + i : "") + (o ? "; domain=" + o : "") + (r ? "; secure" : "") + "; SameSite=Lax";
    document.cookie = r
}
function getCookie(e) {
    var t = document.cookie
      , n = e + "="
      , i = t.indexOf("; " + n);
    if (-1 == i) {
        if (0 != (i = t.indexOf(n)))
            return null
    } else
        i += 2;
    e = t.indexOf(";", i);
    return -1 == e && (e = t.length),
    unescape(t.substring(i + n.length, e))
}
rcube_event_engine.prototype = {
    addEventListener: function(e, t, n) {
        return this._events || (this._events = {}),
        this._events[e] || (this._events[e] = []),
        this._events[e].push({
            func: t,
            obj: n || window
        }),
        this
    },
    removeEventListener: function(e, t, n) {
        void 0 === n && (n = window);
        for (var i, o = 0; this._events && this._events[e] && o < this._events[e].length; o++)
            (i = this._events[e][o]) && i.func == t && i.obj == n && (this._events[e][o] = null)
    },
    triggerEvent: function(e, t) {
        function n(e) {
            try {
                e && e.event && delete e.event
            } catch (e) {}
        }
        var i, o;
        if (void 0 === t ? t = this : "object" == typeof t && (t.event = e),
        this._event_exec || (this._event_exec = {}),
        this._events && this._events[e] && !this._event_exec[e]) {
            this._event_exec[e] = !0;
            for (var r = 0; r < this._events[e].length && (!(o = this._events[e][r]) || ("function" == typeof o.func ? i = o.func.call ? o.func.call(o.obj, t) : o.func(t) : "function" == typeof o.obj[o.func] && (i = o.obj[o.func](t)),
            void 0 === i || i)); r++)
                ;
            n(i)
        }
        return delete this._event_exec[e],
        n(t),
        i
    }
},
roundcube_browser.prototype.set_cookie = setCookie,
roundcube_browser.prototype.get_cookie = getCookie;
var bw = new roundcube_browser;
bw.set_html_class(),
RegExp.escape = function(e) {
    return String(e).replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1")
}
,
Date.prototype.getStdTimezoneOffset = function() {
    for (var e = 12, t = new Date(null,e,1), n = t.getTimezoneOffset(); --e; )
        if (t.setUTCMonth(e),
        n != t.getTimezoneOffset())
            return Math.max(n, t.getTimezoneOffset());
    return n
}
,
String.prototype.startsWith || (String.prototype.startsWith = function(e, t) {
    return this.slice(t = t || 0, e.length) === e
}
),
String.prototype.endsWith || (String.prototype.endsWith = function(e, t) {
    var n = this.toString();
    ("number" != typeof t || !isFinite(t) || Math.floor(t) !== t || t > n.length) && (t = n.length),
    t -= e.length;
    e = n.lastIndexOf(e, t);
    return -1 !== e && e === t
}
),
jQuery.last = function(e) {
    return e && e.length ? e[e.length - 1] : void 0
}
,
jQuery.fn.placeholder = function(e) {
    return this.each(function() {
        $(this).prop({
            title: e,
            placeholder: e
        })
    })
}
;
var rcube_parse_query = function(e) {
    if (!e)
        return {};
    function t(e) {
        return decodeURIComponent(e.replace(s, " "))
    }
    var n, i, o = {}, r = /([^&=]+)=?([^&]*)/g, s = /\+/g;
    for (e = e.replace(/\?/, ""); i = r.exec(e); )
        n = t(i[1]),
        i = t(i[2]),
        "[]" === n.substring(n.length - 2) ? (o[n = n.substring(0, n.length - 2)] || (o[n] = [])).push(i) : o[n] = i;
    return o
}
  , Base64 = function() {
    function h(e) {
        for (var t, n, i = 0, o = "", r = 0; i < e.length; )
            (t = e.charCodeAt(i)) < 128 ? (o += String.fromCharCode(t),
            i++) : 191 < t && t < 224 ? (r = e.charCodeAt(i + 1),
            o += String.fromCharCode((31 & t) << 6 | 63 & r),
            i += 2) : (r = e.charCodeAt(i + 1),
            n = e.charCodeAt(i + 2),
            o += String.fromCharCode((15 & t) << 12 | (63 & r) << 6 | 63 & n),
            i += 3);
        return o
    }
    var f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    return {
        encode: function(e) {
            if (e = function(e) {
                e = e.replace(/\r\n/g, "\n");
                for (var t = "", n = 0; n < e.length; n++) {
                    var i = e.charCodeAt(n);
                    i < 128 ? t += String.fromCharCode(i) : (127 < i && i < 2048 ? t += String.fromCharCode(i >> 6 | 192) : (t += String.fromCharCode(i >> 12 | 224),
                    t += String.fromCharCode(i >> 6 & 63 | 128)),
                    t += String.fromCharCode(63 & i | 128))
                }
                return t
            }(e),
            "function" == typeof window.btoa)
                try {
                    return btoa(e)
                } catch (e) {}
            for (var t, n, i, o, r, s, u = 0, a = "", c = e.length; u < c; )
                i = (s = e.charCodeAt(u++)) >> 2,
                o = (3 & s) << 4 | (t = e.charCodeAt(u++)) >> 4,
                r = (15 & t) << 2 | (n = e.charCodeAt(u++)) >> 6,
                s = 63 & n,
                isNaN(t) ? r = s = 64 : isNaN(n) && (s = 64),
                a = a + f.charAt(i) + f.charAt(o) + f.charAt(r) + f.charAt(s);
            return a
        },
        decode: function(e) {
            if ("function" == typeof window.atob)
                try {
                    return h(atob(e))
                } catch (e) {}
            for (var t, n, i, o, r, s, u = 0, a = "", c = (e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "")).length; u < c; )
                i = f.indexOf(e.charAt(u++)),
                t = (15 & (o = f.indexOf(e.charAt(u++)))) << 4 | (r = f.indexOf(e.charAt(u++))) >> 2,
                n = (3 & r) << 6 | (s = f.indexOf(e.charAt(u++))),
                a += String.fromCharCode(i << 2 | o >> 4),
                64 != r && (a += String.fromCharCode(t)),
                64 != s && (a += String.fromCharCode(n));
            return h(a)
        }
    }
}();
