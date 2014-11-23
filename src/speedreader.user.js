// ==UserScript==
// @name       Speed Reader
// @namespace  http://github.com/shelf/speedreader
// @version    0.1
// @description  Fascinating speed reading tool
// @match      http://*/*
// @copyright  2014+, T. Humphries, S. Ruji
// ==/UserScript==

var settings = {
    wpm: 400,
    chunk: 1,
};

// Spawn floating button until we start to bundle
var button = document.createElement("a");
button.innerHTML = "Speed read selection";
button.setAttribute("href", "#");
button.setAttribute("onclick", "processSelection(); return false;")
button.setAttribute("style", "position: fixed; right: 0; left: auto;");
document.body.insertBefore(button, document.body.firstChild);

lightbox();

var interval;

function processSelection () {
    var selObj = window.getSelection();
    var range = selObj.getRangeAt(0);

    speedRead(range.toString());
}

function speedRead(s) {
    $('#lb-content').html(s);
    $('#lightbox').show();

    // Dreadful hacky munge
    s = s.replace("\n\n", "<br/>");
    s = s.replace("\n", " ");

    var wordArr = s.split(" ");

    var i=0;
    var curWord= wordArr[i];

    var scrollPos = 0;
    interval = setInterval(function(){iterate(wordArr, i); i++;}, getWordTime(settings.wpm, wordArr.length));

    var whitespan = "<span id=\"curword\" style='color:white;'>";
    var endspan = "</span>";

    function iterate(wordArr, pos) {
        var old= wordArr[pos];

	if (old==null){
            clearInterval(interval);
	    $('#lb-content').html(whitespan + wordArr.join(" ") + endspan);
	    return;
        }

	wordArr[pos] = whitespan+old+endspan;
        $('#lb-content').html(wordArr.join(" "));
        wordArr[pos]=old;



        var top = $('#curword').position().top;
        if (top > scrollPos) {
            $('#lb-content').scrollTop( top );
            scrollPos = top;
        }
    }

    function getWordTime(wpm, numWords){
      return 60000/wpm;
    }
}

function lightboxStyle() {
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML =
	'#lightbox {' +
	' position: fixed; top:0; left:0; width: 100%; height: 100%;' +
	' background-color: black;' +
	' display: none;' +
	' overflow: scroll;' +
	'}' +
	'#lb-content {' +
	' color: black;' +
	//' background-color: white;' +
	' max-height: 90%;' +
	' width: 20em;' +
	' font-size: 2em;' +
	' white-space: pre-wrap;' +
	' text-align: justify;' +
	' margin-top: 3em; margin-bottom: 3em;' +
	' margin-left: auto; margin-right: auto;' +
	' overflow: scroll;' +
	'}';
    return css;
}

function lightboxOverlay() {
    var lbdiv = document.createElement("div");
    lbdiv.setAttribute("id", "lightbox");
    var content = document.createElement("div");
    content.setAttribute("id", "lb-content");
    lbdiv.appendChild(content);
    return lbdiv;
}

function lightbox () {
    document.body.appendChild(lightboxStyle());
    document.body.appendChild(lightboxOverlay());
    $('#lightbox').on("click", function() {
	clearInterval(interval);
        $('#lightbox').hide();
    });
}
