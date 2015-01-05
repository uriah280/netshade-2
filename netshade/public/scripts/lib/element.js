define(['thumb', 'canvas', 'cache', 'slider', 'lib/drawing', 'lib/range', 'lib/servicebus', 'lib/debug'],

            function (thumb, canvas, cache, slider, drawing, range, bus, bug) {

                bug.log("invoking element module..");
                var thumbWorker = thumb;
                var cacheWorker = cache;
                var canvasWorker = canvas;
                var slideWorker = slider;
                var drawingAPI = drawing;
                var rangeAPI = range;
                var Debugger = bug;
                var Bus = bus;
                bug.log("Starting element module..");
                return {

                    nextPage: function (article) {
                        location.href = NEXT_PAGE + article;
                    },

                    // #region Canvas functions??
                    // ---------------------------------------------------'
                    view: function (id, dir) {
                        Debugger.log("Controller.view: " + id);
                        this.displaySelected(id, dir);
                    },

                    next: function (i) {
                        var that = this, index = i == undefined ? 1 : i;
                        $("#article-select").each(function () {
                            if (this.selectedIndex == (this.options.length - 1)) this.selectedIndex = 0;
                            else this.selectedIndex -= -index;
                            that.view($(this).val());
                        });
                    },


                    dropSelect: function (index, article) {
                        var that = this;
                        $("#article-select").each(function () {
                            var selectedIndex = this.selectedIndex;
                            this.selectedIndex = index;
                            that.view(article, index - selectedIndex);
                        });
                    },

                    preview: function () {
                        Debugger.log("Element.preview");
                        this.configurePreviewThumbnails(DIALOG_VISIBLE, DIALOG_HILO);
                    },



                    setNext: function () {
                        this.timer = 0;
                        this.setNext_();

                    },

                    setNext_: function () {

                        var that = this, next = function () { that.setNext_(); }
                        this.timer++;

                        Debugger.log("Playing - " + this.timer);

                        if (this.timer > 3) {
                            return this.next();
                        }
                        setTimeout(next, 3333);
                    },


                    enableSlideController: function () {
                        Debugger.log("Element.enableSlideController");
                        var elementObject = this;
                        $(".controller").each(function () {
                            this.invoke = function (sender, e) {
                                var W = ($(window).width() - this.offsetWidth) / 2;

                                $(this).css({ height: DIALOG_VISIBLE ? "124px" : "24px",
                                    overflow: "hidden",
                                    left: W + "px"
                                });

                                var H = $(window).height() - this.offsetHeight - 8;
                                this.style.top = H + "px";
                            }
                            this.style.height = "124px";
                            Bus.Subscribe("OnPageResize", this);
                        });

                        $(".a-next").click(function () {
                            var tmp = this.className.split(" "), i = tmp[1];
                            elementObject.next(i);
                        });

                        $(".article-menu").click(function () {
                            DIALOG_VISIBLE = !DIALOG_VISIBLE;
                            localStorage["dialog"] = DIALOG_VISIBLE ? "on" : "off";
                            Bus.OnPageResize();
                            elementObject.preview();
                        });

                        $(".a-ps").click(function () {
                            elementObject.playpauseCanvas();
                        });

                        $(".a-hi").click(function () {
                            elementObject.onoffHilo();
                        });


                        window.onresize = function () { Bus.OnPageResize(); }

                    },

                    onoffHilo: function () {
                        DIALOG_HILO = !DIALOG_HILO;
                        localStorage["hilo"] = DIALOG_HILO ? "on" : "off";
                        this.preview();
                    },

                    playpauseCanvas: function () {
                        PLAYER_PLAYING = !PLAYER_PLAYING;
                        localStorage["playing"] = PLAYER_PLAYING ? "on" : "off";
                        if (PLAYER_PLAYING) {
                            this.next(0);
                        }
                    },
                    // #region Canvas functions??
                    // ---------------------------------------------------'


                    displayGroupInfo: function () {
                        Debugger.log("Element.displayGroupInfo");

                        $(".span-of").each(function () {
                            var t = this.id.split('x'), lo = t[0], hi = t[1], mn = t[2], mx = t[3], key = "I" + Math.floor(Math.random() * 1000000), width = 500, w2 = width + 50; ;
                            var img = "<canvas width='" + w2 + "' height='20' id='" + key + "'></canvas>";
                            $(this).html(img);
                            $("#" + key).each(function () {
                                var that = this, context = that.getContext('2d'), dm = mx - mn, dl = hi - lo, sx = lo - mn,
                             px = width * (dl / dm), x = width * (sx / dm);
                                context.fillStyle = '#ffc';
                                context.fillRect(0, 0, width + 50, 30);

                                context.fillStyle = '#ccf';
                                context.fillRect(25, 5, width, 10);

                                context.fillStyle = '#009';
                                context.fillRect(25 + x, 5, px, 10);

                                var mw = context.measureText(mx).width, ml = context.measureText(lo).width,
                             max_x = (width + 25) - (mw / 2), lo_x = 25 + x - (ml / 2), max_y = 9, lo_y = 19;

                                while ((lo_x + ml) >= (max_x - 10)) lo_x -= 10;

                                drawingAPI.imagestring(context, '300 8pt Lato', 1, 9, mn, '#333');
                                drawingAPI.imagestring(context, '300 8pt Lato', max_x, max_y, mx, '#333');
                                drawingAPI.imagestring(context, '300 8pt Lato', lo_x, lo_y, lo, '#333');
                                drawingAPI.imagestring(context, '300 8pt Lato', max_x, lo_y, hi, '#333');
                            });
                        });

                    },

                    displaySelected: function (article, dir) {
                        var elementObject = this;
                        Debugger.log("Element.displaySelected: " + article);

                        var direction = dir || 1;
                        thumbWorker.clear();

                        $(".a-ps").each(function () {
                            $(this).html(PLAYER_PLAYING ? "Stop" : "Play");
                        });


                        $(".article-scale").each(function () {
                            $(this).data("scaleKey", article);
                            $(this).data("direction", direction);
                            thumbWorker.create(this, -1, "scaleKey", function () {
                                elementObject.preview();
                            }, "data", null);
                        });

                        $("#article-select").each(function () {
                            for (var f, x = this.selectedIndex,
                                  m = Math.min(x + 3, this.options.length - 1);
                                    (f = this.options[x]) && (x < m); x++) {
                                cacheWorker.create(f.value);
                            }

                            var caption = "1 - " + this.options.length;
                            $(".a-hi").each(function () {
                                $(this).attr("href", "javascript:void(0)");
                                $(this).html(DIALOG_HILO ? "Hilo" : caption);
                            });

                        });
                    },

                    configurePreviewCanvas: function () {
                        var elementObject = this;

                        $(".a-ps").each(function () {
                            $(this).attr("href", "javascript:void(0)");
                            $(this).html(PLAYER_PLAYING ? "Stop" : "Play");
                        });

                        $("#canvas-teeny").each(function () {
                            $(this).click(function (e) {
                                var offset = $(this).offset(), x = e.clientX - offset.left, y = e.clientY - offset.top, ordinal = Math.floor(x / 64),
                                        index = ordinal - SLIDE_OFFSET;

                                if (canvasWorker.controls) {
                                    for (var control, i = 0; control = canvasWorker.controls[i]; i++) {
                                        if (control.click(x, y, this)) {
                                            return;
                                        }
                                    }
                                }


                                $("#article-select").each(function () {
                                    var drp = this, selectedIndex = drp.selectedIndex, i = selectedIndex - (-index);


                                    if (DIALOG_HILO) {
                                        var cheat = canvasWorker.object[ordinal];
                                        elementObject.dropSelect(cheat.index, cheat.article);
                                        return;
                                    }

                                    if (i < 0 || i >= drp.options.length || drp.options.length < 1) return;
                                    var id = drp.options[i].value, text = drp.options[i].text;
                                    elementObject.dropSelect(i, id);
                                });


                            });

                            this.invoke = function (sender, e) {
                                $(this).css("display", DIALOG_VISIBLE ? "inline" : "none");
                            }

                            Bus.Subscribe("OnPageResize", this);
                        });
                    },

                    configurePreviewThumbnails: function () {
                        canvasWorker.clear();

                        var selectedIndex = -1;
                        var render = function (tinyIndex) {
                            if (!DIALOG_VISIBLE) return;

                            if (DIALOG_HILO) {
                                $("#article-select").each(function () {
                                    var drp = this, range = rangeAPI.createRange(drp.options, drp.selectedIndex), i = tinyIndex - (-SLIDE_OFFSET);
                                    if (i < 0 || i >= range.length || range.length < 1) return;
                                    var id = range[i].article, text = range[i].text, index = range[i].index;
                                    canvasWorker.create(id, index);
                                });
                            }
                            else {
                                $("#article-select").each(function () {
                                    selectedIndex = this.selectedIndex;
                                    var drp = this, dropIndex = drp.selectedIndex, articleIndex = dropIndex - (-tinyIndex);
                                    if (articleIndex < 0 || articleIndex >= drp.options.length || drp.options.length < 1) return;
                                    var id = drp.options[articleIndex].value, text = drp.options[articleIndex].text;
                                    canvasWorker.create(id, articleIndex);
                                });
                            }
                        }

                        for ($n = -5; $n < 6; $n++) {
                            render($n);
                        }
                        canvasWorker.attach();

                        if (selectedIndex > 0) {
                            $("#article-select").each(function () {
                                for (var f, x = selectedIndex + 1, m = Math.min(x + 4, this.options.length - 1); (f = this.options[x]) && (x < m); x++) {
                                    cacheWorker.create(f.value, "thumb");
                                }
                            });
                        }
                        Bus.OnPageResize();
                    },

                    configureThumbnails: function () {
                        var elementObject = this;
                        $("*[data-article-key]").each(function () {


                            $(this).css(
                              { width: THUMB_SIZE + "px",
                                  height: THUMB_SIZE + "px"
                              }
                            );

                            if (this.className.indexOf("article-picture") >= 0) {

                                var drawCells = function () {
                                    thumbWorker.clear();
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
                                        thumbWorker.create(this, TINY_SIZE, "smallKey");
                                    });
                                },


                               onClick = function (sender, e) {
                                   elementObject.nextPage($(sender).data("article"));
                               }


                                thumbWorker.create(this, THUMB_SIZE, "articleKey", drawCells, "thumb", onClick);
                            }
                        });

                        $(".article-scale").each(function () {
                            $(this).data("scaleKey", this.id);
                            thumbWorker.create(this, -1, "scaleKey", function () {
                                elementObject.preview();
                                Bus.OnPageResize();
                            }, "data", null);
                        });

                        $("*[data-article-index]").each(function () {
                            var id = $(this).data("articleIndex"), value = $(this).html();
                            thumbWorker.text[id] = value;
                        });

                        $(".article-lookup").css({ display: "none" });
                    }
                }
            })