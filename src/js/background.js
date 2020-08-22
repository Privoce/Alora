import baIconOn from '../../public/ba-on.png';
import baIconOff from '../../public/ba-off.png';
import {StorageAPI} from "./StorageAPI";

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
            resolve(tabs[0]);
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

async function clearBlacklistCookies(data) {
    function getCookieUrl(cookie) {
        return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
    }

    const urls = data.map(url => url.split(/[#?]/)[0]);
    const uniqueUrls = [...new Set(urls).values()].filter(Boolean);
    let results = await Promise.all(uniqueUrls.map(url => new Promise(resolve => {
        chrome.cookies.getAll({url}, resolve);
    })));
    // convert the array of arrays into a deduplicated flat array of cookies
    const cookies = [
        ...new Map(
            [].concat(...results)
                .map(c => [JSON.stringify(c), c])
        ).values()
    ];
    // filter out google service cookies
    const blacklistCookies = cookies.filter(cookie => !(/\.google\.(?:co)?(?:com|hk|jp|in|uk)/g).test(cookie.domain));
    await Promise.all(blacklistCookies.map(cookie => new Promise(resolve => {
        chrome.cookies.remove({
            url: getCookieUrl(cookie),
            name: cookie.name
        }, function (deletedCookie) {
            console.log("background: Cookie " + getCookieUrl(deletedCookie) + " has been deleted by blacklist.");
            resolve();
        });
    })));
}

async function clearBlacklistHistory(url) {
    await new Promise(resolve => {
        chrome.history.deleteUrl({url}, resolve);
    });
}

// reload browserAction icon when tabs switch
chrome.tabs.onActivated.addListener(async () => {
    await reloadIcon();
});

// reload browserAction icon when tabs update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        await reloadIcon();
    }
})

// handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // wrap it up so that the outer function is a synchronous function
    (async (message, sender, sendResponse) => {
        if (message.reqType.startsWith("tab")) {
            if (message.reqType === "tabClose") {
                if ((await StorageAPI.getCookieBlacklist()).has(message.domain)) {
                    await clearBlacklistCookies(message.data);
                    await clearBlacklistHistory(message.url);
                }
                sendResponse();
            }
        } else if (message.reqType.startsWith("popup")) {
            let tab = await getActiveTab();
            let url = tab ? tab.url : '';
            let domain = url ? getDomain(url) : '';
            if (message.reqType === "popupQuery") {
                sendResponse(domain ? {
                    enabled: (await StorageAPI.getCookieBlacklist()).has(domain),
                    domain: domain,
                    faviconUrl: "chrome://favicon/size/24@1x/" + url,
                    locked: false
                } : {
                    enabled: false,
                    domain: "",
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
