define({

    Icons: {},

    imagesx: function (context) { return context.canvas.width; },
    imagesy: function (context) { return context.canvas.height; },

    imageline: function (context, x1, y1, x2, y2, color, size) {

        context.strokeStyle = color;
        context.lineWidth = size || 0.5;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();

    },

    
    imagetriangle : function (ctx, cx, cy, size) {
        ctx.strokeSyle = "#f00";
        ctx.fillStyle = "#f00";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - size, cy + size);
        ctx.lineTo(cx - size, cy - size);
        ctx.fill();
    }, 


    imagestar : function (ctx, cx, cy, filled, outerRadius) {
        var spikes = 5, innerRadius = outerRadius/2, rot = Math.PI / 2 * 3;
        var x = cx;
        var y = cy;
        var step = Math.PI / spikes;

        ctx.strokeSyle = "#f00";
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius)
        for (i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y)
            rot += step

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y)
            rot += step
        }
        ctx.lineTo(cx, cy - outerRadius)
        if (filled) {
            ctx.fillStyle = filled;
            ctx.fill();
        }
        ctx.stroke();
        ctx.closePath();
    },


    imagecopyresized: function (context, src, sx, sy, sw, sh, dx, dy, dw, dh, action) {
        var sourceX = sx, sourceY = sy, sourceWidth = sw, sourceHeight = sh, 
            destX = dx, destY = dy, destWidth = dw, destHeight = dh, command = action, picture = new Image(),
             api = this;

        var invoke = function () {
            // confirm([destWidth, destHeight]);
            if (destWidth < 0 || destHeight < 0) {
                destWidth = sourceWidth;
                destHeight = sourceHeight;
            }
            context.drawImage(picture, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight)

            if (command) {
                command();
            }
            return context.restore();
        }

        if (typeof (src) == 'object') {
            picture = src;
            return invoke();
        }

        if (api.Icons[src]) {
            //   picture = api.Icons[src];
            //   return invoke ();
        }
        picture.onload = invoke;
        picture.src = src;
        // api.Icons[src] = picture;

    },

    imagecopy: function (context, src, x, y, action, cb) {
        var callback = cb, destX = x, destY = y, command = action, picture = new Image(),
             api = this;


        var invoke = function () {
            context.globalAlpha = 1;
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.drawImage(picture, destX, destY);

            if (command) {
                api.setclick(context, picture.src, destX, destY,
                                     destX + picture.width, destY + picture.height, command);
            }
            context.restore();
            if (callback) callback();
            return;
        }

        if (api.Icons[src]) {
            picture = api.Icons[src];
            return invoke();
        }
        picture.onload = invoke;
        picture.src = src;
        api.Icons[src] = picture;
    },

    imagecreate: function (x, y, image) {
        var canvas = document.createElement("canvas");
        if (image) image.parentNode.replaceChild(canvas, image);
        canvas.width = x;
        canvas.height = y;
        return canvas;
    },

    imagestring: function (context, font, x, y, value, color, command,
                              maxwidth, wrapheight, maxlines) {
        context.font = font;
        context.fillStyle = color;
        if (wrapheight == undefined && !isNaN(maxwidth)) {
            var title = value, dot = "";
            var metrics = context.measureText(title);
            while (metrics.width > maxwidth) {
                title = title.substr(0, title.length - 1);
                metrics = context.measureText(title);
                dot = "...";
            }
            value = title + dot;
        }
        if (wrapheight) this.Wrap_(context, value, x, y, maxwidth, wrapheight, maxlines);
        else context.fillText(value, x, y);

        if (command) {
            var metrics = context.measureText(value);
            this.setclick(context, value, x, y - 18, x + metrics.width, y, command);
        }
    },

    imageroundedrectangle: function (context, x, y, width, height, radius, color,
                                         border, shadow, clip) {
        context.save();

        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();

        // shadow
        if (shadow) {
            context.shadowBlur = shadow.blur;
            context.shadowOffsetX = shadow.x;
            context.shadowOffsetY = shadow.y;
            context.shadowColor = shadow.color;
        }

        // border
        if (border) {
            context.strokeStyle = border.color;
            context.lineWidth = border.width;
            context.stroke();
        }

        // fill
        if (color) {
            context.fillStyle = color;
            return context.fill();
        }

        // clip context
        if (clip) context.clip();
    },


    imagefilledrectangle: function (context, x1, y1, w, h, color) {
        context.fillStyle = color;
        context.fillRect(x1, y1, w, h);
    },

    imagefilledpolygon: function () { // context, color, x1, y1, x2, y2[,...xn, yn]
        var o = arguments, context = o[0], color = o[1], x = o[2], y = o[3];
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x, y);
        for (var j = 4; j < o.length; j += 2)
            context.lineTo(o[j], o[j + 1]);
        context.fill();
    },

    setclick: function (context, name, x1, y1, x2, y2, onclick) {
        this.Bind_(context);
        this.$(context.canvas.id).register(name, x1, y1, x2, y2, onclick);
    },


    remove: function (id) {
        var doomed = document.getElementById(id);
        if (!doomed) return;
        doomed.style.display = "none";
        document.documentElement.removeChild(doomed);
    },


    append: function (context, X, Y, element) {

        var pos = getPosition(context.canvas), x = X - -pos.x,
                y = Y - -pos.y; // dependency!

        var tag = document.createElement("DIV");
        tag.style.position = "absolute";
        tag.style.left = X + "px";
        tag.style.top = y + "px";
        tag.id = "div-dyn-" + Math.random();

        var input = document.createElement(element.name);
        for (var property in element)
            if (property != "name")
                input[property] = element[property]; //.setAttribute (property, element[property]);

        tag.appendChild(input);

        document.documentElement.appendChild(tag);
        return tag.id;
    },




    // internals
    $: function (i) { return this.Bindings[i] },

    posof: function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    },
    invoke: function (id, e) {
        var binding = this.$(id);
        for (var name in binding.Links) {
            binding.Links[name].invoke(this, e);
        }
    },

    Wrap_: function (context, text, x, y, maxWidth, lineHeight, maxLines) {

        var words = text.split(' ');
        var line = '';

        for (var c = 0, n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                c++;
                if (maxLines != undefined && c >= maxLines) return y;
                if (c > 2) return y;
            }
            else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
        return y;

    },
    Bindings: {},
    clear: function () { this.Bindings = {} },
    Bind_: function (context) {

        var canvas = context.canvas, id = canvas.id, api=this;
        if (this.Bindings[id]) return;
        canvas.addEventListener('mousedown', function (evt) {
            var mousePos = api.posof(canvas, evt);
            api.invoke(id, mousePos);
        }, false);

        this.Bindings[id] = {
            Links: {},
            invoke: function (sender, e) {
                for (var item in this.Links)
                    this.Links[item].invoke(this, e);
            },
            register: function (name, x1, y1, x2, y2, onclick) {
                this.Links[name] = {
                    x1: x1, y1: y1, x2: x2, y2: y2, click: onclick,
                    invoke: function (sender, e) {
                        if (e.x > this.x1 && e.x < this.x2 && e.y > this.y1 && e.y < this.y2) {
                            this.click();
                        }
                    }
                }
            }
        }


    }
});