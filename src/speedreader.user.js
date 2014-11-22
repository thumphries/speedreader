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
  // $(s).css("background", "red");
  var wordArr = s.split(" ");

  var i=0;
  var curWord= wordArr[i];
  var wpm = 400;
  var myVar = setInterval(function(){iterate(wordArr, i); i++;}, getWordTime(wpm, wordArr.length));

  function iterate(wordArr, pos) {
    var old= wordArr[pos];
    wordArr[pos] = "<span style='background:red'>"+old+"</span>";
    $('html').html(wordArr.join(" "));
    wordArr[pos]=old;
    if(curWord==null){
      clearInterval(myVar);
    }

    // var wordArr= ssplit(" ");
    // if(wordArr.length !=0){
    //   var i=0;
    //   var curWord= wordArr[i];
    //
    //   while(curWord!=null){
    //     alert(curWord);
    //     curWord= wordArr[i++];
    //   }
    //   clearInterval(myVar);
    // }
  }
  function getWordTime(wpm, numWords){
    // alert(60000/numWords);
    return 60000/numWords;
  }
}
