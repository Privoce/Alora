class PopupCache {
    constructor(domain, blacklist, config) {
        this.domain = domain;
        this.blacklist = blacklist;
        this.config = config;
    }
}

function reloadPopup() {
    // display different user language
    document.querySelector("#text-1").innerHTML = chrome.i18n.getMessage("popup_block");
    document.querySelector("#text-3").innerHTML = chrome.i18n.getMessage("popup_explanation");
    let domain = popupCache.domain;
    document.querySelector("#block-site-url").innerHTML = domain;
    siteBlocked = popupCache.blacklist.has(domain);
    if (siteBlocked !== switchChecked) {
        $('#block-switch').checkbox(siteBlocked ? 'set checked' : 'set unchecked');
        switchChecked = siteBlocked;
    }
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        let currTab = tabs[0];
        if (currTab) {
            document.getElementById('favicon-img').src = "chrome://favicon/" + currTab.url;
        }
    });
}

function generateRequest(reqType, args) {
    switch (reqType) {
        case "query":
            return {reqType: reqType, keys: args};
        case "update":
            return {reqType: reqType, config: popupCache.config, blacklist: Array.from(popupCache.blacklist)};
    }
}

function saveChange(reqType) {
    port.postMessage(generateRequest(reqType));
}

// blacklist cache
let popupCache;
let siteBlocked = false;
let switchChecked = false;
let port = chrome.runtime.connect({name: "popup"});

port.onMessage.addListener(function handle(msg) {
    if (msg.resType === "query") {
        let blacklist = new Set(msg.values.blacklist);
        let domainName = msg.domainName;
        popupCache = new PopupCache(domainName, blacklist, msg.values.config);
        reloadPopup();
    }
});

// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
    // make all images not draggable
    $('img').on('dragstart', () => false);

    // register switch events
    $('#block-switch').checkbox().first().checkbox({
        onChecked: () => {
            let domain = popupCache.domain;
            popupCache.blacklist.add(domain);
            saveChange("update");
            chrome.browserAction.setIcon({"path": "images/ba-on.png"});
        },
        onUnchecked: () => {
            let domain = popupCache.domain;
            popupCache.blacklist.delete(domain);
            saveChange("update");
            chrome.browserAction.setIcon({"path": "images/ba-off.png"});
        }
    });
    port.postMessage(generateRequest("query", ["config", "blacklist"]));
});
