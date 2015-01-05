define(['lib/drawing', 'request'], function (drawing, request) {
    var drawingAPI = drawing;
    var requestWorker = request;

    return {
        drawing: drawing,


        control: function (worker, onclick) {
            var object = {
                worker: worker,
                onclick: onclick,
                contains: function (x, y) {
                    return x > this.x1 && x < this.x2 && y > this.y1 && y < this.y2;
                },
                draw: function (context) {
                    this.context = context;
                    this.render();
//                    drawingAPI.imagefilledrectangle(context, this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1, "#f41");
                },
                click: function (x, y, sender) {
                    if (this.contains(x, y)) {
                        this.onclick(sender);
                        return true;
                    }
                    return false;
                },
                params: function () {
                    var worker = this.worker, base_width = worker.state ? 160 : 100,
                    bookmarked = worker.bookmarked && worker.bookmarked.length,
                      offset_width = worker.state ? 132 : 78, panel_width = base_width,
                      panel_y = 32, loc = { x: worker.size - panel_width };
                    return {
                        base_width: base_width,
                        bookmarked: bookmarked,
                        offset_width: offset_width,
                        panel_width: panel_width,
                        panel_y: panel_y,
                        loc: loc
                    };
                }
            }
            return object;
        },

        text: function (value, font, x, y) {
            var object = this.control();
            object.font = font;
            object.value = value;
            object.x = x;
            object.y = y;
            object.render = function () {
                if (this.value != undefined) {
                    drawingAPI.imagestring(this.context, this.font, this.x + 1, this.y + 1, this.value, "#fff");
                    drawingAPI.imagestring(this.context, this.font, this.x, this.y, this.value, "#297");
                }
            }
            return object;
        },

        count: function (worker) {
            return this.text(worker.count, "700 9pt Lato", THUMB_SIZE - 80, 20);
        },

        playbutton: function (state, radius, x, y, onclick, fill, stroke, worker) {
            var that = this, object = this.control(worker, onclick);
            object.fill = fill;
            object.stroke = stroke;

            object.render = function () {

                var context = this.context, half = radius / 2;

                this.y1 = y - radius;
                this.y2 = y + radius;
                this.x1 = x - radius;
                this.x2 = x + radius;

                if (state === 0) {
                    return;
                }

                that.circle(context, x, y, radius, this.fill, this.stroke);

                var x1 = x + 1;

                if (state == 2) {
                    drawingAPI.imagefilledrectangle(context, x1, y - half, 3, radius, "#fff");
                    drawingAPI.imagefilledrectangle(context, x1 - 5, y - half, 3, radius, "#fff");
                } else {
                    drawingAPI.imagetriangle(context, x + (half * 0.75), y, half, "#666", "#fff");
                }
            }
            return object;
        },

        circle: function (context, x, y, radius, fill, stroke) {
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI, false);
            context.fillStyle = fill;
            context.fill();
            context.lineWidth = 1;
            context.strokeStyle = stroke;
            context.stroke();
            context.closePath();
        },

        nextbutton: function (worker, onclick, x, hue, direction) {
            var that = this, object = this.control(worker, onclick);

            object.render = function () {

                var context = this.context, width = 32, height = 16, half_h = height / 2, half_w = width / 2, y = 78;

                this.y1 = y;
                this.y2 = y + height;
                this.x1 = x;
                this.x2 = x + width;

                var x2 = direction > 0 ? (this.x2 - this.x1 - half_h) : (this.x2 - this.x1),
                       x1 = direction > 0 ? this.x1 : (this.x1 + half_h), y2 = y + half_h;

                if (direction > 0) {
                    that.circle(context, this.x2 - half_h, y2, half_h, '#9c9', '#ffe');
                } else {
                    that.circle(context, this.x1 + half_h, y + half_h, half_h, '#9c9', '#ffe');
                }

                drawingAPI.imagefilledrectangle(context, x1, this.y1, x2, this.y2 - this.y1, '#9c9');

                if (direction > 0) {
                    drawingAPI.imagetriangle(context, this.x2 - height, y2, 4, "#fff", "#fff");
                    drawingAPI.imagetriangle(context, this.x2 - height + 4, y2, 4, "#fff", "#fff");
                } else {
                    drawingAPI.imagetriangle(context, this.x1 + height, y2, 4, "#fff", "#fff", -1);
                    drawingAPI.imagetriangle(context, this.x1 + height - 4, y2, 4, "#fff", "#fff", -1);
                }
            }
            return object;
        },

        sortbutton: function (worker, onclick, x) {
            var that = this, object = this.control(worker, onclick);
            object.render = function () {

                var context = this.context, y = 74;

                this.y1 = y;
                this.y2 = y + 24;
                this.x1 = x;
                this.x2 = x + 24;

                var x1 = x + 15, y1 = y + 4, x2 = x1, y2 = y1 + 16 ,
                   back = !DIALOG_HILO ? "#090" : "#ffe", fore = !DIALOG_HILO ? "#fff" : "#222";

                drawingAPI.imagefilledrectangle(context, this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1, back);
                drawingAPI.imageline(context, x1, y1, x2, y2, fore, 2);

                drawingAPI.imagetriangle(context, x1, y1, 3, fore, fore, -2);
                drawingAPI.imagetriangle(context, x2, y2, 3, fore, fore, 2);

                drawingAPI.imagestring(this.context, "400 7pt Lato", x1 - 10, y1 + 7, "A", fore);
                drawingAPI.imagestring(this.context, "400 7pt Lato", x1 - 10, y1 + 16, "Z", fore);
            }
            return object;
        },

        canvas_play: function () {
            return this.playbutton(PLAYER_PLAYING ? 2 : 1, 14, 658, 86, function () {
                require('lib/element').playpauseCanvas();
            }, '#9c9', '#090');
        },

        play: function (worker, onclick) {
            var x = THUMB_SIZE / 2;
            return this.playbutton(worker.state ? 0 : 1, 32, x, x, onclick, 'rgba(255,255,255,0.5)', '#fff', worker);
        },

        pause: function (worker, onclick) {
            var object = this.control(worker, onclick);
            object.render = function () {

                var params = this.params(), x = params.loc.x + params.offset_width, y = params.panel_y / 2,
                 context = this.context;

                this.y1 = y - 6;
                this.y2 = y + 6;
                this.x1 = x - 16;
                this.x2 = x - 6;
                return;

                if (this.worker.state) {

                    drawingAPI.imagefilledrectangle(context, this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1, "#ff0");
                    drawingAPI.imagefilledrectangle(context, x - 11, y - 6, 3, 10, "#222");
                    drawingAPI.imagefilledrectangle(context, x - 16, y - 6, 3, 10, "#222");
                }
            }
            return object;
        },
        star: function (worker) {
            var object = this.control(worker);
            object.render = function (sender) {
                var size = 20, x = THUMB_SIZE - size, y = 16,
                        context = this.context, hue = sender ? "#00f" : "#0f0", half = size / 2;

                this.y1 = 0;
                this.y2 = 32;
                this.x1 = x - half;
                this.x2 = x + half;

                //                drawingAPI.imagefilledrectangle(context, this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1, "#ff0"); 
                drawingAPI.imagestar(context, x, y, this.worker.bookmarked ? "#f00" : "#fff", half);

                if (sender) {
                    var ctx = sender.getContext('2d');
                    ctx.clearRect(0, 0, sender.width, sender.height);
                    ctx.drawImage(context.canvas, 0, 0);
                }
            }
            object.onclick = function (sender) {
                var star = this, w = this.worker,
                        address = requestWorker.format.bookmark(w.from || w.article);
                this.worker.bookmarked = this.worker.bookmarked ? null : "yes";
                $.get(address, function (data) {
                    star.render(sender);
                });
            }
            return object;
        }
    }
});

