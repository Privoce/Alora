const destructionEvent = 'destructmyextension_' + chrome.runtime.id;

function destructor() {
    // Destruction is needed only once
    document.removeEventListener(destructionEvent, destructor);
    // Tear down content script: Unbind events, clear timers, restore DOM, etc.
    window.removeEventListener("beforeunload", sendData);
}

function sendData() {
    const data = performance.getEntriesByType('resource').map(e => e.name);
    chrome.runtime.sendMessage({
        src: 'content script',
        action: 'clear cookie and history',
        domain: location.hostname,
        data
    });
}

function main() {
    // Set up content script
    window.addEventListener("beforeunload", sendData);
}

// Unload previous content script if needed
document.dispatchEvent(new CustomEvent(destructionEvent));
document.addEventListener(destructionEvent, destructor);
main();