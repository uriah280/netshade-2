define(['picture'], function (picture) {
    var imageCache = picture;
    return {
        create: function (article, fieldname, sender) {
            var object = {
                sender: sender,
                article: article,
                fieldname: fieldname || "data",
                load: function () {
                    var text, that = this, key = this.article, invoker = this.sender;


                    this.command = request_worker.format.command(this.article);
                    this.picture = request_worker.format.picture(this.article, this.fieldname);

                    this.element = {
                        show: function (response) { },
                        done: function () { imageCache.cache(that) },
                        good: function (source) {
                            thumb_worker.remember(that, source);
                            if (that.slow) {
                                setTimeout(invoker.init, 1000);
                            }
                        }
                    }

                    var src;
                    if (src = thumb_worker.remembers(this)) {
                        return this.element.good(src);
                    }
                    request_worker.open(this);
                }
            }
            object.load();
            return object;
        }
    }
});