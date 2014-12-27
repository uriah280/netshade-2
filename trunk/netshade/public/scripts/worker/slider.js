define(['control', 'picture'], function (Generator, Picture) {
    var controlGenerator = Generator;
    var imageCache = Picture;

    return {
        create: function (element, article, worker, sender) {

            if (sender.object[article]) {
                sender.object[article].pause();
                return;
            }

            var object = {
                command: "/rpc/slide/id/{0}".format(article),
                item: undefined,
                items: [],
                onclick: worker.onclick,
                controls: worker.controls,
                bookmarked: worker.bookmarked,
                article: article,
                sender: sender,
                fieldname: "thumb",
                from: article,
                index: 1,
                count: 0,
                state: true,
                size: THUMB_SIZE,
                element: element,
                directLink: $(element).data("direct"),
                direct: function () {
                    if (!this.directLink) return;
                    var re, rex = /most\/(\d+)/, most = !(re = rex.exec(location.href)) ? "" : ("/most/" + re[1]),
                         address = this.directLink.format(Controller.getUsername(), this.from, this.article);
                    location.href = address + most;
                },
                load: function () {
                    var that = this;
                    document.title = "Loading...";
                    $.ajax({
                        type: "GET",
                        url: this.command,
                        cache: false,
                        dataType: "xml",
                        success: function (xml) {
                            $(xml).find('li').each(function () {
                                var subject = $(this).text(), uuid = $(this).attr("uuid");
                                that.add(subject, uuid);
                            });
                            that.next();
                        }
                    });
                },
                add: function (subject, uuid) {
                    this.items.push({ subject: subject, uuid: uuid });
                },
                pause: function (bstop) {
                    this.state = !this.state;
                    this.index = bstop ? 0 : this.index--; //--;
                    if (this.state) {
                        this.next();
                    }
                },
                next: function () {
                    this.item = this.items[this.index++];
                    this.count = this.index + "/" + this.items.length;
                    this.article = this.item.uuid;
                    this.caption = this.item.subject;
                    this.draw();
                },
                draw: function () {
                    this.draw_();
                    document.title = this.count;
                    request_worker.open(this);
                },
                draw_: function () {
                    var that = this, invoker = this.sender;

                    var play = controlGenerator.play(this, function () {
                        var existing, article = this.worker.from;
                        if (existing = invoker.object[article]) {
                            return existing.pause(existing.state);
                        }
                        return invoker.create(this.worker.element, article, this.worker);
                    });

                    var pause = controlGenerator.pause(this, function () {
                        invoker.object[this.worker.from].pause();
                    });

                    var chiron = controlGenerator.count(this);
                    var star = controlGenerator.star(this);

                    this.controls = [star, play, pause, chiron];

                    this.command = request_worker.format.command(this.article);
                    this.picture = request_worker.format.picture(this.article, this.fieldname);
                    this.element.show = function (response) { }
                    this.element.good = function (source) {
                        if (that.state)
                            setTimeout(function () {
                                that.next();
                            }, 3000);
                    }
                    this.element.done = function () {
                        imageCache.display(that);
                    }
                }
            };

            sender.object[article] = object;
            object.load();
            return object;
        }
    };

});