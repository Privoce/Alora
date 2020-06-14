class PopupCache {
    constructor(domain, blacklist, config) {
        this.domain = domain;
        this.blacklist = blacklist;
        this.config = config;
    }
}

function iconChange() {
    if (siteBlocked || document.getElementById("incognito-switch").checked) {
        // send message to background script
        chrome.runtime.sendMessage({"newIconPath": "images/f248.png"});
    } else {
        chrome.runtime.sendMessage({"newIconPath": "images/f148.png"});
    }
}

function reloadPopup() {
    console.log(popupCache);
    let domain = popupCache.domain;
    document.querySelector("#block-site-url").innerHTML = domain;
    siteBlocked = popupCache.blacklist.has(domain);
    setBlockSiteState(siteBlocked, false).then();
    document.getElementById("incognito-switch").checked = popupCache.config.isIncognito;
}

function toggleIncognito() {
    console.log("toggle incognito");
    // get latest configuration
    let incognitoStatus = document.getElementById("incognito-switch").checked;
    // update local cache object
    let currTime = (new Date()).toJSON();
    popupCache.config.isIncognito = incognitoStatus;
    if (incognitoStatus) {
        popupCache.config.startTime = currTime;
    }
    popupCache.config.endTime = currTime;
    port.postMessage(generateRequest("incognito"));

    // auto save
    saveChange();
}

function toggleBlacklist() {
    console.log("toggle blacklist");
    siteBlocked = !siteBlocked;
    let domain = popupCache.domain;
    if (siteBlocked) {
        setBlockSiteState(true, true).then();
        popupCache.blacklist.add(domain);
    } else {
        setBlockSiteState(false, true).then();
        popupCache.blacklist.delete(domain);
    }

    // auto save
    saveChange();
}

function generateRequest(reqType, args) {
    switch (reqType) {
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

    // change icon
    iconChange();
}

async function setBlockSiteState(state, doAnimation) {
    let animationDuration = 300;
    let animationEasing = 'linear';
    if (state) {
        document.getElementById('btn-block-site').innerText = 'unblock site';
        document.getElementById('block-site-hint').innerText = 'Store my browse histories from this site';
        if (doAnimation) {
            await Promise.all([
                $('#large-cookie-1').animate({opacity: '0'}, {duration: animationDuration, easing: animationEasing}).promise(),
                $('#large-cookie-2').animate({opacity: '1'}, {duration: animationDuration, easing: animationEasing}).promise()
            ]);
            await Promise.all([
                $('#large-cookie-2').animate({opacity: '0'}, {duration: animationDuration, easing: animationEasing}).promise(),
                $('#large-cookie-3').animate({opacity: '1'}, {duration: animationDuration, easing: animationEasing}).promise()
            ]);
            await Promise.all([
                $('#large-cookie-3').animate({opacity: '0'}, {duration: animationDuration, easing: animationEasing}).promise(),
                $('#large-cookie-4').animate({opacity: '1'}, {duration: animationDuration, easing: animationEasing}).promise()
            ]);
        } else {
            $('#large-cookie-1').css({opacity: '0'});
            $('#large-cookie-2').css({opacity: '0'});
            $('#large-cookie-3').css({opacity: '0'});
            $('#large-cookie-4').css({opacity: '1'});
        }
    } else {
        document.getElementById('btn-block-site').innerText = 'block site';
        document.getElementById('block-site-hint').innerText = 'Never store my browse histories from this site';
        if (doAnimation) {
            await Promise.all([
                $('#large-cookie-4').animate({opacity: '0'}, {duration: animationDuration, easing: animationEasing}).promise(),
                $('#large-cookie-3').animate({opacity: '1'}, {duration: animationDuration, easing: animationEasing}).promise()
            ]);
            await Promise.all([
                $('#large-cookie-3').animate({opacity: '0'}, {duration: animationDuration, easing: animationEasing}).promise(),
                $('#large-cookie-2').animate({opacity: '1'}, {duration: animationDuration, easing: animationEasing}).promise()
            ]);
            await Promise.all([
                $('#large-cookie-2').animate({opacity: '0'}, {duration: animationDuration, easing: animationEasing}).promise(),
                $('#large-cookie-1').animate({opacity: '1'}, {duration: animationDuration, easing: animationEasing}).promise()
            ]);
        } else {
            $('#large-cookie-1').css({opacity: '1'});
            $('#large-cookie-2').css({opacity: '0'});
            $('#large-cookie-3').css({opacity: '0'});
            $('#large-cookie-4').css({opacity: '0'});
        }
    }
}

console.log("popup: extension starts");
// blacklist cache
let popupCache;
let siteBlocked = false;
let port = chrome.runtime.connect({name: "popup"});
port.postMessage(generateRequest("query", ["config", "blacklist"]));

port.onMessage.addListener(function (msg) {
    if (msg.resType === "query") {
        console.log(msg);
        let blacklist = new Set(msg.values.blacklist);
        let domainName = msg.domainName;
        popupCache = new PopupCache(domainName, blacklist, msg.values.config);
        reloadPopup();
    }
});

// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btn-block-site").addEventListener("click", toggleBlacklist);
    document.querySelector("#incognito-switch").addEventListener("change", toggleIncognito);
    $('img').on('dragstart', () => false);  // make all images not draggable
});
