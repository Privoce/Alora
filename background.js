// chrome.cookies.onChanged.addListener(function(info) {
//     console.log("onChanged" + JSON.stringify(info));
// });

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

    // loadConfig() {
    //     // load cookie manager configuration
    //     chrome.storage.sync.get({time: new Date(), isIncognito: false}, function(config) {
    //         this.setTimer = config.time;
    //         this.setIncognitoStatus = config.isIncognito;
    //     });
    // }
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



chrome.runtime.onInstalled.addListener(function(details) {
    // default configuration
    const startTime = (new Date()).toJSON();
    const endTime = startTime;
    const incognitoStatus = false;
    const defaultConfig = {config: {startTime: startTime, endTime: endTime, isIncognito: incognitoStatus}};
    // set initial configuration
    chrome.storage.sync.get(defaultConfig, function(result) {
        chrome.storage.sync.set(result.config);
    });
    // chrome.storage.sync.set({config: {startTime: startTime, endTime: endTime, isIncognito: incognitoStatus}}, function() {
    //     console.log("background: initial configuration saved.");
    // });
});



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("background: message received!");
        // read and load configuration
        chrome.storage.sync.get(["config"], function(res) {
            console.log(new Date(res.config.startTime));
            console.log(new Date(res.config.endTime));
            var cookieManager = new CookieManager(res.config);
            messageHandler.bind(cookieManager)(request);
        });
        // load latest cookieManager
    }
);