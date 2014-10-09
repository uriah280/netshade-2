
var connection = { 

    open : function (address) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", address, true);
        xhr.onreadystatechange = function( )
        {
            if ( xhr.readyState == 4 )
            {
                if ( ( xhr.status >= 200 && xhr.status < 300 ) || xhr.status == 0 )
                {
                    self.postMessage( {content : xhr.responseText, status : 1 } );
                }
                else
                {
                    self.postMessage( {content : xhr.responseText, status : 0 } );
                }
            }
        }
        xhr.send();
    }

}




self.onmessage = function(e) { 
    var keys;
    if (keys = e.data.keys)
    {
        self.postMessage( {content : keys.length + "!!", status : 1 } );
        return;
    }
    connection.open(e.data.uri); 
}


