window.addEventListener("beforeunload", function(event) {
    var data = performance.getEntriesByType("resource").map(e => e.name);
    chrome.runtime.sendMessage({reqType: "tabClose", domain: location.hostname, url: location.href, data: data}, function(response) {});
});