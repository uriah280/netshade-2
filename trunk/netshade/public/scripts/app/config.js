
// set up require.js
requirejs.config({
    baseUrl: '/scripts/worker',
    paths: {
        app: '/scripts/app',
        lib: '/scripts/lib'
    }
}); 

// a few convenient global vars n funs
var 
    DEFAULT_SIZE = 1024,
    THUMB_SIZE = 244,
    TINY_SIZE = 64, 
    DIALOG_VISIBLE = true,
    DIALOG_HILO = true,
    SLIDE_OFFSET = 5,
    PLAYER_PLAYING = false,
    SELECTED_PICTURE = undefined, 
    NEXT_PAGE = undefined,

    $ajax = function (uri, callback) { 

        return $.ajax({
            type: "GET",
            url: uri,
            cache: false,
            success: callback
        });

    },

     shuffle = function (o) { //v1.0
         for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
         return o;
     },

    getUsername = function () {
        var rex = /user\/(\w+)\//, test = rex.exec(location.href);
        if (test) return test[1];
        var rex2 = /user\/(\w+)/, test2 = rex2.exec(location.href);
        if (test2) return test2[1];
    };
     

// useful prototypes
String.prototype.truncate = function (y) { try { return this.length > y ? (this.substr(0, y / 2) + '...' + this.substr(this.length - (y / 2))) : this } catch (ex) { return '' } };
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); };
String.prototype.format = function () {
    var o = this, r = { x: 0, r: /\{/g, s: '|+{+|', e: /\|\+\{\+\|/g, t: '{' };
    for (var i = 0; i < arguments.length; i++)
        while (o.indexOf('{' + i + '}') >= 0 && r.x++ < 32)
            try { o = o.replace('{' + i + '}', arguments[i].toString().replace(r.r, r.s)); }
            catch (ex) { }
    return o.replace(r.e, r.t);
}
 