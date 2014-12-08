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
    centred: true,
    highlight: "#FFF",
    lowlight: "#151515",
    buttonColor: "#DDD",
    buttonHover: "#FFF",
    panelColor: "#333",
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

var elts = {
    lightbox: null,
    content: null,
    centred: null,
    controls: null,
    ppButton: null,
    controlCnt: null,
    wmpSpan: null,
    wmpLabel: null,
    wpmDisp: null,
    wpmVal: null,
    chunkSpan: null,
    chunkLabel: null,
    chunkSizeSlider: null,
    modeButton: null,
    timeRem: null,
    wpmDisp: null,
    exButton: null,
}

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
    $('#lightbox').show();

    state.wordArr = initWordArr(s);
    var st = spanIt();
    $('#lb-content').html(spanIt());
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
        }
    }
};

function lightboxStyle() {
    //var css = document.createElement("style");
    //css.type = "text/css";
    $(elts.lightbox).css({
        "position"        : "fixed",
	"top"             : "0",
	"left"            : "0",
	"width"           : "100%",
	"height"          : "100%",
	"background-color": "black",
	"font"            : "12px arial, sans-serif",
	"overflow"        : "hidden",
	"z-index"         : "9999999",
	"display"         : "none",
    });
    var contentStyle = {
        "color"        : settings.lowlight,
	"min-height"   : "65%",
	"max-width"    : "100%",
	"max-height"   : "65%",
	"font-size"    : "2em",
	"white-space"  : "normal",
	"text-align"   : "justify",
	"padding-top"  : "3em",
	"margin-left"  : "auto",
	"margin-right" : "auto",
	"padding-left" : "5em",
	"padding-right": "5em",
	"overflow-y"   : "scroll",
	"overflow-x"   : "hidden",
	"word-wrap"    : "break-word",
    };
    $(elts.content).css(contentStyle);
    $(elts.centred).css(contentStyle);
    // centred has a few minor differences...
    $(elts.centred).css("display", "none");
    $(elts.centred).css("text-align", "center");
    $(elts.centred).css("padding-top", "8em");
    $(elts.centred).css("padding-bottom", "auto");

    $(elts.exButton).css({
        "position"  : "fixed",
	"top"       : "1em",
	"left"      : "1em",
	"color"     : settings.buttonColor,
	"font-size" : "3em",
	"cursor"    : "pointer",
    });
    $(elts.exButton).hover(
	function () { $(elts.exButton).css("color", settings.buttonHover); },
        function () { $(elts.exButton).css("color", settings.buttonColor); }
    );

    $(elts.ppButton).css({
        "font-size"      : "3em",
	"width"          : "15%",
	"margin-left"    : "auto",
	"margin-right"   : "auto",
	"clear"          : "none",
	"color"          : settings.buttonColor,
	"letter-spacing" : "-0.15",
	"cursor"         : "pointer",
    });
    $(elts.ppButton).hover(
        function () { $(elts.ppButton).css("color", settings.buttonHover); },
	function () { $(elts.ppButton).css("color", settings.buttonColor); }
    );

    $(elts.modeButton).css({
        "color"     : "#DDD",
	"font-size" : "3em",
	"position"  : "fixed",
	"left"      : "1em",
	"bottom"    : "1em",
	"cursor"    : "pointer",
    });
    $(elts.modeButton).hover(
        function () { $(elts.modeButton).css("color", settings.buttonHover);} ,
	function () { $(elts.modeButton).css("color", settings.buttonColor);}
    );

    $(elts.controlCnt).css({
        "position"     : "fixed",
	"botton"       : "3em",
	"width"        : "50%",
	"max-height"   : "15%",
	"margin-left"  : "25%",
	"margin-right" : "25%",
    });

    $(elts.controls).css({
        "width"        : "100%",
	"margin-left"  : "auto",
	"margin-right" : "auto",
	"background-color" : settings.panelColor,
	"border-radius": "0.5em",
	"column-count" : "3",
    });

    $(elts.timeRem).css({
        "color"      : settings.buttonColor,
	"font-size"  : "2em",
	"font-style" : "bold",
	"position"   : "fixed",
	"right"      : "1.5em",
	"top"        : "1.5em",
    });

    $(elts.wpmDisp).css({
        "position"  : "fixed",
	"right"     : "1.5em",
	"bottom"    : "1.5em",
	"color"     : settings.buttonColor,
	"font-size" : "2em",
    });

    var sliders = {
        "width"       : "40%",
	"height"      : "100%",
	"color"       : settings.buttonColor,
	"font-size"   : "1.2em",
	"padding-top" : "0.5em",
    };
    $(elts.wmpSpan).css(sliders);
    $(elts.wmpSpan).css("float", "left");
    $(elts.chunkSpan).css(sliders);
    $(elts.chunkSpan).css("float", "right");
    $(elts.wmpSpan).find("label").css({
	"padding-top" : "auto",
	"padding-bottom" : "1em",
    });
    $(elts.chunkSpan).find("label").css({
	"padding-top" : "auto",
	"padding-bottom" : "1em",
    });
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
    elts.lightbox = document.createElement("div");

    //content
    elts.lightbox.setAttribute("id", "lightbox");
    elts.content = document.createElement("div");
    elts.content.setAttribute("id", "lb-content");
    elts.lightbox.appendChild(elts.content);


    elts.centred = document.createElement("div");
    elts.centred.setAttribute("id", "lb-centred");
    elts.lightbox.appendChild(elts.centred);

    //controls
    elts.controls = document.createElement("div");
    elts.controls.setAttribute("id", "lb-controls-inner");
    elts.ppButton = document.createElement("div");
    elts.ppButton.innerHTML = constants.pauseButton;
    elts.ppButton.setAttribute("id", "lb-pp");

    elts.controlCnt = document.createElement("div");
    elts.controlCnt.setAttribute("id", "lb-controls");

    //wpm slider
    elts.wmpSpan= document.createElement("div");
    elts.wmpSpan.setAttribute("id","wmpSpan");
    elts.wmpLabel = document.createElement("label");
    $(elts.wmpLabel).text("WPM");
    elts.wmpSpan.appendChild(elts.wmpLabel);

    elts.wpmVal = document.createElement("input");
    elts.wpmVal.setAttribute("id","lb-wpm");
    elts.wpmVal.setAttribute("type","range");
    elts.wpmVal.setAttribute("min",100);
    elts.wpmVal.setAttribute("max",2000);
    elts.wpmVal.setAttribute("title", "Words Per Minute");

    $(elts.wpmVal).val(settings.wpm);
    $(elts.wpmVal).change(function(){
        settings.wpm= $(elts.wpmVal).val();
        clearInterval(state.interval);
	updateWpm();
        goRead();
    });
    // Good lord this is spaghetti - take care when reordering
    elts.wmpSpan.appendChild(elts.wpmVal);
    elts.controls.appendChild(elts.wmpSpan);

    //chunk size
    elts.chunkSpan= document.createElement("div");
    elts.chunkSpan.setAttribute("id","chunkSpan");
    elts.chunkLabel = document.createElement("label");
    $(elts.chunkLabel).text("Chunk");

    elts.chunkSizeSlider = document.createElement("input");
    elts.chunkSizeSlider.setAttribute("id","lb-chunks");
    elts.chunkSizeSlider.setAttribute("type","range");
    elts.chunkSizeSlider.setAttribute("min",1);
    elts.chunkSizeSlider.setAttribute("max",5);
    elts.chunkSizeSlider.setAttribute("title", "Chunk Size");
    $(elts.chunkSizeSlider).val(settings.chunkSize);
    $(elts.chunkSizeSlider).change(function(){
        var oldChunkSize = settings.chunkSize;
        settings.chunkSize= $(elts.chunkSizeSlider).val();
        clearInterval(state.interval);
        var newStateIdx= Math.floor((state.idx*oldChunkSize)/settings.chunkSize);
	if (state.running == false) {
	    $('#lb-pp').html(constants.pauseButton);
	}
        speedRead(state.rangeStr, newStateIdx);
    });
    elts.chunkSpan.appendChild(elts.chunkSizeSlider);
    elts.chunkSpan.appendChild(elts.chunkLabel);
    elts.controls.appendChild(elts.chunkSpan);
    elts.controls.appendChild(elts.ppButton);

    // mode
    elts.modeButton = document.createElement("span");
    elts.modeButton.innerHTML = constants.unCentered;
    elts.modeButton.setAttribute("id", "lb-mode");

    elts.modeButton.setAttribute("title", "View Mode");
    elts.lightbox.appendChild(elts.modeButton);
    elts.controlCnt.appendChild(elts.controls);
    elts.lightbox.appendChild(elts.controlCnt);

    // time remaining
    elts.timeRem = document.createElement("span");
    elts.timeRem.setAttribute("id","lb-timeRem");
    updateRemTime();
    elts.lightbox.appendChild(elts.timeRem);

    // WPM display
    elts.wpmDisp = document.createElement("span");
    elts.wpmDisp.setAttribute("id", "lb-wpmdisp");
    updateWpm();
    elts.lightbox.appendChild(elts.wpmDisp);

    // exitButton
    elts.exButton = document.createElement("span");
    elts.exButton.innerHTML = constants.exitButton;
    elts.exButton.setAttribute("title", "Close");
    elts.exButton.setAttribute("id", "lb-exit");
    elts.lightbox.appendChild(elts.exButton);
}

function lightbox () {
    lightboxOverlay();

    lightboxStyle();
    document.body.appendChild(elts.lightbox);

    $('#lb-exit').on("click", function() {
	pauseRead();
	document.body.removeChild(elts.lightbox);
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
