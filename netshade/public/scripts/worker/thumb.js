define(['control', 'picture'], function (Generator, Picture) {
    var controlGenerator = Generator;
    var imageCache = Picture;
    return {
        create: function (element, size, keyname, ondone, field, onclick, sender) {
            var object = {
                onclick: onclick,
                command: undefined,
                picture: undefined,
                sender: sender,
                controls: [],

                // data extracted from element
                caption: $(element).html(),
                count: $(element).data("articleCount"),
                bookmarked: $(element).data("bookMarked"),
                verbose: $(element).data("verbose"),
                direction: $(element).data("direction"),
                article: $(element).data(keyname),


                fieldname: field || "thumb",
                keyname: keyname,
                element: element,
                size: size,
                display: function () {
                    this.sender.selected = this.article;
                    imageCache.display(this);
                    if (localStorage["playing"] && localStorage["playing"] == "on" && this.size < 0)
                        Controller.setNext();
                },
                load: function () {
                    var innerText, that = this, invoker = this.sender;

                    var play = controlGenerator.play(this, function () {
                        var existing, article = this.worker.article;
                        if (existing = slide_worker.object[article]) {
                            return existing.pause(existing.state);
                        }
                        return slide_worker.create(this.worker.element, article, this.worker);
                    });

                    var chiron = controlGenerator.count(this);
                    var star = controlGenerator.star(this);

                    if (this.size > 0 && this.count && this.count > 1) {
                        this.controls = [star, play, chiron];
                    }

                    this.command = request_worker.format.command(this.article);
                    this.picture = request_worker.format.picture(this.article, this.fieldname);

                    if (innerText = invoker.text[this.article]) {
                        this.caption = innerText;
                    }

                    this.element.show = function (response) {
                        if (response && response.caption) {
                            if (that.size < 0) {
                                return canvas_worker.write(response.caption);
                            } else if (that.verbose) {
                                this.innerHTML = response.caption;
                                return;
                            }
                            return document.title = response.caption;
                        }
                    }

                    this.element.good = function (source) {
                        if (that.size > 0 && !source) {
                            this.innerHTML = "<div class='warning'>{0} failed to load!</div>".format(that.caption);
                        }
                        invoker.remember(that, source);
                        invoker.complete++;
                        if (invoker.complete >= invoker.count && invoker.done) {
                            canvas_worker.write(that.caption);
                            invoker.done();
                        }
                    }

                    this.element.done = function () {
                        if (!that) return this.good();
                        if (that.size > 0) this.innerHTML = "Loading {0}...".format(that.caption);
                        that.display();
                    }

                    if (invoker.remembers(this)) {
                        return this.display();
                    }

                    canvas_worker.write("Connecting: " + this.caption + "...");
                    request_worker.open(this);
                }
            }
            object.load();
            sender.done = ondone;
            sender.count++;
            return object;
        }
    }
});