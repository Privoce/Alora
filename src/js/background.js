import baIconOn from '../assets/images/ba-on.png';
import baIconOff from '../assets/images/ba-off.png';
import {StorageAPI} from "./StorageAPI";
import {CookieAPI} from "./CookieAPI";

function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

async function getActiveTab() {
    return await new Promise(resolve => {
        chrome.tabs.query({currentWindow: true, active: true}, tabs => {
            resolve(tabs[0])
        });
    });
}

async function reloadIcon() {
    let tab = await getActiveTab();
    let domain = tab ? getDomain(tab.url) : '';
    let status = (await StorageAPI.getCookieBlacklist()).has(domain);
    await new Promise(resolve => {
        chrome.browserAction.setIcon({path: status ? baIconOn : baIconOff}, resolve);
    });
}

// reload browserAction icon when switch between tabs or update tabs
chrome.tabs.onActivated.addListener(async () => {
    await reloadIcon();
});

chrome.tabs.onUpdated.addListener(async () => {
    await reloadIcon();
})

// handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // wrap it up so that the outer function is a synchronous function
    (async (message, sender, sendResponse) => {
        if (message.reqType.startsWith("tab")) {

            if (message.reqType === "tabClose") {

                if ((await StorageAPI.getCookieBlacklist()).has(message.domain)) {
                    await CookieAPI.clearBlacklistCookies(message.data);
                    await CookieAPI.clearBlacklistHistory(message.url);
                }
                sendResponse();

            }

        } else if (message.reqType.startsWith("popup")) {

            let tab = await getActiveTab();
            let url = tab ? tab.url : '';
            let domain = url ? getDomain(url) : '';

            if (message.reqType === "popupQuery") {

                console.log(await StorageAPI.getCookieBlacklist());
                sendResponse(domain ? {
                    enabled: (await StorageAPI.getCookieBlacklist()).has(domain),
                    domain: domain,
                    faviconUrl: "chrome://favicon/size/24@1x/" + url,
                    locked: false
                } : {
                    enabled: false,
                    domain: "?",
                    faviconUrl: "chrome://favicon/size/24@1x/",
                    locked: true
                });

            } else if (message.reqType === "popupEnable") {

                await StorageAPI.addCookieBlacklist(domain);
                await reloadIcon();
                sendResponse();

            } else if (message.reqType === "popupDisable") {

                await StorageAPI.deleteCookieBlacklist(domain);
                await reloadIcon();
                sendResponse();

            }
        }
    })(message, sender, sendResponse);
    // return true to keep tunnel open until sendResponse() is called
    return true;
});
