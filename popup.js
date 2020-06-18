class PopupCache {
    constructor(domain, blacklist, config) {
        this.domain = domain;
        this.blacklist = blacklist;
        this.config = config;
    }
}

function reloadIcon() {
    if(siteBlocked || document.getElementById("incognito-switch").checked ) {
        chrome.browserAction.setIcon({ "path" : "images/f248.png" });
    }else{
        chrome.browserAction.setIcon({ "path" : "images/f148.png" });
    }
}

function reloadPopup() {
    let domain = popupCache.domain;
    document.querySelector("#block-site-url").innerHTML = domain;
    siteBlocked = popupCache.blacklist.has(domain);
    setBlockSiteState(siteBlocked, false).then();
    document.getElementById("incognito-switch").checked = popupCache.config.isIncognito;
}

function toggleIncognito() {
    console.log(popupCache);
    // get latest configuration
    let incognitoStatus = document.getElementById("incognito-switch").checked;
    // update local cache object
    let currTime = (new Date()).toJSON();
    popupCache.config.isIncognito = incognitoStatus;
    if (incognitoStatus) {
        popupCache.config.startTime = currTime;
    }
    popupCache.config.endTime = currTime;
    // auto save
    saveChange("incognito");
}

function toggleBlacklist() {
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
    saveChange("update");
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

function saveChange(reqType) {
    port.postMessage(generateRequest(reqType));
    // change icon
    reloadIcon();
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


port.onMessage.addListener(function handle (msg) {
    if (msg.resType === "query") {
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
