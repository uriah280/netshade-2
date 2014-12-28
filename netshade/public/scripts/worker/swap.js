define(['lib/drawing', 'lib/animation'], function (drawing, animation) {
    var drawingAPI = drawing;
    var animator = animation;
    return {
        create: function (picture, source, dimension, callback, direction
                            , onclick) {
            var object = {
                image: {
                    left: document.createElement("canvas"), // old image
                    right: source // new image
                },
                x: direction && direction < 0 ? -dimension.w : 0,
                picture: picture,
                direction: direction,
                dimension: dimension,
                callback: callback,
                onclick: onclick, 
                canvas: document.createElement("canvas"),
                animate: function () {
                    var dim = this.dimension, left_ = this.image.left, right_ = this.image.right,
                       context = this.canvas.getContext('2d'), picture2d = this.picture.getContext('2d'),
                     order = this.direction && this.direction < 0 ? [right_, left_] : [left_, right_],
                      left = order[0], right = order[1];

                    drawingAPI.imagecopyresized(context, left, 0, 0, left.width, left.height, this.x, 0, dim.w, dim.h);
                    drawingAPI.imagecopyresized(context, right, 0, 0, right.width, right.height, this.x + dim.w, 0, dim.w, dim.h);

                    picture2d.drawImage(this.canvas, 0, 0);

                    if (this.eol() && this.callback)
                        this.callback();
                },
                eol: function () {
                    var that = this;
                    if (this.direction && this.direction < 0) {
                        if (this.x < 0) {
                            this.x -= -Math.floor(this.dimension.w / 5);
                            if (this.x > 0)
                                this.x = 0;
                            animator.run(function () {
                                that.animate();
                            });
                            return false;
                        }
                    }
                    else if (this.x > -this.dimension.w) {
                        this.x -= Math.floor(this.dimension.w / 5);
                        if (this.x < -this.dimension.w)
                            this.x = -this.dimension.w;
                        animator.run(function () {
                            that.animate();
                        });
                        return false;
                    }
                    return true;
                },
                load: function () {
                    var that = this, context = this.image.left.getContext('2d');
                    this.dimension.fit(this.image.left, this.picture, this.canvas);
                    context.drawImage(this.picture, 0, 0);

                    if (this.onclick) {
                        $(this.picture).off("click");
                        $(this.picture).click(this.onclick);
                    } 
                    this.animate();
                }
            };
            object.load();
            return object;
        }
    }
});