define(['cache', 'request', 'lib/picture', 'lib/drawing', 'lib/debug'], function (cache, request, picture, drawing, debug) {


    var Renderer = picture;
    var imageCache = cache;
    var drawingAPI = drawing;
    var requestWorker = request;
    var Debugger = debug;


    Debugger.log("Invoking canvas module..");
    var module = {

        object: [],
        controls: [],
        index: {},
        limit: 11,
        complete: 0,
        caption: "Loading...",
        clear: function () {
            this.object = [];
            this.complete = 0;
            var that = this;
            require(['lib/control'], function (control) {
                var play = control.canvas_play();
                var prev = control.nextbutton(this, function () {
                    require('lib/element').next(-1);
                }, 618, '#0ff', -1);
                var next = control.nextbutton(this, function () {
                    require('lib/element').next(1);
                }, 666, '#0ff', 1);
                var sort = control.sortbutton(this, function () {
                    require('lib/element').onoffHilo();
                }, 702);
                that.controls = [prev, next, play, sort];
            });
        },

        write: function (text) {
            this.caption = text;
            this.done();
        },

        button: function () {
            if (!this.workspace) return;
            var canvas = this.workspace, context = canvas.getContext('2d');
            for (var c, i = 0; c = this.controls[i]; i++) {
                c.draw(context);
                Debugger.log("Drew button: " + c.x1 + "x" + c.y1);
            }
        },
        frameIndex : 0,
        frameEOL   : function () { return !(this.frameIndex < this.object.length) },
        framePeek  : function () { return this.object[ this.frameIndex ++ ] },
        nextFrame  : function () {
            if (this.frameEOL() || !this.workspace) return this.button();
            var canvas = this.workspace, context = canvas.getContext('2d'), w = canvas.offsetWidth, h = canvas.offsetHeight, 
                 object = this.framePeek ();  
            console.log("Drawing: " + this.frameIndex);
            object.draw (canvas, this.frameIndex); 
        },
        fingerprint : {  stale : "", fresh : ""  }, 


        fingerPrint : function () {
            var that = this, objs = this.object, key = [];
		require (['lib/md5'], function (cryptor) {
                    for (var o,i=0;o=objs[i];i++) {
                        if (o.source) {
                            key.push (cryptor.md5(o.source));
                        }
                    }
                    key = cryptor.md5(key.join(""));
                    that.done_(key);
                });
        },

        done_       : function (key) {
            if (key == this.fingerprint.stale || key == this.fingerprint.fresh) return Debugger.log("IGNORING: " + key);
            this.fingerprint.stale = this.fingerprint.fresh;
            this.fingerprint.fresh = key;

            var that = this; 

            Debugger.log("this.fingerprint.stale: " + this.fingerprint.stale);
            Debugger.log("this.fingerprint.fresh: " + this.fingerprint.fresh);
            $("#canvas-teeny").each(function () {
                var context = this.getContext('2d');
                context.clearRect(0, 0, this.width, this.height); 
                that.workspace = this;
            });
            this.frameIndex = 0;
            this.nextFrame();
            
        },

        done       : function () {
            Debugger.log("Canvas done: " + this.caption);
            this.fingerPrint();
        },

        create: function (article, index) {

            var myself = this, id = this.object.length, object = {
                id: id,
                picture: undefined,
                source: undefined,
                index: index,
                size: 64,
                article: article,
                fieldname: "thumb",
                caption: "#" + index, // article.substr(0, 4),
                draw: function (canvas, limit) {
                    var thumbnail = new Image(), w = 64, span = w + 1, y = 1,
                       context = canvas.getContext('2d'), article = this.article, offset = span * (myself.limit - myself.object.length),
                       should_offset = myself.object.length < myself.limit && this.index < myself.limit, offset_x = should_offset ? offset : 0,
                        margin = 3, position = limit - this.id, x = (this.id * span) + offset_x, 
                          caption = this.id + "/" + myself.object.length + ") " + myself.caption,
                           sizeof = myself.object.length, stamp = new Date().getMilliseconds(), picture_caption = this.caption,
                             message = "Canvas index #" + this.index + "/" + this.id + ":" + this.article;  

                    var done = function () {
                        context.clearRect(0, 84, canvas.width - 110, 20);
                        drawingAPI.imagestring(context, "700 9pt Lato", 10, 92, caption, "#222");
                        myself.nextFrame(); //button(context);
                    };

                    drawingAPI.imagefilledrectangle(context, x, y - 1, span + 1, span + 1, "#cfc");
                    drawingAPI.imagestring(context, "700 9pt Lato", x + 10, 14, picture_caption, "#922");
                    if (this.source) {
                        x += margin;    
                        thumbnail.onload = function () {
                            context.globalAlpha = 1;
                            context.clearRect(x, y - 1, span + 1, span + 6);
                            drawingAPI.imagecopyresized(context, this, 0, 0, this.width, this.height, x + 1, y, span - 1, span - 1);
                            if (article == SELECTED_PICTURE) {
                                var x1 = x + 1, x2 = x1 + span - 1, y1 = y + 68, y2 = y1;
                                drawingAPI.imageline(context, x1, y1, x2, y2, "#f00", 2);
                            }
                            Debugger.log(message);
                            done();
                        }
                        thumbnail.onerror = function () {
                            drawingAPI.imagefilledrectangle(context, x, y - 1, span + 1, span + 1, "#fdd");
                            drawingAPI.imagestring(context, "700 9pt Lato", x + 10, 14, picture_caption, "#922");
                            Debugger.log("!FAIL :: " + message); done();
                        }
                        thumbnail.src = this.source;
                        return;
                    }
                    done();
                },
                load: function () {
                    var source, that = this;

                    myself.index[this.article] = this.index;
                    this.command = requestWorker.format.command(this.article);
                    this.picture = requestWorker.format.picture(this.article, "thumb");

                    this.element = {
                        show: function (response) {
                        },
                        done: function () {
                            Renderer.canvas(that);
                        },
                        good: function (source) {
                            that.source = source;
                            imageCache.remember(that, source);
                            myself.complete++;
                            if (myself.complete >= myself.object.length && myself.done) {
                                myself.done();
                            }
                        }
                    }
                    if (source = imageCache.remembers(that)) {
                        return this.element.good(source);
                    }
                    Debugger.log("Looking up " + this.article + "...");
                    myself.done();
                    requestWorker.open(this);
                }
            }
//            object.load();
            this.object.push(object);
            return object;

        },

        attach: function () {
            for (var t, i = 0; t = this.object[i++]; t.load());
        }



    }

    return module;
});
