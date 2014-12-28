define(['lib/drawing', 'lib/photobatch', 'lib/sizer', 'lib/animation', 'lib/servicebus', 'lib/debug'],
  function (drawing, photo, sizer, animation, bus, debug) {


      debug.log("Invoking animation module..");

      var drawingAPI = drawing;
      var photoBatch = photo;
      var photoSizer = sizer;
      var animator = animation;
      var Bus = bus;
      var Bug = debug;


      var PANE_SIZE = 752;
      return {
          groupDictionary: [],
          x: -PANE_SIZE,
          index: -1,
          limit: -1,
          span: PANE_SIZE / 4,
          items: [],
          pics: { stale: undefined, fresh: undefined },

          sidePane: {

              items: [],
              create: function (id, canvas, text) {
                  var object = {
                      id: id,
                      pics: { stale: undefined, fresh: undefined },
                      canvas: canvas,
                      text: text,
                      x: -canvas.width,
                      width: canvas.width,
                      height: canvas.height,

                      animate: function () {
                          var that = this, next = function () { that.animate() }

                          var picture = this.pics.fresh, context = this.canvas.getContext('2d');
                          this.x -= -42;
                          if (this.x > 0) this.x = 0;

                          var s = photoSizer.fit(picture, this.width, this.height), x = s.x + this.x;

                          if (this.e && this.e.batch && this.e.batch.length == 3) {
                              drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, this.x, 0, picture.width, picture.height);
                          }
                          else {
                              drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, x, s.y, s.w, s.h);
                          }

                          drawingAPI.imagestring(context, "700 9pt Lato", 10, 16, this.text, "#fff", null,
                                      this.width - 20, 16, 5);
                          drawingAPI.imagestring(context, "700 9pt Lato", 9, 15, this.text, "#222", null,
                                      this.width - 20, 16, 5);

                          if (this.x >= 0) return;
                          animator.run(next);

                      },

                      invoke: function (sender, e) {
                          if (e.id != this.id) return;


                          var on = e.href + e.uuid;
                          this.x = -this.width;
                          this.pics.stale = this.pics.fresh;
                          this.pics.fresh = sender;
                          this.e = e; 

                          this.text = e.text;

                          $(this.canvas).off('click');
                          $(this.canvas).on('click', function () {
                              location.href = on;
                          }); 

                          this.animate();

                      }
                  }
                  this.items[id] = object;
                  Bus.Subscribe("Fancy", object);
                  return object;
              }

          },

          createImage: function (onload, onerror) {
              var object = new Image();
              object.onload = onload;
              object.onerror = onerror;
              return object;
          },

          createThumb: function (id, href, uuid, text, batch) {
              return { href: href, id: id, uuid: uuid, text: text, batch: batch };
          },

          playSide: function () {
              var player = this;
              var group = this.pics.fresh.group, articles = group.list, num = function (i) { return Math.floor(Math.random() * i); },
                    panels = [], f = this.pics.fresh.article, othergroups = [], ref = f.ref.split('|'), rnd2 = num(articles.length);

              while (group.i == rnd2) rnd2 = num(articles.length);

              var othergroup = articles[rnd2];

              for (var r = num(articles.length), subitem = [], e = 0; e < 3; e++) {

                  while (subitem.join(',').indexOf(articles[r].uuid) > -1)
                      r = num(articles.length);

                  subitem.push(articles[r].uuid);
              }

              for (var e, i = 1; e = ref[i]; i++) if (e != f.groupname) othergroups.push(e);

              var also = othergroups.length > 0 ? ("Also in: " + othergroups.join(' ')) : "No other groups",
                    article_href = "{0}/name/{1}/id/".format(NEXT_PAGE, f.groupname),
                    group_href = "/group/join/name/{0}/user/{1}/id/".format(f.groupname, f.username);

              panels[0] = this.createThumb(0, group_href, f.uuid, "Open " + f.groupname, subitem);
              panels[1] = this.createThumb(1, article_href, f.uuid, "See all " + f.count + " items", this.pics.fresh.kids);
              panels[2] = this.createThumb(2, article_href, othergroup.uuid, also);

              $(".info").each(function () {
                  var tmp = this.className.split(" "), i = tmp[0], panel = panels[i]
                  if (panel.batch && panel.batch.length == 3) {

                      photoBatch.create(panel, canvas_w, canvas_h,
                        function () { Bus.Fancy(this.picture, this.source) },
                        function () { alert("An error occured!"); });
                      return; 
                  }

                  var src = '/rpc/small/id/' + panel.uuid, pc = player.createImage();
                  pc.onload = function () { Bus.Fancy(this, panel); }
                  pc.src = src;

              });

              setTimeout(function () { player.beforeNextImage() }, 12000);

          },

          playMain: function () {
              var player = this;
              $("#center-main-canvas").each(function () {

                  var that = this, z = PANE_SIZE, context = this.getContext('2d');

                  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

                  for (var p in player.pics) {
                      if (!player.pics[p]) { z = 0; continue; }
                      var fresh = player.pics[p], article = fresh.article, name = fresh.group.name,
                            picture = fresh.picture;

                      player.x += player.span;


                      var s = photoSizer.fit(picture, PANE_SIZE, PANE_H), x = s.x + player.x + z;
                      if (x > z) x = z;

                      for (var f = [], i = 0; i < 3; i++)
                          f.push(100 + Math.floor(Math.random() * 99))

                      drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, x, s.y, s.w, s.h);

                      var imgd = context.getImageData(0, 0, 1, 1), pix = imgd.data, r = 0; // Math.floor (pix.length/4);// (Math.random() * pix.length);


                      var rep = ['alt.', 'binaries.', 'picture.', 'nospam.', 'erotica.', 'erotic.', 'pictures.'], hue = "rgb(" + pix[r] + "," + pix[r + 1] + "," + pix[r + 2] + ")";
                      for (var f, i = 0; f = rep[i++]; name = name.replace(f, ""));
                      name = "#" + name.split(".").join("-")


                      drawingAPI.imagestring(context, "700 44pt Lato", 38, PANE_H - 82, name, hue, null,
                                      600, 18, 5);
                      drawingAPI.imagestring(context, "300 44pt Lato", 35, PANE_H - 90, name, "#fff", null,
                                      600, 18, 5);
                      drawingAPI.imagestring(context, "300 44pt Lato", 34, PANE_H - 89, name, "#333", null,
                                      600, 18, 5);

                      var metrics = context.measureText(name), subject_x = metrics.width + 64, subj_span = PANE_SIZE - subject_x - 40;
                      context.font = "300 12pt Lato";
                      metrics = context.measureText(article.subject);
                      var offY = metrics.width > subj_span ? 108 : 90, line_x = subject_x - 14;


                      drawingAPI.imageline(context, line_x + 1, PANE_H - 123, line_x + 1, PANE_H - 79, "#333", 2);
                      drawingAPI.imageline(context, line_x, PANE_H - 124, line_x, PANE_H - 80, hue, 2);

                      drawingAPI.imagestring(context, context.font, subject_x + 1, PANE_H - offY + 1, article.subject, hue, null,
                                      subj_span, 18, 2);
                      drawingAPI.imagestring(context, context.font, subject_x, PANE_H - offY, article.subject, "#000", null,
                                      subj_span, 18, 2);


                      z = 0;

                  }


                  if (player.x >= 0) return player.playSide();
                  animator.run(function () { player.playMain() });

              });
          },

          load: function () {
              var carousel = [];
              $(".carousel").each(function () {
                  carousel.push(this.id);
              })
              if (carousel.length) {
                  this.start(carousel);
              }
          },

          start: function (collection) {
              this.groupDictionary = shuffle(collection);
              this.limit = collection.length;
              this.drawContainers();
          },

          drawContainer: function (index) {
              Bug.log("drawContainer panel #" + index);
              return '<div class="{0} splash info"><canvas width="{1}" height="{2}" class="i-canvas {0}" /></div>'.format(index, canvas_w, canvas_h);
          },

          drawContainers: function () {

              this.setSizes();

              var that = this, html = [];
              html.push('<div class="splash main"><canvas id="center-main-canvas" width="{0}" height="{1}"/></div>'.format(PANE_SIZE, PANE_H));
              for (var i = 0; i < 3; i++)
                  html.push(this.drawContainer(i)); 
              html = html.join("");


              $(".header").each(function () {

                  $(this).html(html);

                  that.setSizes();

                  Bug.log("Adding panels...");
                  $(".i-canvas").each(function () {
                      var tmp = this.className.split(" "), id = tmp[1];
                      Bug.log("Adding panel #" + id);
                      that.sidePane.create(id, this);
                  })
              });

              this.beforeNextImage();

          },

          setSizes: function () {

              var thin = $(document).width() < $(document).height(), BASE_WIDTH = $(document).width() - 8;

              thin = false;

              if (thin) {
                  alert([$(document).width(), $(document).height()])
                  BASE_WIDTH = $(document).width() - 4;
                  BASE_WIDTH = BASE_WIDTH - (BASE_WIDTH % 3);
                  BASE_WIDTH += 2;
              }

              PANE_SIZE = thin ? BASE_WIDTH : (Math.floor(BASE_WIDTH * 0.75) + 2);

              canvas_w = thin ? Math.floor((BASE_WIDTH - 24) / 3) : Math.floor(BASE_WIDTH * 0.25);
              PANE_H = Math.floor(9 * (PANE_SIZE / 16));
              PANE_H = PANE_H - (PANE_H % 3)
              canvas_h = Math.floor((PANE_H - 2) / 3);

              $("#center-main-canvas").each(function () {
                  this.width = PANE_SIZE;
                  this.height = PANE_H;
                  $(this).css("width", PANE_SIZE + "px");
                  $(this).css("height", PANE_H + "px");
              })

              $(".info").each(function () {
                  $(this).css("width", canvas_w + "px");
                  $(this).css("height", canvas_h + "px");
              })

              $(".i-canvas").each(function () {
                  this.width = canvas_w;
                  this.height = canvas_h;
                  $(this).css("width", canvas_w + "px");
                  $(this).css("height", canvas_h + "px");
              })

          },

          peek: function () {
              this.index++;
              if (this.index >= this.limit) this.index = 0;
              return this.items[this.index];
          },

          addGroupList: function (groupname, list) {
              if (list.length < 5) return;
              var id = this.items.length, object = {
                  i: 0
              , id: id
              , name: groupname
              , list: list
              , list: shuffle(list)
              , peek: function () {
                  this.i++;
                  if (this.i >= this.list.length) this.i = 0;
                  return this.list[this.i];
              }
              }
              this.items.push(object);
              return object;
          },

          beforeNextImage: function () {

              if (this.groupDictionary.length > 0) return this.initialize();
              this.nextImage();
          },

          nextImage: function () {

              var player = this, group = this.peek();

              try {
                  var article = group.peek(), command = "/rpc/randomof/id/" + article.uuid,
                   src = '/rpc/picture/id/' + article.uuid, tiny = '/rpc/small/id/' + article.uuid;

                  $ajax(command, function (uuids) {
                      try {
                          var kids = uuids.split(","), picture = player.createImage(function () {
                              player.pics.stale = player.pics.fresh;
                              player.pics.fresh = { kids: kids, group: group, article: article, picture: this };
                              player.x = -PANE_SIZE;
                              player.playMain();
                          }, function () { player.beforeNextImage() });
                          picture.src = src;
                      } catch (ex) {
                          player.beforeNextImage();
                      }
                  });
              } catch (ex) {
                  player.beforeNextImage();
              }

          },
          initialize: function () {

              var player = this, groupname = player.groupDictionary.pop(), username = getUsername(),
                    url = "/rpc/picsof/user/" + username + "/name/" + groupname;

              document.title = player.limit + ". " + groupname + "...";

              $ajax(url, function (data) {
                  try {

                      var xmlDoc = $.parseXML(data), xml = $(xmlDoc), list = [];
                      $(xml).find('item').each(function () {
                          list.push({
                              uuid: $(this).find('uuid').text(),
                              subject: $(this).find('subject').text(),
                              ref: $(this).find('ref').text(),
                              username: $(this).find('username').text(),
                              count: $(this).find('count').text(),
                              groupname: $(this).find('groupname').text()
                          });
                      });

                      if (list.length == 0) {
                          player.limit--;
                          player.beforeNextImage();
                          return;
                      }

                      player.addGroupList(groupname, list);
                      player.nextImage();

                  } catch (ex) {
                      player.limit--;
                      player.beforeNextImage();
                  }
              });
          }
      }
  });
