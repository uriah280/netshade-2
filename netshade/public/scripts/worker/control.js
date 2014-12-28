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

        playbutton: function (state, size, x, y, onclick, fill, stroke, worker) {
            var object = this.control(worker, onclick);
            object.fill = fill;
            object.stroke = stroke;

            object.render = function () {

                var context = this.context, half = size / 2;

                this.y1 = y - size;
                this.y2 = y + size;
                this.x1 = x - size;
                this.x2 = x + size;

                if (state === 0) {
                    return;
                }

                context.beginPath();
                context.arc(x, y, Math.min(size, x - 20, y - 20), 0, 2 * Math.PI, false);
                context.fillStyle = this.fill; // 'rgba(255,255,255,0.5)';
                context.fill();
                context.lineWidth = 1;
                context.strokeStyle = this.stroke; // "#fff";
                context.stroke();
                context.closePath();

                var x1 = x + 1;

                if (state == 2) {
                    drawingAPI.imagefilledrectangle(context, x1, y - half, 3, size, "#fff");
                    drawingAPI.imagefilledrectangle(context, x1 - 5, y - half, 3, size, "#fff");
                } else {
                    drawingAPI.imagetriangle(context, x + (half * 0.75), y, half, "#666", "#fff");
                }
            }
            return object;
        },

        canvas_play: function () {
            return this.playbutton(PLAYER_PLAYING ? 2 : 1, 8, 708, 80, function () {
                require('element').playpauseCanvas(); 
            }, '#090', '#900');
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
                var star = this, w = this.worker, address = requestWorker.format.bookmark(w.article);
                this.worker.bookmarked = this.worker.bookmarked ? null : "yes";
                $.get(address, function (data) {
                    star.render(sender);
                });
            }
            return object;
        }
    }
});

