define(['drawing'], function (drawing) {  
    var drawingAPI = drawing;

    return {
        items: [],
        canvas : function (width, height) { 
            var image = new Image(), canvas = document.createElement("canvas");
            canvas.style.width = width + "px"; 
            canvas.style.height = height + "px";
            canvas.width = width; 
            canvas.height = height;  
            image.width = canvas.width; 
            image.height = canvas.height;   

            return { 
                context : canvas.getContext('2d')
              , canvas  : canvas 
              , image   : image
              , url     : function () { return this.canvas.toDataURL();  }
              , clone   : function () { this.image.src = this.url();  }
            }
        }  ,
        create : function (source, width, height, onload, onerror) {
            var photographer = this, id = this.items.length, object = {
                id      : id
              , i       : 0
              , photo   : []
              , slices  : []
              , picture : new Image()  
              , source  : source
              , items   : source.batch
              , width   : width
              , height  : height
              , onload  : onload
              , onerror : onerror
              , loaded  : function () {

                    var that=this, palette = photographer.canvas (this.width, this.height), 
                           stop = function () {  that.onerror() };

                    for (var f, w = this.width/3, e=0;f=this.slices[e];e++) {

                        var x = Math.floor(w * e); 

                        drawingAPI.imagecopyresized (palette.context, f, 0, 0, f.width, f.height, x, 0, f.width, f.height); 

//                          f.dispose();
                    }

                    this.picture.width   = this.width;
                    this.picture.height  = this.height;
                    this.picture.onerror = stop;
                    this.picture.onload  = function () { that.onload();   }
                    this.picture.src = palette.url(); 
                    this.source.batch = this.slices;
//                    palette.canvas.dispose ();
                }

              , shave   : function () {
                    if (this.photo.length == 0) return this.loaded();
                    var that=this, w = this.width/3, f=this.photo.pop(),  
                         s = Sizer.stretch (f, w, this.height), temp = photographer.canvas (s.w, s.h);  
                        drawingAPI.imagecopyresized (temp.context, f, 0, 0, f.width, f.height, s.x, s.y, s.w, s.h);

//                         f.dispose();

                     temp.image.onload = function () {
                         that.slices.push(this);
                         that.shave();
                     }
                     temp.clone(); 
                }

              , add     : function (i) { this.photo.push(i); }
              , peek    : function () { return this.items.pop(); }
              , next    : function () {
                    if (this.items.length == 0) return this.shave();
                    var d=this.peek(), that=this, id=this.id, src = '/rpc/small/id/' + d, 
                           pic = new Image(),
                          next = function () { that.add(this); that.next() }, 
                           stop = function () {  that.onerror() }; 
                                          
                    pic.onload  = next;
                    pic.onerror = stop;
                    pic.src = src;  
                }
            }
            object.next ();
            this.items.push (object);
            return object;
        }
    };
});
 