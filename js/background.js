function getThorCookie(cb) {
    chrome.tabs.getSelected(null, function(tab) {
        url = tab.url;
        chrome.cookies.get({ url: url, name: "thor" }, function(cookie) {
            console.log(cookie);
            cb(cookie)
        })
    })
}

function sendData(data){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, data, function(response) {
            //chrome.runtime.sendMessage(response);
        });  
    })
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message === "getThorCookie") {
        getThorCookie(function(cookie) {
            sendResponse(cookie)
        })
        return true;
    }
})
