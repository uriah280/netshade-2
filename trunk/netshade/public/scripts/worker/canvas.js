define(['picture', 'drawing'], function (picture, drawing) {
    var imageCache = picture;
    var drawingAPI = drawing;

    return {
        create: function (article, index, sender) {

            var id = sender.object.length, object = {
                id: id,
                picture: undefined,
                source: undefined,
                index: index,
                size: 64,
                article: article,
                fieldname: "thumb",
                sender: sender,
                caption: "#" + index, // article.substr(0, 4),
                draw: function (canvas, limit) {
                    var that = this, thumbnail = new Image(), w = 64, span = w + 1, y = 1,
                       context = canvas.getContext('2d'), article = this.article, offset = span * (this.sender.limit - this.sender.object.length),
                       offset_x = this.sender.object.length < this.sender.limit ? offset : 0,
                        margin = 3, position = limit - this.id, x = (this.id * span) + offset_x, caption = this.sender.caption;

                    var done = function () {
                        context.clearRect(0, 74, canvas.width, 20);
                        drawingAPI.imagestring(context, "700 9pt Lato", 10, 82, caption, "#222");
                    };

                    if (this.source) {
                        x += margin;
                        thumbnail.onload = function () {
                            context.globalAlpha = 1;
                            context.clearRect(x, y - 1, span + 1, span + 6);
                            drawingAPI.imagecopyresized(context, this, 0, 0, this.width, this.height, x + 1, y, span - 1, span - 1);
                            if (article == thumb_worker.selected) {
                                var x1 = x + 1, x2 = x1 + span - 1, y1 = y + 68, y2 = y1;
                                drawingAPI.imageline(context, x1, y1, x2, y2, "#f00", 2);
                            }
                            done();
                        }
                        thumbnail.onerror = function () { done(); }
                        thumbnail.src = this.source;
                        return;
                    }
                    done();
                },
                load: function () {
                    var source, that = this, invoker = this.sender;

                    this.sender.index[this.article] = this.index;
                    this.command = request_worker.format.command(this.article);
                    this.picture = request_worker.format.picture(this.article, "thumb");

                    this.element = {
                        show: function (response) {
                            if (response) return document.title = id + ") " + response.caption;
                            document.title = id + ". No response";
                        },
                        done: function () {
                            imageCache.canvas(that);
                        },
                        good: function (source) {
                            that.source = source;
                            thumb_worker.remember(that, source);
                            invoker.complete++;
                            if (invoker.complete >= invoker.object.length && invoker.done) {
                                invoker.done();
                            }
                        }
                    }
                    if (source = thumb_worker.remembers(that)) {
                        return this.element.good(source);
                    }
                    request_worker.open(this);
                }
            }
            object.load();
            sender.object.push(object);
            return object;

        }

    }
});