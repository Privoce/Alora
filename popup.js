class PopupCache {
    constructor(domain, blacklist, config) {
        this.domain = domain;
        this.blacklist = blacklist;
        this.config = config;
    }
}

function iconChange() {
    if(document.getElementById("blacklistBtn").checked || document.getElementById("switch2").checked ) {
        // send message to background script
        chrome.runtime.sendMessage({ "newIconPath" : "images/f248.png" });
    }else{
        chrome.runtime.sendMessage({ "newIconPath" : "images/f148.png" });
    }
}

function reloadPopup() {
    console.log(popupCache);
    var domain = popupCache.domain;
    document.querySelector("#siteurl").innerHTML = domain;
    var btnStatus = popupCache.blacklist.has(domain);
    document.getElementById("blacklistBtn").checked = btnStatus;
    document.getElementById("switch2").checked = popupCache.config.isIncognito;
}

function toggleIncognito() {
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = false;
    saveBtn.innerHTML = "Save Changes";
    console.log("toggle incognito");
    // get latest configuration
    var incognitoStatus = document.getElementById("switch2").checked;
    // update local cache object
    var currTime = (new Date()).toJSON();
    popupCache.config.isIncognito = incognitoStatus;
    if (incognitoStatus) {
        popupCache.config.startTime = currTime;
    }
    popupCache.config.endTime = currTime;
    port.postMessage(generateRequest("incognito"));
}

function toggleBlacklist() {
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = false;
    saveBtn.innerHTML = "Save Changes";
    console.log("toggle blacklist");
    var inBlacklist = document.getElementById("blacklistBtn").checked;
    var domain = popupCache.domain;
    if (inBlacklist) {
        popupCache.blacklist.add(domain);
    } else {
        popupCache.blacklist.delete(domain);
    }
}

function generateRequest(reqType, args) {
    switch(reqType) {
        case "query":
            return {reqType: reqType, keys: args};
        case "update":
            return {reqType: reqType, config: popupCache.config, blacklist: Array.from(popupCache.blacklist)};
        case "incognito":
            return {reqType: reqType, config: popupCache.config};
    }
}

function saveChange() {
    port.postMessage(generateRequest("update"));
    window.close();
}

console.log("popup: extension starts");
// blacklist cache
var popupCache;
var port = chrome.runtime.connect({name: "popup"});
port.postMessage(generateRequest("query", ["config", "blacklist"]));

port.onMessage.addListener(function(msg) {
    if (msg.resType == "query") {
        console.log(msg);
        var blacklist = new Set(msg.values.blacklist);
        var domainName = msg.domainName;
        popupCache = new PopupCache(domainName, blacklist, msg.values.config);
        reloadPopup();
    }
});

// Add event listeners
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("blacklistBtn").addEventListener("change", toggleBlacklist);
    document.querySelector("#switch2").addEventListener("change", toggleIncognito);
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saved";
    saveBtn.addEventListener("click", saveChange);
});