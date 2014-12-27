define(['drawing', 'sizer'], function (drawing, sizer) {
    var drawingAPI = drawing;
    var photoSizer = sizer;
    return {

        canvas: function (worker) {
            var element = worker.element, creator = this;
            $ajax(worker.picture, function (base64) {
                var picture = new Image(), src = "data:image/jpeg;base64,{0}".format(base64);
                picture.onload = function () {
                    var that = this;
                    var src2 = creator.create(that, worker);
                    element.good(src2.source);
                }
                picture.onerror = function () {
                    element.good();
                }
                if (src.indexOf("SELECT") > 0) {
                    return element.good();
                }
                picture.src = src;
            });
        },

        cache: function (worker) {
            var element = worker.element;
            $ajax(worker.picture, function (base64) {
                var src = "data:image/jpeg;base64,{0}".format(base64);
                element.good(src);
            });
        },

        create: function (picture, worker) {
            var canvas = document.createElement("canvas"), context = canvas.getContext('2d'),
                dimension = photoSizer.fit(picture, worker.size),
                base_width = worker.state ? 160 : 100,
                  offset_width = worker.state ? 106 : 66, panel_width = base_width,
                  panel_y = 32, loc = { y: worker.size > 0 ? (worker.size - 50) : (dimension.h - 50),
                      x: worker.size > 0 ? (worker.size - panel_width) : (dimension.w - panel_width)
                  };

            dimension.fit(canvas);

            drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, dimension.x, dimension.y, dimension.w, dimension.h);

            if (worker.caption) {
                drawingAPI.imagestring(context, "700 9pt Lato", 10, loc.y, worker.caption, "#fff", null,
                                      dimension.w - 20, 16, 5);
                drawingAPI.imagestring(context, "700 9pt Lato", 9, loc.y - 1, worker.caption, "#222", null,
                                      dimension.w - 20, 16, 5);
            }


            if (worker.controls && worker.controls.length) {

                drawingAPI.imagefilledrectangle(context, loc.x, 0, panel_width, panel_y, "#fff");

                for (var c, i = 0; c = worker.controls[i]; i++) {
                    c.draw(context);
                }
            }

            return {
                source: canvas.toDataURL(),
                dimension: dimension,
                canvas: canvas
            }
        },
        show: function () {
            $("canvas").each(function () {
                var context = this.getContext('2d'), src = $(this).data("src"),
                        picture = new Image();
                if (!(src && src.length)) {
                    return;
                }
                picture.onload = function () {
                    context.drawImage(this, 0, 0);
                }
                picture.src = src;
            });
        },
        display: function (worker) {
            var source, creator = this;
            if (source = thumb_worker.remembers(worker)) {
                return this.display_(source, worker);
            }
            $ajax(worker.picture, function (base64) {
                var src = "data:image/jpeg;base64,{0}".format(base64);
                creator.display_(src, worker);
            });
        },
        display_: function (src, worker) {
            var picture = new Image(), element = worker.element, creator = this;
            picture.onload = function () {
                var exist;
                var element_key = worker.article + "_" + worker.fieldname;
                var rendered = creator.create(this, worker), dimension = rendered.dimension,
                        source = rendered.source, onclick = function (e) {
                            if (!worker.onclick) return;
                            worker.onclick(this, e);
                        };

                var picture = "<canvas data-src='{0}' width='{1}' height='{2}' data-article='{3}' id='{4}'/>".format(
				             source, dimension.w, dimension.h, worker.article, element_key);

                $(element).children("canvas").each(function () {
                    exist = $(this).data("src");
                    image_swap.create(this, rendered.canvas, dimension, function () {
                        element.good(picture.src);
                    }, worker.direction, onclick);
                })

                if (!exist) {
                    $(element).html(picture);
                    creator.show();
                    element.good(this.src);
                }

                if (worker.onclick) {
                    $("#" + element_key).click(onclick);
                }
            }

            picture.onerror = function () {
                element.good();
            }

            if (src.indexOf("SELECT") > 0) {
                return element.good();
            }

            try {
                picture.src = src;
            } catch (ex) {
                element.good();
            }
        }
    }
});

