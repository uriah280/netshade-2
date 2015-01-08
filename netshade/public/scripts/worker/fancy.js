define(['lib/drawing', 'lib/photobatch', 'lib/sizer', 'lib/animation', 'lib/servicebus', 'lib/debug'],
  function (drawing, photo, sizer, animation, bus, debug) {


      debug.log("Invoking animation module..");

      var drawingAPI = drawing;
      var photoBatch = photo;
      var photoSizer = sizer;
      var animator = animation;
      var Bus = bus;
      var Bug = debug;

      var ANIMATE_SPAN = 42;
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
              create: function (canvas) {
                  var object = {
                      id: $(canvas).data("key"),
                      pics: { stale: undefined, fresh: undefined },
                      canvas: canvas,
                      panel: undefined,
                      text: undefined,
                      x: -canvas.width,
                      width: canvas.width,
                      height: canvas.height,

                      animate: function () {
                          var that = this, next = function () { that.animate() }

                          var picture = this.pics.fresh, context = this.canvas.getContext('2d');
                          this.x -= -ANIMATE_SPAN;
                          if (this.x > 0) this.x = 0;

                          var dimension = photoSizer.fit(picture, this.width, this.height), x = dimension.x + this.x;

                          if (this.panel && this.panel.batch && this.panel.batch.length == 3) {
                              Bug.log("{1} panel.batch {0}".format(this.x, this.id));
                              drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, this.x, 0, picture.width, picture.height);
                          }
                          else {
                              Bug.log("{2} panel.picture {0} x {1}".format(x, dimension.y, this.id));
                              drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, x, dimension.y, dimension.w, dimension.h);
                          }

                          drawingAPI.imagestring(context, "700 9pt Lato", 10, 16, this.text, "#fff", null,
                                      this.width - 20, 16, 5);
                          drawingAPI.imagestring(context, "700 9pt Lato", 9, 15, this.text, "#222", null,
                                      this.width - 20, 16, 5);

                          if (this.x >= 0) return;
                          animator.run(next);
                      }, 
                      invoke: function (sender, e) {
                          if (e.id.toString() != this.id.toString()) return;

                          var nextpage = e.href + e.uuid;
                          this.x = -this.width;
                          this.pics.stale = this.pics.fresh;
                          this.pics.fresh = sender;
                          this.panel = e;
                          this.text = e.text;

                          $(this.canvas).off('click');
                          $(this.canvas).on('click', function () {
                              location.href = nextpage;
                          });

                          this.animate();

                      }
                  }
                  this.items[object.id] = object;
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

          createPanel: function (id, href, uuid, text, batch) {
              return { href: href, id: id, uuid: uuid, text: text, batch: batch };
          },

          getRandomIndex: function (collection) {
              return Math.floor(Math.random() * collection.length);
          },

          playSide: function () {
              var otherArticle, player = this, panels = [], othergroups = [],
                    currentPic = this.pics.fresh, currentGroup = currentPic.group, articleList = currentGroup.list,
                    currentArticle = currentPic.article, xrefGroups = currentArticle.ref.split('|'),
                    randomIndex = this.getRandomIndex(articleList);

              while (currentGroup.i == randomIndex)
                  randomIndex = this.getRandomIndex(articleList);
              otherArticle = articleList[randomIndex];

              for (var r = this.getRandomIndex(articleList), groupPics = [], e = 0; e < 3; e++) {
                  while (groupPics.join(',').indexOf(articleList[r].uuid) > -1)
                      r = this.getRandomIndex(articleList); // ensure 3 unique articles 
                  groupPics.push(articleList[r].uuid);
              }

              for (var e, i = 1; e = xrefGroups[i]; i++) if (e != currentArticle.groupname) othergroups.push(e);

              var also = othergroups.length > 0 ? ("Also in: " + othergroups.join(' ')) : "No other groups",
                    article_href = "{0}/name/{1}/id/".format(NEXT_PAGE, currentArticle.groupname),
                        group_href = "/group/join/name/{0}/user/{1}/id/".format(currentArticle.groupname, currentArticle.username);

              panels[0] = this.createPanel(0, group_href, currentArticle.uuid, "Open " + currentArticle.groupname, groupPics);
              panels[1] = this.createPanel(1, article_href, currentArticle.uuid, "See all " + currentArticle.count + " items", currentPic.kids);
              panels[2] = this.createPanel(2, article_href, otherArticle.uuid, also);

              $(".info").each(function () {
                  var v = $(this).data("key"), panel = panels[v], src = '/rpc/small/id/' + panel.uuid, loader = player.createImage();
                  Bug.log("Loading {0} panel {1}..".format(currentGroup.name, v));
                  if (panel.batch && panel.batch.length == 3) {
                      photoBatch.create(panel, canvas_w, canvas_h,
                        function () { Bus.Fancy(this.picture, this.source) },
                        function () { alert("An error occured!"); });
                  }
                  else {
                      loader.onload = function () { Bus.Fancy(this, panel); }
                      loader.src = src;
                  }
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

                      var dimension = photoSizer.fit(picture, PANE_SIZE, PANE_H), x = dimension.x + player.x + z;
                      if (x > z) x = z;

                      Bug.log("Drawing {0} panel {1}..".format(fresh.group.name, x));

                      //                      for (var f = [], i = 0; i < 3; i++)
                      //                          f.push(100 + Math.floor(Math.random() * 99))

                      // copy image onto palette here
                      drawingAPI.imagecopyresized(context, picture, 0, 0, picture.width, picture.height, x, dimension.y, dimension.w, dimension.h);

                      var imageData = context.getImageData(0, 0, 1, 1), pixel = imageData.data;


                      var replacements = ['alt.', 'binaries.', 'picture.', 'nospam.', 'erotica.', 'erotic.', 'pictures.'], 
                                    hue = "rgb(" + pixel[0] + "," + pixel[1] + "," + pixel[2] + ")";

                      for (var f, i = 0; f = replacements[i++]; name = name.replace(f, "")); 
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
              return '<div class="{0} splash info" data-key="{0}"><canvas data-key="{0}" width="{1}" height="{2}" class="i-canvas {0}" /></div>'.format(index, canvas_w, canvas_h);
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
                  $(".i-canvas").each(function () {
                      that.sidePane.create(this);
                  })
              });

              this.beforeNextImage();

          },

          setSizes: function () {

              var thin = $(document).width() < $(document).height(), BASE_WIDTH = $(document).width() - 8;

              thin = false;

              if (thin) {
                  //                  alert([$(document).width(), $(document).height()])
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

                  Bug.log("Looking up {0}...".format(group.name));
                  $ajax(command, function (uuids) {
                      try {
                          Bug.log("Found {0}, drawing...".format(group.name));
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
