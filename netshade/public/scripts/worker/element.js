define(['thumb', 'canvas', 'cache'], function (thumb, canvas, cache) {
    var thumbWorker = thumb;
    var cacheWorker = cache;
    var canvasWorker = canvas;

    return {

        displaySelected: function (thumb_sender, cache_sender, article, dir) {
            var thumbComponent = thumb_sender;
            var cacheComponent = cache_sender;

            var direction = dir || 1;
            thumbComponent.clear();

            $(".article-scale").each(function () {
                $(this).data("scaleKey", article);
                $(this).data("direction", direction);
                thumbWorker.create(this, -1, "scaleKey", function () {
                    Controller.preview();
                }, "data", null, thumbComponent);
            });

            $("#article-select").each(function () {
                for (var f, x = this.selectedIndex, m = Math.min(x + 3, this.options.length - 1); (f = this.options[x]) && (x < m); x++) {
                    cache_worker.create(f.value, null, cacheComponent);
                }
            });
        },

        configurePreviewCanvas: function (canvas_sender, bHilo, bVisible) {
            var canvasComponent = canvas_sender;

            $("#canvas-teeny").each(function () {
                $(this).click(function (e) {

                    var offset = $(this).offset(), ordinal = Math.floor((e.clientX - offset.left) / 64),
                               index = ordinal - SLIDE_OFFSET; 

                    $("#article-select").each(function () {
                        var drp = this, selectedIndex = drp.selectedIndex, i = selectedIndex - (-index);


                        if (bHilo) {
                            var cheat = canvasComponent.object[ordinal];
                            Controller.dropSelect(cheat.index, cheat.article);
                            return;
                        }

                        if (i < 0 || i >= drp.options.length || drp.options.length < 1) return; 
                        var id = drp.options[i].value, text = drp.options[i].text;
                        Controller.dropSelect(i, id);
                    });


                });

                this.invoke = function (sender, e) {
                    $(this).css("display", bVisible ? "inline" : "none");
                }

                ServiceBus.Subscribe("OnPageResize", this);
            });
        },

        configurePreviewThumbnails: function (canvas_sender, cache_sender, bVisible, bHilo) {
            var canvasComponent = canvas_sender;
            var cacheComponent = cache_sender;
            canvasComponent.clear();

            var selectedIndex = -1;
            $(".article-tiny").each(function () {

                if (!bVisible) return;
                var that = this, tinyIndex = this.id;
                $(this).empty();
                $(this).css("border", "none");

                if (bHilo) {
                    $("#article-select").each(function () {
                        var drp = this, range = Rangefrom(drp.options, drp.selectedIndex), i = tinyIndex - (-SLIDE_OFFSET);
                        if (i < 0 || i >= range.length || range.length < 1) return;
                        var id = range[i].article, text = range[i].text, index = range[i].index;
                        canvasWorker.create(id, index, canvasComponent);
                    });
                }
                else {
                    $("#article-select").each(function () {
                        selectedIndex = this.selectedIndex;
                        var drp = this, dropIndex = drp.selectedIndex, articleIndex = dropIndex - (-tinyIndex);
                        if (articleIndex < 0 || articleIndex >= drp.options.length || drp.options.length < 1) return;
                        var id = drp.options[articleIndex].value, text = drp.options[articleIndex].text;
                        canvasWorker.create(id, articleIndex, canvasComponent);
                    });
                }
            });

            if (selectedIndex > 0) {
                $("#article-select").each(function () {
                    for (var f, x = selectedIndex + 1, m = Math.min(x + 4, this.options.length - 1); (f = this.options[x]) && (x < m); x++) {
                        cacheWorker.create(f.value, "thumb", cacheComponent);
                    }
                });
            }
            ServiceBus.OnPageResize();
        },

        configureThumbnails: function (sender) {
            var Component = sender;
            $("*[data-article-key]").each(function () {


                $(this).css(
                      { width: THUMB_SIZE + "px",
                          height: THUMB_SIZE + "px"
                      }
                    );

                if (this.className.indexOf("article-picture") >= 0) {

                    var that = this, drawCells = function () {
                        Component.clear();
                        $("*[data-small-key]").each(function () {
                            var ts = TINY_SIZE - 1;
                            $(this).css(
                                        { width: ts + "px",
                                            height: ts + "px"
                                        }
                                    );
                            $(this).click(function () {
                                var old = location.href.replace(/\/page\/\d+/, "") + "/page/" + this.id;
                                location.href = this.id;
                            });
                            thumbWorker.create(this, TINY_SIZE, "smallKey", null, null, null, Component);
                        });
                    },


                   onClick = function (sender, e, regions) {

                       var offset = $(sender).offset(), x = e.clientX - offset.left, y = e.clientY - offset.top,
                                    article = $(sender).data("article"), worker = this;

                       if (worker.controls) {
                           for (var c, i = 0; c = worker.controls[i]; i++) {
                               if (c.click(x, y, sender)) {
                                   return;
                               }
                           }
                       }


                       if (slide_worker.object[article] && slide_worker.object[article].state) {
                           slide_worker.object[article].direct();
                           return;
                       }

                       Controller.nextPage(article);
                   }


                    thumbWorker.create(this, THUMB_SIZE, "articleKey", drawCells, "thumb", onClick, Component);
                }


            });

            $(".article-scale").each(function () {
                $(this).data("scaleKey", this.id);
                thumbWorker.create(this, -1, "scaleKey", function () {
                    Controller.preview();
                    ServiceBus.OnPageResize();
                }, "data", null, Component);
            });

            $("*[data-article-index]").each(function () {
                var id = $(this).data("articleIndex"), value = $(this).html();
                Component.text[id] = value;
            });

        }
    }
})