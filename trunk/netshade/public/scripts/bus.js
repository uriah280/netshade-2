// alert ("It's meeee!!");
var ServiceBus = {
    Clear: function () {
        for (var x in this.Member) {
            if (this.Member[x]['clear']) this.Member[x].clear();
        }
    },
    Member: {},
    Subscribe: function () {
        var name = arguments[0];
        if (!this[name]) this.Add(name);
        for (var i = 1; i < arguments.length; i++)
            this.Member[name].subscribe(arguments[i]);
    },
    Add: function () {
        for (var i = 0; i < arguments.length; i++)
            this._Add(arguments[i]);
    },
    _Add: function (name) {
        if (!this.Member[name]) {
            this.Member[name] = {
                name: name,
                clear: function () { this.subscribers = []; },
                subscribers: [],
                subscribe: function (object) { this.subscribers.push(object) }
            }
        }
        this[name] = function (sender, arguments) {
            for (var i = 0; i < ServiceBus.Member[name].subscribers.length; i++) {
                if (ServiceBus.Member[name].subscribers[i])
                    ServiceBus.Member[name].subscribers[i].invoke(sender, arguments);
            }
        }
        return;
    }
}
 

ServiceBus.Add ("Progress", "OnPageResize", "Fancy", "FrameLoaded", "OnDyntext");


