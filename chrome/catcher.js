chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Handle message.
    if(message==="READ"){
        processSelection();
    }
});
