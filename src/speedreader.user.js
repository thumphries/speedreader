// ==UserScript==
// @name       Speed Reader
// @namespace  http://github.com/shelf/speedreader
// @version    0.1
// @require    http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @description  Fascinating speed reading tool
// @match      *
// @copyright  2014+, T. Humphries, S. Ruji
// ==/UserScript==

var settings = {
    wpm: 400,
    chunkSize: 2,
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
    remTime:0,
};

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
    state.rangeStr= range.toString();
    $('#lb-pp').html('\u275A \u275A');
    speedRead(range.toString(), 0);
}

function initWordArr(s){
    // Dreadful hacky munge
    s = s.replace("\n\n", "<br/>");
    s = s.replace("\n", " ");

    //create regex for chunking
    var pattern = /[^ ]+/g;
    if(settings.chunkSize>1){
        pattern = new RegExp("([^ ]+\\s+){"+settings.chunkSize+"}","g");
    }
    return s.match(pattern);
}

function speedRead(s, startIdx) {
    $('#lb-content').html(s);
    $('#lightbox').show();

    state.wordArr = initWordArr(s);

    state.idx = startIdx;

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

    iterate(state.wordArr, state.idx);
    state.idx++;

    state.interval = setInterval(function(){
        iterate(state.wordArr, state.idx); state.idx++;
    }, getWordTime());

    function iterate(wordArr, pos) {
        var old= wordArr[pos];
        var whiteSpan= "<span id=\"curword\" style='color:white;'>";
        var endSpan = "</span>";
        updateRemTime();
    	if (old==null){
            clearInterval(state.interval);
    	    state.interval = {};
    	    // We want justified style on halt
            $('#lb-centred').hide();
    	    $('#lb-content').show();
     	    $('#lb-content').html(whiteSpan + wordArr.join(" ") + endSpan);
    	    state.running = false;

    	    // Reset idx and scroll
    	    $("#lb-pp").html('\u27f2');
    	    state.idx = 0;
        } else {
            wordArr[pos] = whiteSpan+old+endSpan;
            if (!settings.centred) {
                $('#lb-content').html(wordArr.join(" "));
            } else {
                $('#lb-centred').html(whiteSpan + wordArr[pos] + endSpan);
	    }

            wordArr[pos]=old;

	    var cw = $('#curword');
	    var pos = cw.position();
            if (!cw || pos === undefined ||
	        (cw && pos !== undefined && pos.top == 0)) {
                 $('#lb-content').scrollTop(0);
	    } else {
                var top = pos.top;
       	        var scroll = $('#lb-content').scrollTop();
      	        if (top < 0) {
                    $('#lb-content').scrollTop(scroll + top);
      	        }
      	        if (top >= 300) {
                    $('#lb-content').scrollTop(scroll + 230);
      	        }
            }
	}
    }
}

function getWordTime(){
    var adjustedTime = settings.wpm/ settings.chunkSize
    return constants.msInSec/adjustedTime;
}

function resetInterval(){
    clearInterval(state.interval);
    goRead();
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
    "font: 12px arial, sans-serif;"+
	' display: none;' +
	' overflow: hidden;' +
	' z-index: 9999999;' +
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
	' position: fixed; top: 1em; left: 1em;' +
	' color: #DDD; font-size: 2em;' +
        '}' +
	'#lb-exit:hover { color: #FFF; cursor: pointer;}' +
	'#lb-pp {' +
	' font-size: 3em; width: 20%;' +
	' color: #DDD; letter-spacing: -0.15em;' +
	'}' +
	'#lb-pp:hover {' +
	' color: #FFF; cursor: pointer;' +
	'}' +
	'#lb-mode {' +
	' color: #FFF; font-size: 2em;' +
	' position: fixed; left: 1em; bottom: 1em;' +
	'}' +
	'#lb-controls {' +
	' position: fixed; bottom: 1em; width: 50%; max-height: 15%;' +
	' margin-left: 25%; margin-right: 25%;' +
	'}' +
	'#lb-controls-inner {' +
	' width: auto; margin-left: auto; margin-right: auto;' +
	'}' +
	'#sp-read {' +
	'}'+
        "#lb-timeRem{"+
        " color: white; font-size: 2em;"+
        " font-style: bold;"+
	' position: fixed; right: 1em; bottom: 1em;' +
	'}' +
	'#lb-wpm {' +
	' width: 40%;' +
	'}' +
	'#lb-chunks {' +
	' width: 40%;' +
	'}';
    return css;
}
function updateRemTime(){
    var remIndexes= (state.wordArr.length-(state.idx));
    // alert(remIndexes);
    var remTime= getWordTime()*settings.chunkSize*remIndexes;
    min = Math.floor((remTime/1000/60) << 0);
    //sec = Math.floor((remTime/1000) % 60);
    var remTimeStr= min + "m";
    $('#lb-timeRem').html(remTimeStr);
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
    controls.setAttribute("id", "lb-controls-inner");
    var ppButton = document.createElement("span");
    ppButton.innerHTML = '\u275A \u275A';
    ppButton.setAttribute("id", "lb-pp");

    var controlCnt = document.createElement("div");
    controlCnt.setAttribute("id", "lb-controls");

    //wpm slider
    var wpmVal = document.createElement("input");
    wpmVal.setAttribute("id","lb-wpm");
    wpmVal.setAttribute("type","range");
    wpmVal.setAttribute("min",100);
    wpmVal.setAttribute("max",2000);
    $(wpmVal).val(settings.wpm);
    $(wpmVal).change(function(){
        settings.wpm= $(wpmVal).val();
        clearInterval(state.interval);
        goRead();
    });
    controls.appendChild(wpmVal);
    controlCnt.appendChild(controls);

    // chunk size slider
    var chunkSizeSlider = document.createElement("input");
    chunkSizeSlider.setAttribute("id","lb-chunks");
    chunkSizeSlider.setAttribute("type","range");
    chunkSizeSlider.setAttribute("min",1);
    chunkSizeSlider.setAttribute("max",5);
    $(chunkSizeSlider).val(settings.chunkSize);
    $(chunkSizeSlider).change(function(){
        var oldChunkSize = settings.chunkSize;
        settings.chunkSize= $(chunkSizeSlider).val();
        clearInterval(state.interval);
        var newStateIdx= Math.floor((state.idx*oldChunkSize)/settings.chunkSize);
        speedRead(state.rangeStr, newStateIdx);
    });

    controls.appendChild(ppButton);
    controls.appendChild(chunkSizeSlider);

    // mode
    var modeButton = document.createElement("span");
    modeButton.innerHTML = '\u2261';
    modeButton.setAttribute("id", "lb-mode");
    lbdiv.appendChild(modeButton);
    lbdiv.appendChild(controlCnt);

    // time remaining
    var timeRem = document.createElement("span");
    timeRem.setAttribute("id","lb-timeRem");
    updateRemTime();
    lbdiv.appendChild(timeRem);

    // exitButton
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
	    $("#lb-mode").html('\u2261');
	} else {
	    $("#lb-content").hide();
	    $("#lb-centred").show();
	    settings.centred = true;
	    $("#lb-mode").html('\u2012');
	}
    }

    $('#lb-pp').on("click", pp);
    $('#lb-content').on("click", pp);
    $('#lb-centred').on("click", pp);
    $('#lb-mode').on("click", chm);
}
