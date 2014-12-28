define(['request', 'lib/debug'], function (request, debug) {
    var Debugger = debug;
    var requestWorker = request;
    Debugger.log("Invoked Cache Worker");
    return {
        complete: 0,
        source: {},

        remembers: function (worker) {
            var old = this.getCache(worker.fieldname, worker.article);
            if (old) {
                //      Debugger.log("Found {1} {0}".format(worker.article, worker.fieldname));
                return old;
            }
            //  Debugger.log("ERROR: " + worker.fieldname + " " + worker.article + " was not found");
        },
        remember: function (worker, source) {
            if (!(source && source.length)) {
               // Debugger.log("ERROR: " + worker.fieldname + " " + worker.article + " did not load");
                return;
            }
            var old = this.getCache(worker.fieldname, worker.article);
            if (old) return;// Debugger.log(worker.fieldname + " " + worker.article + " already exists");
            //  Debugger.log("Saving " + worker.fieldname + " " + worker.article + "...");
            return this.setCache(worker.fieldname, worker.article, source);
        },
        getCache: function (field, article) {
            if (!this.source[field]) return false;
            return this.source[field][article];
        },
        setCache: function (field, article, source) {
            if (!this.source[field])
                this.source[field] = {};
            this.source[field][article] = source;


            var x = 0;
            for (var a in this.source[field])
                if (this.source[field][a])
                    x += this.source[field][a].length;

            Debugger.log("{0} bytes saved".format(x));

              this.storage();
        },
        storage: function () {
            var i = 0;
            for (var n in this.source)
                for (var x in this.source[n])
                    if (this.source[n][x])
                        i += this.source[n][x].length;

            Debugger.log("{0} total bytes stored".format(i));
            if (i > (6 * 1024 * 1024)) { // 6mb max cache
                Debugger.log("DUMPING CACHE!!".format(i));
                this.source = { data: {}, thumb: {} }
            }

            return i;
        },


        cache: function (worker) {
            var element = worker.element;
            $ajax(worker.picture, function (base64) {
                var src = "data:image/jpeg;base64,{0}".format(base64);
                element.good(src);
            });
        },


        create: function (article, fieldname) {
            var myself = this, object = {
                article: article,
                fieldname: fieldname || "data",
                load: function () {
                    var text, that = this, key = this.article;


                    this.command = requestWorker.format.command(this.article);
                    this.picture = requestWorker.format.picture(this.article, this.fieldname);

                    this.element = {
                        show: function (response) { },
                        done: function () { myself.cache(that) },
                        good: function (source) {
                            myself.remember(that, source);
                        }
                    }

                    var src;
                    if (src = myself.remembers(this)) {
                        return this.element.good(src, true);
                    }
                    requestWorker.open(this);
                }
            }
            object.load();
            return object;
        }
    }
});