// ==UserScript==
// @name       Speed Reader
// @namespace  http://github.com/shelf/speedreader
// @version    0.1
// @description  Fascinating speed reading tool
// @match      http://*/*
// @copyright  2014+, T. Humphries, S. Ruji
// ==/UserScript==

// Spawn floating button until we start to bundle
var button = document.createElement("a");
button.innerHTML = "Speed read selection";
button.setAttribute("href", "#");
button.setAttribute("onclick", "processSelection(); return false;")
button.setAttribute("style", "position: fixed; right: 0; left: auto;");
document.body.insertBefore(button, document.body.firstChild);

function processSelection () {
    var selObj = window.getSelection();
    var range = selObj.getRangeAt(0);
    speedRead(range.toString());
}

function speedRead(s) {
    alert(s);
}
