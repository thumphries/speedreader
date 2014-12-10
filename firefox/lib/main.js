var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var pageMod = require("sdk/page-mod");
var buttons = require('sdk/ui/button/action');

var workers = [];

var button = buttons.ActionButton({
    id: "sonicreader-link",
    label: "Speedread selection",
    icon: {
        "16": "./icon-16.png",
        "32": "./icon-32.png",
        "64": "./icon-64.png"
    },
    onClick: function (state) {
        var myid = tabs.activeTab.id;
	workers[myid].port.emit("read", "");
    },
});

pageMod.PageMod({
    include: /.*/,
    contentScriptFile: [data.url("jquery.min.js"),
                        data.url("speedreader.user.js"),
 	                data.url("firefox-glue.js")],
    onAttach: function(worker) {
	var myid = tabs.activeTab.id;
        workers[myid] = worker;

	worker.on('detach', function () {
            detachWorker(this, workers);
        });
    },
});

function detachWorker (w, arr) {
    // Don't leak memory - delete workers for closed tabs
    var index = workerArray.indexOf(w);
    if(index != -1) {
	arr[w] = null;
    }
}
