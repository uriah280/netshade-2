define(function () {

    return {
        force: function () {
            for (var object, i = 0; object = arguments[i]; i++) {
                object.width = this.w;
                object.height = this.h;
            }
        },
        fit: function (picture, size, height, force) {
            if (size < 0) return this.scale(picture);
            var  w = picture.width, h = picture.height, r = w / h, w1 = size, h1 = w1 / r, x = 0, y = 0;

            if (w > h && !force) { // long 
                h1 = size;
                w1 = h1 * r;
                if (w1 > size) {
                    x = (size - w1) / 2;
                }
            }

            if (height && height < h1 && w > h) {
                y = -((h1 - height) / 2);
            }

            var object = {
                w: w1,
                h: h1,
                x: x,
                y: y,
                fit: this.force
            };
            return object;
        },
        stretch: function (picture, w1, h1) {

            var w = picture.width, h = picture.height, r = w / h, H = h1, W = H * r, x = 0, y = 0;

            if (!h1) {
                w1 = $(window).width() - 16
                H = $(window).height() - 116
                W = H * r
            }

            while (w1 > W) {
                W++;
                H = W / r;
            }

            if (W > w1) {
                x = -((W - w1) / 2);
            }

            if (H > h1) {
                y = -((H - h1) / 2);
            }

            var object = {
                w: Math.floor(W),
                h: Math.floor(H),
                x: Math.floor(x),
                y: Math.floor(y),
                fit: this.force
            };
            return object;

        },
        scale: function (picture) {

            var w = picture.width, h = picture.height, r = w / h, W = $(window).width() - 16, w1 = W, h1 = w1 / r,
                                H = $(window).height() - 60, h2 = H, x = 0, y = 0;

            if (w > h) { // long  
            } else {
                h1 = h2;
                w1 = h1 * r;
            }

            while (h1 > H || w1 > W) {
                w1--;
                h1 = w1 / r;
            }



            var object = {
                w: w1,
                h: h1,
                x: x,
                y: y,
                fit: this.force
            };
            return object;
        }
    }

})