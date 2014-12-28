define(['lib/picture', 'cache', 'request', 'lib/drawing', 'lib/debug'], function (picture, cache, request, drawing, debug) {
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

            var play = require('lib/control').canvas_play();
            this.controls = [play];  
        },

        write: function (text) {
            this.caption = text;
            this.done();
        },

        done: function () {
            var that = this;
            Debugger.log("Canvas done: " + this.caption);
            $("#canvas-teeny").each(function () {
                var context = this.getContext('2d'), w = this.offsetWidth, h = this.offsetHeight;

                context.clearRect(0, 0, this.width, this.height);
                for (var t, i = 0; t = that.object[i++]; t.draw(this, i));

                for (var c, i = 0; c = that.controls[i]; i++) {
                    c.draw(context);
                    Debugger.log("Drew button: " + c.x1 + "x" + c.y1 + ": " + c.fill);
                }

                //  drawingAPI.imagefilledrectangle(context, play.x1, play.y1, play.x2 - play.x1, play.y2 - play.y1, "#ff0");
            });
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
                       offset_x = myself.object.length < myself.limit && this.index < myself.limit ? offset : 0,
                        margin = 3, position = limit - this.id, x = (this.id * span) + offset_x, caption = myself.caption,
                           sizeof = myself.object.length, stamp = new Date().getMilliseconds(),
                             message = "Canvas index #" + this.index + "/" + this.id + ":" + this.article;

                    var done = function () {
                        context.clearRect(0, 74, canvas.width - 40, 20);
                        drawingAPI.imagestring(context, "700 9pt Lato", 10, 82, sizeof + ") " + caption + "(" + stamp + ")", "#222");
                    };

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
                            drawingAPI.imagefilledrectangle(context, x, y - 1, span + 1, span + 1, "#eef");
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
                            //                            if (response) return document.title = id + ") " + response.caption;
                            //                            document.title = id + ". No response";
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
                    requestWorker.open(this);
                }
            }
            object.load();
            this.object.push(object);
            return object;

        },

        attach: function () { 
        
        } 

         

    }

    return module;
});