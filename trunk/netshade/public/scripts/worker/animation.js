 
define(function () { 

    return {
        run: function (callback, element) {
             var start,
                finish;

             window.setTimeout(function () {
                 start = +new Date();
                 callback(start);
                 finish = +new Date();

                 self.timeout = 1000 / 60 - (finish - start);

             }, self.timeout);
         }
     }; 


}); 
