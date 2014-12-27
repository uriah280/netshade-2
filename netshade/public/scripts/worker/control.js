define(['drawing'], function (drawing) {
    var drawingAPI = drawing;

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
        count: function (worker) {
            var object = this.control(worker);
            object.render = function () {
                var params = this.params(), context = this.context;
                if (this.worker.count != undefined) {
                    drawingAPI.imagestring(context, "700 9pt Lato", params.loc.x + 24, (params.panel_y / 2) + 4, this.worker.count, "#227");
                }
            }
            return object;
        },
        play: function (worker, onclick) {
            var object = this.control(worker, onclick);
            object.render = function () {

                var params = this.params(), size = 10, x = params.loc.x + params.offset_width + size, y = params.panel_y / 2,
                 context = this.context;

                this.y1 = 0;
                this.y2 = params.panel_y;
                this.x1 = x - size;
                this.x2 = x + size;

                if (this.worker.state) {
                    drawingAPI.imagefilledrectangle(context, x - size, y - size, size * 2, size * 2, "#222");
                }
                else {
                    drawingAPI.imagetriangle(context, x, y, size);
                }

            }
            return object;
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

                if (this.worker.state) {


                    drawingAPI.imagefilledrectangle(context, x - 11, y - 6, 3, 10, "#222");
                    drawingAPI.imagefilledrectangle(context, x - 16, y - 6, 3, 10, "#222");
                }
            }
            return object;
        },
        star: function (worker) {
            var object = this.control(worker);
            object.render = function (sender) {
                var params = this.params(), x = params.loc.x + 10, y = params.panel_y / 2,
                 context = this.context, hue = sender ? "#00f" : "#0f0", size = 24, half = size / 2;

                this.y1 = 0;
                this.y2 = params.panel_y;
                this.x1 = x - half;
                this.x2 = x + half;

                drawingAPI.imagefilledrectangle(context, this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1, "#fff");

                drawingAPI.imagestar(context, x, y, params.bookmarked ? "#f00" : null, half);

                if (sender) {
                    var ctx = sender.getContext('2d');
                    ctx.clearRect(0, 0, sender.width, sender.height);
                    ctx.drawImage(context.canvas, 0, 0);
                }
            }
            object.onclick = function (sender) {
                var cstar = this, w = this.worker, address = request_worker.format.bookmark(w.article);
                this.worker.bookmarked = this.worker.bookmarked ? null : "yes";
                $.get(address, function (data) {
                    cstar.render(sender);
                });
            }
            return object;
        }
    }
});

