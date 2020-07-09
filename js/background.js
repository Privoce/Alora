class Timer {
    #start;
    #end;

    constructor(start, end) {
        this.#start = start;
        this.#end = end;
    }

    get getStartTime() {
        return this.#start;
    }

    get getEndTime() {
        return this.#end;
    }

    elapse() {
        const elapse = this.getEndTime - this.getStartTime;
        console.log(elapse);
        return elapse;
    }

    reset() {
        this.#start = new Date();
    }
}

class CookieManager {
    #timer;
    #isIncognito;
    
    constructor(config) {
        this.#timer = new Timer(new Date(config.startTime), new Date(config.endTime));
        this.#isIncognito = config.isIncognito;
    }

    get getTimer() {
        return this.#timer;
    }

    get getIncognitoStatus() {
        return this.#isIncognito;
    }

    cleanSince(elapse = 0) {
        // chrome.browsingData.removeCookies({"since": elapse});
        // chrome.browsingData.removeHistory({"since": elapse});
        chrome.browsingData.remove({
            "since": elapse
          }, {
            "appcache": true,
            "cache": true,
            "cacheStorage": true,
            "cookies": true,
            "downloads": true,
            "fileSystems": true,
            "formData": true,
            "history": true,
            "indexedDB": true,
            "localStorage": true,
            "pluginData": true,
            "passwords": true,
            "serviceWorkers": true,
            "webSQL": true
          });
    }
}

function messageHandler(port, msg) {
    var cookieManager = msg.config ? (new CookieManager(msg.config)) : this;
    switch (msg.reqType) {
        case "query":
            new Promise(resolve => {
                chrome.storage.sync.get(msg.keys, function(queryRes) {
                    resolve(queryRes);
                })
            }).then(queryRes => {
                chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
                    var currentURL = tabs[0].url;
                    var currentDomain = new URL(currentURL).hostname;
                    port.postMessage(generateResponse(msg.reqType, queryRes, currentDomain));
                });
            });
            break;
        case "update":
            chrome.storage.sync.set({config: msg.config, blacklist: msg.blacklist}, function() {
                console.log("Config and blacklist updated.");
                port.postMessage(generateResponse(msg.reqType, "success"));
            });
            break;
    }
}

function getCookieUrl(cookie) {
    return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
}

function clearBlacklistCookies(data, urlVisited) {
    chrome.history.deleteUrl({url: urlVisited});
    const urls = data.map(url => url.split(/[#?]/)[0]);
    const uniqueUrls = [...new Set(urls).values()].filter(Boolean);
    Promise.all(uniqueUrls.map(url => new Promise(resolve => {
        chrome.cookies.getAll({url}, resolve);
    }))).then(results => {
        // convert the array of arrays into a deduplicated flat array of cookies
        const cookies = [
            ...new Map(
                [].concat(...results)
                .map(c => [JSON.stringify(c), c])
            ).values()
        ];
        // filter out google service cookies
        const blacklistCookies = cookies.filter(cookie => !(/\.google\.(?:co)?(?:com|hk|jp|in|uk)/g).test(cookie.domain));
        blacklistCookies.forEach(cookie => chrome.cookies.remove({url: getCookieUrl(cookie), name: cookie.name}, function(deletedCookie) {
            console.log("background: Cookie " + getCookieUrl(deletedCookie) + " has been deleted by blacklist.");
        }));
    });
}

function generateResponse(resType, data, domainName) {
    switch (resType) {
        case "query":
            return {resType: resType, values: data, domainName: domainName};
        case "update":
            return {resType: resType, values: data};
    }
}

function reloadIcon(status) {
    if (status.isBlacklisted) {
        chrome.browserAction.setIcon({ "path" : "images/ba-on.png" });
    } else {
        chrome.browserAction.setIcon({ "path" : "images/ba-off.png" });
    }
}

chrome.runtime.onInstalled.addListener(function(details) {
	// default configuration
	const startTime = (new Date()).toJSON();
	const endTime = startTime;
	const incognitoStatus = false;
	const defaultConfig = {"config": {"startTime": startTime, "endTime": endTime, "isIncognito": incognitoStatus}, 
							"blacklist": []};
	// set initial configuration
	chrome.storage.sync.get(defaultConfig, function(result) {
		chrome.storage.sync.set(result, () => console.log("default value set"));
	});
});

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        // new cookie manager upon receiving message
        chrome.storage.sync.get("config", function(config) {
            const cookieManager = new CookieManager(config);
            messageHandler.bind(cookieManager)(port, msg);
        });
    });
});

// handle message from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    new Promise(resolve => {
        chrome.storage.sync.get(["blacklist", "config"], function(res) {
            const blacklist = new Set(res.blacklist);
            const incognitoStatus = res.config.isIncognito;
            resolve({blacklist: blacklist, isIncognito: incognitoStatus});
        });
    }).then(data => {
        const isBlacklisted = data.blacklist.has(request.domain);
        // reload icon when new tab open
        switch(request.reqType) {
            case "tabOpen":
                reloadIcon({isBlacklisted: isBlacklisted, isIncognito: data.isIncognito});
                break;
            case "tabClose":
                if (isBlacklisted) {
                    clearBlacklistCookies(request.data, request.url);
                }
                break;
        }
    });
});

// reload icon when switch between tabs
chrome.tabs.onActivated.addListener(function(activeInfo) {
    new Promise(resolve => {
        chrome.storage.sync.get(["blacklist", "config"], function(res) {
            const blacklist = new Set(res.blacklist);
            const incognitoStatus = res.config.isIncognito;
            resolve({blacklist: blacklist, isIncognito: incognitoStatus});
        });
    }).then(data => {
        chrome.tabs.get(activeInfo.tabId, function(tab) {
            let status;
            if (tab.url) {
                const currentURL = tab.url;
                const currentDomain = new URL(currentURL).hostname;
                status = {isBlacklisted: data.blacklist.has(currentDomain), isIncognito: data.isIncognito};
            } else {
                status = {isBlacklisted: false, isIncognito: data.isIncognito};
            }
            reloadIcon(status);
        })
    });
});