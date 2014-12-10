var constants= {
    msInSec: 60000,
    engAvgWordLen: 5.1,
    pauseButton: '\u275A \u275A',
    playButton: '\u25B6',
    repeatButton: '\u27f2',
    unCentered: '\u2261',
    centered: '\u2012',
    exitButton: '\u00d7',
    fontfamSerif: "Georgia, serif",
    fontfamSansSerif: "arial, sans-serif",
};

var settings = {
    wpm: 400,
    chunkSize: 2,
    centred: true,
    highlight: "#FFF",
    lowlight: "#151515",
    buttonColor: "#DDD",
    buttonHover: "#FFF",
    panelColor: "#151515",
    font: constants.fontfamSansSerif,
};

var state = {
    running: false,
    interval: {},
    wordArr: [],
    spans: [],
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

    lightbox();

    $(elts.ppButton).html(constants.pauseButton);
    speedRead(range.toString(), 0);
    goRead();
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
    $(elts.lightbox).show();

    state.wordArr = initWordArr(s);

    spanIt(elts.content);
    state.idx = startIdx;
}

function spanIt (div) {
    // Delete all existing spans first
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }

    var i = 0;
    while (state.wordArr[i] != null) {
	var span = document.createElement("span");
	span.innerHTML = state.wordArr[i];
	state.spans[i] = span;
	div.appendChild(span);
	i++;
    }
}

function goRead () {
    $(elts.ppButton).html(constants.pauseButton);
    elts.ppButton.setAttribute("title", "Pause playback");

    updateWpm();
    if (settings.centred) {
	$(elts.content).hide();
        $(elts.centred).show();
    } else {
        $(elts.centred).hide();
        $(elts.content).show();
    }

    var nodes = elts.content.childNodes;
    var i = 0;
    for (i = 0; i < nodes.length; i++) {
        $(nodes[i]).css("color", settings.lowlight);
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

        updateRemTime();
    	if (old==null){
            clearInterval(state.interval);
    	    state.interval = {};

    	    // We want justified style on halt - swap to block mode
            $(elts.centred).hide();
    	    $(elts.content).show();

	    var nodes = elts.content.childNodes;
	    var i = 0;
            for (i = 0; i < nodes.length; i++) {
                $(nodes[i]).css("color", settings.highlight);
	    }

    	    state.running = false;

    	    // Reset idx and scroll
    	    $(elts.ppButton).html(constants.repeatButton);
    	    state.idx = 0;
        } else {
            if (!settings.centred) {
		$(state.spans[pos]).css("color", settings.highlight);
		$(state.spans[pos-1]).css("color", settings.lowlight);
            } else {
                $(elts.centred).html(wordArr[pos]);
	    }

	    var cw = $(state.spans[pos]);
	    var pos = cw.position();
            if (!cw || pos === undefined ||
	        (cw && pos !== undefined && pos.top == 0)) {
                $(elts.content).scrollTop(0);
	    } else {
                var top = pos.top;
       	        var scroll = $(elts.content).scrollTop();
      	        if (top < 0) {
                    $(elts.content).scrollTop(scroll + top);
      	        }
      	        if (top >= 300) {
                    $(elts.content).scrollTop(scroll + 230);
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
    $(elts.ppButton).html(constants.playButton);
    elts.ppButton.setAttribute("title", "Resume playback");
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
        } else if (e.which == 27) { // esc
            exit();
	}
    };
};

function lightboxStyle() {
    $(elts.lightbox).css({
        "position"        : "fixed",
	"top"             : "0",
	"left"            : "0",
	"width"           : "100%",
	"height"          : "100%",
	"background-color": "black",
	"overflow"        : "hidden",
	"z-index"         : "2147483647", // 32-bit signed max
	"display"         : "none",
	"font-family"     : constants.fontfamSansSerif,
	"font-size"       : "0.8em",
    });
    var contentStyle = {
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
	"font-family"  : settings.font,
    };
    $(elts.content).css(contentStyle);
    $(elts.content).css("color", settings.lowlight);
    $(elts.centred).css(contentStyle);
    $(elts.centred).css("color", settings.highlight);

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
	"word-break"     : "keep-all",
    });
    $(elts.ppButton).hover(
        function () { $(elts.ppButton).css("color", settings.buttonHover); },
	function () { $(elts.ppButton).css("color", settings.buttonColor); }
    );

    $(elts.modeButton).css({
        "color"     : settings.buttonColor,
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
	"bottom"       : "3em",
	"width"        : "50%",
	"max-height"   : "50%",
	"margin-left"  : "25%",
	"margin-right" : "25%",
    });

    $(elts.controls).css({
        "width"        : "100%",
	"margin-left"  : "auto",
	"margin-right" : "auto",
	"background-color" : settings.panelColor,
	"border-radius": "0.5em",
	"overflow"     : "hidden",
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
	"float"          : "left",
	"max-width"      : "15%",
    });
    $(elts.wpmVal).css("max-width", "70%");
    $(elts.chunkSizeSlider).css("max-width", "70%");
    $(elts.chunkSpan).find("label").css({
	"padding-top" : "auto",
	"padding-bottom" : "1em",
	"float"          : "right",
	"max-width"      : "50%",
    });
}

function updateRemTime(){
    var remIndexes= (state.wordArr.length-(state.idx));
    var remTime= getWordTime()*settings.chunkSize*remIndexes;
    min = Math.floor((remTime/1000/60) << 0);
    //sec = Math.floor((remTime/1000) % 60);
    var remTimeStr = min + "m";
    $(elts.timeRem).html(remTimeStr);
}

function updateWpm() {
    $(elts.wpmDisp).html(settings.wpm + "WPM/" + settings.chunkSize);
}

function lightboxOverlay() {
    elts.lightbox = document.createElement("div");

    //content
    elts.content = document.createElement("div");
    elts.lightbox.appendChild(elts.content);


    elts.centred = document.createElement("div");
    elts.lightbox.appendChild(elts.centred);

    //controls
    elts.controls = document.createElement("div");
    elts.ppButton = document.createElement("div");
    elts.ppButton.innerHTML = constants.pauseButton;
    elts.ppButton.setAttribute("title", "Pause playback");

    elts.controlCnt = document.createElement("div");

    //wpm slider
    elts.wmpSpan= document.createElement("div");
    elts.wmpLabel = document.createElement("label");
    $(elts.wmpLabel).text("WPM");
    elts.wmpSpan.appendChild(elts.wmpLabel);

    elts.wpmVal = document.createElement("input");
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
    elts.chunkLabel = document.createElement("label");
    $(elts.chunkLabel).text("Chunk");

    elts.chunkSizeSlider = document.createElement("input");
    elts.chunkSizeSlider.setAttribute("type","range");
    elts.chunkSizeSlider.setAttribute("min",1);
    elts.chunkSizeSlider.setAttribute("max",5);
    elts.chunkSizeSlider.setAttribute("title", "Chunk Size");
    $(elts.chunkSizeSlider).val(settings.chunkSize);
    $(elts.chunkSizeSlider).change(function(){
        var oldChunkSize = settings.chunkSize;
	clearInterval(state.interval);
        settings.chunkSize= $(elts.chunkSizeSlider).val();
        var newStateIdx= Math.floor((state.idx*oldChunkSize)/settings.chunkSize);
        speedRead(state.rangeStr, newStateIdx);
	if (state.running) goRead();
    });
    elts.chunkSpan.appendChild(elts.chunkSizeSlider);
    elts.chunkSpan.appendChild(elts.chunkLabel);
    elts.controls.appendChild(elts.chunkSpan);
    elts.controls.appendChild(elts.ppButton);

    // mode
    elts.modeButton = document.createElement("span");
    elts.modeButton.innerHTML = constants.unCentered;

    elts.modeButton.setAttribute("title", "View Mode");
    elts.lightbox.appendChild(elts.modeButton);
    elts.controlCnt.appendChild(elts.controls);
    elts.lightbox.appendChild(elts.controlCnt);

    // time remaining
    elts.timeRem = document.createElement("span");
    updateRemTime();
    elts.lightbox.appendChild(elts.timeRem);

    // WPM display
    elts.wpmDisp = document.createElement("span");
    updateWpm();
    elts.lightbox.appendChild(elts.wpmDisp);

    // exitButton
    elts.exButton = document.createElement("span");
    elts.exButton.innerHTML = constants.exitButton;
    elts.exButton.setAttribute("title", "Close");
    elts.lightbox.appendChild(elts.exButton);
}

function exit () {
    pauseRead();
    document.body.removeChild(elts.lightbox);
    // TODO: Might need to re-add keybinds to avoid GC
}

function changeMode () {
    if(settings.centred) {
        $(elts.centred).hide();
        $(elts.content).show();
        settings.centred = false;
        $(elts.modeButton).html(constants.unCentered);
    } else {
        $(elts.content).hide();
        $(elts.centred).show();
        settings.centred = true;
        $(elts.modeButton).html(constants.centered);
	// We need to make sure all highlighted words are reverted
	// ... this should cover all possible callback orderings
        $(state.spans[state.idx]).css("color", settings.lowlight);
        $(state.spans[state.idx-1]).css("color", settings.lowlight);
    }
}

function lightbox () {
    lightboxOverlay();

    lightboxStyle();
    document.body.appendChild(elts.lightbox);

    $(elts.exButton).on("click", exit);

    var pp = function() { state.running ? pauseRead() : goRead() };

    $(elts.ppButton).on("click", pp);
    $(elts.content).on("click", pp);
    $(elts.centred).on("click", pp);
    $(elts.modeButton).on("click", changeMode);
}
