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
        chrome.browsingData.removeCookies({"since": elapse});
    }
}

function messageHandler(message) {
    const cmd = message.cmd;
    const content = message.content;
    var cookieManager = this;
    switch (cmd) {
        case "incognito":
            if (!cookieManager.getIncognitoStatus) {
                cookieManager.cleanSince(cookieManager.getTimer.getStartTime.getTime());
                console.log("background: cookie cleaned!");
            }
            break;
    }

}

function getCookieUrl(cookie) {
    return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
}

function clearBlacklistCookies(data) {
    const urls = data.map(url => url.split(/[#?]/)[0]);
    const uniqueUrls = [...new Set(urls).values()].filter(Boolean);
    Promise.all(
        uniqueUrls.map(url =>
        new Promise(resolve => {
            chrome.cookies.getAll({url}, resolve);
        }))).then(results => {
        // convert the array of arrays into a deduplicated flat array of cookies
        const cookies = [
        ...new Map(
            [].concat(...results)
            .map(c => [JSON.stringify(c), c])
        ).values()
        ];

        // do something with the cookies here
        cookies.forEach(cookie => chrome.cookies.remove({url: getCookieUrl(cookie), name: cookie.name}, function(deletedCookie) {
            console.log("background: Cookie " + getCookieUrl(deletedCookie) + " has been deleted by blacklist.");
        }));
    });
}

chrome.runtime.onInstalled.addListener(function(details) {
    // default configuration
    const startTime = (new Date()).toJSON();
    const endTime = startTime;
    const incognitoStatus = false;
    const defaultConfig = {config: {startTime: startTime, endTime: endTime, isIncognito: incognitoStatus}, blacklist: []};
    // set initial configuration
    chrome.storage.sync.get(defaultConfig, function(result) {
        chrome.storage.sync.set(result);
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // read `newIconPath` from request and read `tab.id` from sender
        chrome.browserAction.setIcon({
            path: request.newIconPath
        });
    });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("background: message received!");
        if (request.domain) {
            const domainAddr = request.domain;
            chrome.storage.sync.get({blacklist: []}, function(res) {
                var blacklist = new Set(res.blacklist);
                if (blacklist.has(domainAddr)) {
                    clearBlacklistCookies(request.data)
                }
            });
        }
        // load configuration and blacklist
        chrome.storage.sync.get(["config"], function(res) {
            var cookieManager = new CookieManager(res.config);
            messageHandler.bind(cookieManager)(request);
        });
    }
);