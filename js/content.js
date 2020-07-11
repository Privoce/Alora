var reconnectToBackground = function() {
    setTimeout(connectToBackground, 1000);
}

var connectToBackground = function() {
    chrome.runtime.sendMessage({reqType: "tabOpen", domain: location.hostname});

    window.addEventListener("beforeunload", function(event) {
        const data = performance.getEntriesByType("resource").map(e => e.name);
        chrome.runtime.sendMessage({reqType: "tabClose", domain: location.hostname, url: location.href, data: data});
    });
}

connectToBackground();