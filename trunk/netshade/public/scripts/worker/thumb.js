define(['lib/picture', 'lib/control', 'lib/debug', 'canvas', 'slider', 'cache', 'request'],
   function (Picture, Generator, debug, CanvasWorker, ImageSlider, ImageCache, Request) {
       var controlGenerator = Generator;
       var Renderer = Picture;
       var canvasWorker = CanvasWorker;
       var slideWorker = ImageSlider;
       var imageCache = ImageCache;
       var requestWorker = Request;
       var Debugger = debug;


       return {


           count: 0,
           complete: 0,
           selected: 0,
           text: {},
           oncomplete: function (worker, source) {
               this.complete++;
               imageCache.remember(worker, source);
               if (this.complete >= this.count && this.done) {
                   canvasWorker.write(worker.caption);
                   this.done();
               }
           },
           clear: function () {
               this.complete = 0;
               this.count = 0;
           },

           create: function (element, size, keyname, ondone, field, onclick) {
               var myself = this, object = {
                   click: onclick,
                   onclick: function (sender, e) {
                       var offset = $(sender).offset(), x = e.clientX - offset.left, y = e.clientY - offset.top,
                                       article = $(sender).data("article");

                       if (this.controls) {
                           for (var control, i = 0; control = this.controls[i]; i++) {
                               if (control.click(x, y, sender)) {
                                   return;
                               }
                           }
                       }

                       if (slideWorker.direct(article)) {
                           return;
                       }

                       this.click(sender, e);
                   },
                   command: undefined,
                   picture: undefined,
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
                       SELECTED_PICTURE = this.article;
                       Renderer.display(this);
                       Debugger.log("Checking play status...");
                       if (PLAYER_PLAYING) {
                           require(['lib/element'], function (e) {
                               Debugger.log("Playing...");
                               e.setNext();
                           });
                       }
                   },
                   load: function () {
                       var innerText, that = this;

                       var play = controlGenerator.play(this, function () {
                           var existing, article = this.worker.article;
                           if (existing = slideWorker.object[article]) {
                               return existing.pause(existing.state);
                           }
                           return slideWorker.create(this.worker.element, article, this.worker);
                       });

                       var chiron = controlGenerator.count(this);
                       var star = controlGenerator.star(this);

                       if (this.size > 0 && this.count && this.count > 1) {
                           this.controls = [star, play, chiron];
                       }

                       this.command = requestWorker.format.command(this.article);
                       this.picture = requestWorker.format.picture(this.article, this.fieldname);

                       if (innerText = myself.text[this.article]) {
                           this.caption = innerText;
                       }

                       this.element.show = function (response) {
                           if (response && response.caption) {
                               if (that.size < 0) {
                                   return canvasWorker.write(response.caption);
                               } else if (that.verbose) {
                                   this.innerHTML = response.caption;
                                   return;
                               }
                               return document.title = response.caption;
                           }
                       }

                       this.element.good = function (source) {
// console.log ("GOOD: " + that.caption);
                           if (that.size > 0 && !source) {
                               this.innerHTML = "<div class='warning'>{0} failed to load!</div>".format(that.caption);
                           }

                           myself.oncomplete(that, source);
                       }

                       this.element.done = function () {
// console.log ("DONE: " + that.caption);
                           if (!that) return this.good();
                           if (that.size > 0) this.innerHTML = "Loading {0}...".format(that.caption);
                           that.display();
                       }

                       if (imageCache.remembers(this)) {
                           return this.display();
                       }

                       canvasWorker.write("Connecting: " + this.caption + "...");
                       requestWorker.open(this);
                   }
               }


               object.load();
               this.done = ondone;
               this.count++;
               return object;
           }
       }
   });
