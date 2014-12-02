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
    highlight: "#FFF",
    lowlight: "#151515",
};

var constants= {
    msInSec: 60000,
    engAvgWordLen: 5.1,
    pauseButton: '\u275A \u275A',
    playButton: '\u25B6',
    unCentered: '\u2261',
    centered: '\u2012',
    exitButton: '\u00d7',
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
    $('#lb-pp').html(constants.pauseButton);
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
    //$('#lb-content').html(s);

    $('#lightbox').show();

    state.wordArr = initWordArr(s);
    var st = spanIt();
    $('#lb-content').html(spanIt());
    console.log(st);
    state.idx = startIdx;

    goRead ();
}

function spanIt () {
    var i = 0;
    var s = "";
    while (state.wordArr[i] != null) {
        s += "<span class='sprd-word' id='sprd-" + i + "'>" +
	     state.wordArr[i] + "</span> ";
	i++;
    }
    return s;
}

function goRead () {
    updateWpm();
    if (settings.centred) {
	$("#lb-content").hide();
        $("#lb-centred").show();
    } else {
        $("#lb-centred").hide();
        $("#lb-content").show();
    }

    $('.sprd-word').css("color", settings.lowlight);
    state.running = true;
    var curWord = state.wordArr[state.idx];

    iterate(state.wordArr, state.idx);
    state.idx++;

    state.interval = setInterval(function(){
        iterate(state.wordArr, state.idx); state.idx++;
    }, getWordTime());

    function iterate(wordArr, pos) {
        var old= wordArr[pos];

        updateRemTime();
    	if (old==null){
            clearInterval(state.interval);
    	    state.interval = {};
    	    // We want justified style on halt
            $('#lb-centred').hide();
    	    $('#lb-content').show();
     	    //$('#lb-content').html(whiteSpan + wordArr.join(" ") + endSpan);
	    $('.sprd-word').css("color", settings.highlight);
    	    state.running = false;

    	    // Reset idx and scroll
    	    $("#lb-pp").html(constants.playButton);
    	    state.idx = 0;
        } else {
            if (!settings.centred) {
                //$('#lb-content').html(wordArr.join(" "));
		$('#sprd-' + pos).css("color", "#FFF");
		$('#sprd-' + (pos - 1)).css("color", settings.lowlight);
            } else {
		var whiteSpan= "<span id=\"curword\" style='color:white;'>";
                var endSpan = "</span>";
                $('#lb-centred').html(whiteSpan + wordArr[pos] + endSpan);
	    }

	    var cw = $('#sprd-' + pos);
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
        } else if (e.which == 27) {
            // esc
	    pauseRead();
            $('#lightbox').hide();
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
	' color: ' + settings.lowlight + ';' +
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
	' color: #DDD; font-size: 3em;' +
        '}' +
	'#lb-exit:hover { color: #FFF; cursor: pointer;}' +
	'#lb-pp {' +
	' font-size: 3em; width: 15%; margin-left: auto; margin-right: auto;' +
	' clear: none;' +
	' color: #DDD; letter-spacing: -0.15;' +
	'}' +
	'#lb-pp:hover {' +
	' color: #FFF; cursor: pointer;' +
	'}' +
	'#lb-mode {' +
	' color: #DDD; font-size: 3em;' +
	' position: fixed; left: 1em; bottom: 1em;' +
	'}' +
	'#lb-mode:hover {' +
	' color: #FFF; cursor: pointer;' +
        '}' +
	'#lb-controls {' +
	' position: fixed; bottom: 3em; width: 50%; max-height: 15%;' +
	' margin-left: 25%; margin-right: 25%;' +
	'}' +
	'#lb-controls-inner {' +
	' width: 100%; margin-left: auto; margin-right: auto;' +
	' background-color: #333;' +
	' border-radius: 0.5em;' +
	' column-count: 3;' +
	'}' +
	'#sp-read {' +
	'}'+
        "#lb-timeRem{"+
        " color: white; font-size: 2em;"+
        " font-style: bold;"+
	' position: fixed; right: 1.5em; top: 1.5em;' +
	'}' +
	'#lb-wpmdisp {' +
	' position: fixed; right: 1.5em; bottom: 1.5em;' +
	' color: #DDD; font-size: 2em;' +
	'}' +
	'#wmpSpan, #chunkSpan {' +
	' width: 40%; height: 100%;' +
	' color: #DDD; font-size: 1.2em;' +
	' padding-top: 0.5em;' +
	'}' +
	'#wmpSpan { float: left; }' +
	'#chunkSpan { float: right; }' +
	'#wmpSpan span, #chunkSpan label {' +
	' padding-top: auto; padding-bottom: 1em;' +
        //' width: 5em; padding-left: auto; margin-right: 2em;' +
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
function updateWpm() {
    $('#lb-wpmdisp').html(settings.wpm + "WPM/" + settings.chunkSize);
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
    var ppButton = document.createElement("div");
    ppButton.innerHTML = constants.pauseButton;
    ppButton.setAttribute("id", "lb-pp");

    var controlCnt = document.createElement("div");
    controlCnt.setAttribute("id", "lb-controls");

    //wpm slider
    var wmpSpan= document.createElement("div");
    wmpSpan.setAttribute("id","wmpSpan");
    var wmpLabel = document.createElement("label");
    $(wmpLabel).text("WPM");
    wmpSpan.appendChild(wmpLabel);

    var wpmVal = document.createElement("input");
    wpmVal.setAttribute("id","lb-wpm");
    wpmVal.setAttribute("type","range");
    wpmVal.setAttribute("min",100);
    wpmVal.setAttribute("max",2000);
    wpmVal.setAttribute("title", "Words Per Minute");
    // var wpmDL= document.createElement("datalist");
    // wmpSpan.appendChild(wpmDL);
    // wpmDL.setAttribute("id","wpmDl");
    // for(var i=0; i<4;i++){
    //     $(wpmDL).append("<option value='"+ i*500+"'>");
    // }
    // $(wpmVal).attr("list", "wpmDl");

    $(wpmVal).val(settings.wpm);
    $(wpmVal).change(function(){
        settings.wpm= $(wpmVal).val();
        clearInterval(state.interval);
	updateWpm();
        goRead();
    });
    // Good lord this is spaghetti - take care when reordering
    wmpSpan.appendChild(wpmVal);
    controls.appendChild(wmpSpan);

    //chunk size
    var chunkSpan= document.createElement("div");
    chunkSpan.setAttribute("id","chunkSpan");
    var chunkLabel = document.createElement("label");
    $(chunkLabel).text("Chunk");

    var chunkSizeSlider = document.createElement("input");
    chunkSizeSlider.setAttribute("id","lb-chunks");
    chunkSizeSlider.setAttribute("type","range");
    chunkSizeSlider.setAttribute("min",1);
    chunkSizeSlider.setAttribute("max",5);
    chunkSizeSlider.setAttribute("title", "Chunk Size");
    $(chunkSizeSlider).val(settings.chunkSize);
    $(chunkSizeSlider).change(function(){
        var oldChunkSize = settings.chunkSize;
        settings.chunkSize= $(chunkSizeSlider).val();
        clearInterval(state.interval);
        var newStateIdx= Math.floor((state.idx*oldChunkSize)/settings.chunkSize);
	if (state.running == false) {
	    $('#lb-pp').html(constants.pauseButton);
	}
        speedRead(state.rangeStr, newStateIdx);
    });
    chunkSpan.appendChild(chunkSizeSlider);
    chunkSpan.appendChild(chunkLabel);
    controls.appendChild(chunkSpan);
    controls.appendChild(ppButton);

    // mode
    var modeButton = document.createElement("span");
    modeButton.innerHTML = constants.unCentered;
    modeButton.setAttribute("id", "lb-mode");

    modeButton.setAttribute("title", "View Mode");
    lbdiv.appendChild(modeButton);
    controlCnt.appendChild(controls);
    lbdiv.appendChild(controlCnt);

    // time remaining
    var timeRem = document.createElement("span");
    timeRem.setAttribute("id","lb-timeRem");
    updateRemTime();
    lbdiv.appendChild(timeRem);

    // WPM display
    var wpmDisp = document.createElement("span");
    wpmDisp.setAttribute("id", "lb-wpmdisp");
    updateWpm();
    lbdiv.appendChild(wpmDisp);

    // exitButton
    var exButton = document.createElement("span");
    exButton.innerHTML = constants.exitButton;
    exButton.setAttribute("title", "Close");
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
	    $('#lb-pp').html(constants.playButton);
	} else {
            goRead();
	    $('#lb-pp').html(constants.pauseButton);
	}
    };

    var chm = function() {
        if(settings.centred) {
            $("#lb-centred").hide();
	    $("#lb-content").show();
	    settings.centred = false;
	    $("#lb-mode").html(constants.unCentered);
	} else {
	    $("#lb-content").hide();
	    $("#lb-centred").show();
	    settings.centred = true;
	    $("#lb-mode").html(constants.centered);
	}
    }

    $('#lb-pp').on("click", pp);
    $('#lb-content').on("click", pp);
    $('#lb-centred').on("click", pp);
    $('#lb-mode').on("click", chm);
}
