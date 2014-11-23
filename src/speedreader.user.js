// ==UserScript==
// @name       Speed Reader
// @namespace  http://github.com/shelf/speedreader
// @version    0.1
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @description  Fascinating speed reading tool
// @match      http://*/*
// @copyright  2014+, T. Humphries, S. Ruji
// ==/UserScript==

var settings = {
    wpm: 100,
    chunkSize: 4,
    centred: false,
};

var constants= {
    msInSec: 60000,
    engAvgWordLen: 5.1
};

var state = {
    running: false,
    interval: {},
    wordArr: [],
    idx: 0,
};

// Spawn floating button until we start to bundle
var button = document.createElement("a");
button.innerHTML = "Speed read selection";
button.setAttribute("href", "#");
//button.setAttribute("onclick", "processSelection(); return false;")
button.onclick = processSelection;
button.setAttribute("style", "position: fixed; right: 0; left: auto;");
document.body.insertBefore(button, document.body.firstChild);

lightbox();

function processSelection () {
    var selObj = window.getSelection();
    var range;
    if (selObj.toString() == "") {
        // Select whole page
	range = document.createRange();
	range.selectNode(document.getElementsByTagName("body").item(0));
    } else {
        range = selObj.getRangeAt(0);
    }

    speedRead(range.toString());
}

function speedRead(s) {
    $('#lb-content').html(s);
    $('#lightbox').show();

    // Dreadful hacky munge
    s = s.replace("\n\n", "<br/>");
    s = s.replace("\n", " ");

    //create regex for chunking
    var pattern = /[^ ]+/g;
    if(settings.chunkSize>1){
        pattern = new RegExp("([^ ]+\\s+){"+settings.chunkSize+"}","g");
    }

    state.wordArr = s.match(pattern);

    state.idx = 0;

    goRead ();
}

function goRead () {
    if (settings.centred) {
	$("#lb-content").hide();
        $("#lb-centred").show();
    } else {
        $("#lb-centred").hide();
        $("#lb-content").show();
    }

    state.running = true;
    var curWord = state.wordArr[state.idx];

    state.interval = setInterval(function(){
        iterate(state.wordArr, state.idx); state.idx++;
    }, getWordTime(settings.wpm / settings.chunkSize, state.wordArr.length));

    var whitespan = "<span id=\"curword\" style='color:white;'>";
    var endspan = "</span>";

    function iterate(wordArr, pos) {
        var old= wordArr[pos];

	if (old==null){
            clearInterval(state.interval);
	    state.interval = {};
	    // We want justified style on halt
            $('#lb-centred').hide();
	    $('#lb-content').show();
 	    $('#lb-content').html(whitespan + wordArr.join(" ") + endspan);
	    state.running = false;

	    // Reset idx and scroll
	    $("#lb-pp").html('\u27f2');
	    state.idx = 0;
	    return;
        }

	wordArr[pos] = whitespan+old+endspan;
        if (!settings.centred) {
            $('#lb-content').html(wordArr.join(" "));
	} else {
            $('#lb-centred').html(whitespan + wordArr[pos] + endspan);
	}
        wordArr[pos]=old;



        var top = $('#curword').position().top;
    	var scroll = $('#lb-content').scrollTop();

    	if (top == 0) $('#lb-content').scrollTop(0);

    	if (top < 0) {
                $('#lb-content').scrollTop(scroll + top);
    	}
    	if (top >= 300) {
                $('#lb-content').scrollTop(scroll + 230);
    	}
    }

    function getWordTime(wpm, numWords){
      return constants.msInSec/wpm;
    }
}

function pauseRead () {
    clearInterval(state.interval);
    state.interval = {};
    state.running = false;
}

document.onReady = setupHotkeys();

function setupHotkeys(){
    var isCtrl = false;
    document.onkeyup=function(e) {
        if(e.which == 17){
            isCtrl=false;
        }
    };
    document.onkeydown= function(e){
        if(e.which == 17) {isCtrl=true; }
        if(e.which == 81 && isCtrl == true) {
            processSelection();
            return false;
        }
    }
};

function lightboxStyle() {
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML =
	'#lightbox {' +
	' position: fixed; top:0; left:0; width: 100%; height: 100%;' +
	' background-color: black;' +
	' display: none;' +
	' overflow: hidden;' +
	'}' +
	'#lb-content, #lb-centred {' +
	' color: #333;' +
	' min-height: 65%; max-width: 100%; max-height: 65%;' +
	' font-size: 2em;' +
	' white-space: normal;' +
	' text-align: justify;' +
	' padding-top: 3em;' +
	' margin-left: auto; margin-right: auto;' +
	' padding-left: 5em; padding-right: 5em;' +
	' overflow-y: scroll; overflow-x: hidden;' +
	' word-wrap: break-word;' +
	'}' +
	'#lb-centred {' +
	' display: none; text-align: center;' +
	' padding-top: 8em; padding-bottom: auto;' +
	'}' +
	'#lb-exit {' +
	' position: fixed; top: 15; left: 15;' +
	' color: #DDD; font-size: 2em;' +
        '}' +
	'#lb-exit:hover { color: #FFF; cursor: pointer;}' +
	'#lb-pp {' +
	' font-size: 3em; width: 6em;' +
	' color: #DDD; letter-spacing: -0.15em;' +
	'}' +
	'#lb-pp:hover {' +
	' color: #FFF; cursor: pointer;' +
	'}' +
	'#lb-mode {' +
	' color: #FFF; font-size: 2em;' +
	'}' +
	'#lb-controls {' +
	' position: fixed; bottom: 0; left: 0; width: 50%; max-height: 15%;' +
	' margin-left: auto; margin-right: auto;' +
	'}';
    return css;
}

function lightboxOverlay() {
    var lbdiv = document.createElement("div");

    //content
    lbdiv.setAttribute("id", "lightbox");
    var content = document.createElement("div");
    content.setAttribute("id", "lb-content");
    lbdiv.appendChild(content);


    var centred = document.createElement("div");
    centred.setAttribute("id", "lb-centred");
    lbdiv.appendChild(centred);

    //controls
    var controls = document.createElement("div");
    controls.setAttribute("id", "lb-controls");
    var ppButton = document.createElement("span");
    ppButton.innerHTML = '\u275A \u275A';
    ppButton.setAttribute("id", "lb-pp");
    controls.appendChild(ppButton);
    //slider
    var slider = document.createElement("div");
    $(slider).slider();
    controls.appendChild(slider);


    var modeButton = document.createElement("span");
    modeButton.innerHTML = 'C';
    modeButton.setAttribute("id", "lb-mode");
    controls.appendChild(modeButton);

    lbdiv.appendChild(controls);

    //exitButton
    var exButton = document.createElement("span");
    exButton.innerHTML = '\u00d7';
    exButton.setAttribute("id", "lb-exit");
    lbdiv.appendChild(exButton);

    return lbdiv;
}

function lightbox () {
    document.body.appendChild(lightboxStyle());
    document.body.appendChild(lightboxOverlay());
    $('#lb-exit').on("click", function() {
	pauseRead();
        $('#lightbox').hide();
    });

    var pp = function() {
        if(state.running) {
	    pauseRead();
	    $('#lb-pp').html('\u25B6');
	} else {
            goRead();
	    $('#lb-pp').html('\u275A \u275A');
	}
    };

    var chm = function() {
        if(settings.centred) {
            $("#lb-centred").hide();
	    $("#lb-content").show();
	    settings.centred = false;
	} else {
	    $("#lb-content").hide();
	    $("#lb-centred").show();
	    settings.centred = true;
	}
    }

    $('#lb-pp').on("click", pp);
    $('#lb-content').on("click", pp);
    $('#lb-centred').on("click", pp);
    $('#lb-mode').on("click", chm);
}
