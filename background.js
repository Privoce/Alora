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
                chrome.tabs.query({active: true}, function(tabs) {
                    var currentURL = tabs[0].url;
                    var currentDomain = new URL(currentURL).hostname;
                    port.postMessage(generateResponse(msg.reqType, queryRes, currentDomain));
                });
            });
            break;
        case "update":
            chrome.storage.sync.set({config: msg.config, blacklist: msg.blacklist}, function() {
                console.log("Config and blacklist updated.");
            });
            break;
        case "incognito":
            // start incognito mode
            chrome.storage.sync.set({config: msg.config}, function() {
                if (!msg.config.isIncognito) {
                    cookieManager.cleanSince(cookieManager.getTimer.getStartTime.getTime());
                    console.log("cookie cleaned!");
                }
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
    }
}


chrome.runtime.onInstalled.addListener(function(details) {
    // for dev purpose clear local storage
    new Promise(resolve => {
        chrome.storage.sync.clear(function() {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
            console.log("storage cleaned")
            resolve();
        });
    }).then(() => {
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
});

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        // new cookie manager upon receiving message
        chrome.storage.sync.get("config", function(config) {
            var cookieManager = new CookieManager(config);
            messageHandler.bind(cookieManager)(port, msg);
        });
    });
});

// clean cookies from blacklist websites
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    new Promise(resolve => {
        chrome.storage.sync.get("blacklist", function(res) {
            var blacklist = new Set(res.blacklist);
            resolve(blacklist)
        });
    }).then(blacklist => {
        if (blacklist.has(request.domain)) {
            if (request.reqType == "tabClose") {
                clearBlacklistCookies(request.data, request.url);
            }
        }
    });
});