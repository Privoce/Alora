function sendData(event) {
    const data = performance.getEntriesByType("resource").map(e => e.name);
    chrome.runtime.sendMessage({reqType: "tabClose", domain: location.hostname, url: location.href, data: data});
}

// Content script
function main() {
    // Set up content script
    // chrome.runtime.sendMessage({reqType: "tabOpen"});
    window.addEventListener("beforeunload", sendData);
}

const destructionEvent = 'destructmyextension_' + chrome.runtime.id;

function destructor() {
    // Destruction is needed only once
    document.removeEventListener(destructionEvent, destructor);
    // Tear down content script: Unbind events, clear timers, restore DOM, etc.
    window.removeEventListener("beforeunload", sendData);
}

// Unload previous content script if needed
document.dispatchEvent(new CustomEvent(destructionEvent));
document.addEventListener(destructionEvent, destructor);
main();