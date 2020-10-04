import {getRuleFromUrl, prettyPrint} from './utils';
import {observable, toJS} from 'mobx';

const moduleName = '📚 Tab Profile';

export class TabProfileManager {
    // must be observable so that browserAction update can auto run
    static cache = observable({});
    // tracker active tab in each window
    static allActiveTabIds = observable({});
    static currentActiveTabId = chrome.tabs.TAB_ID_NONE;

    static initiate() {
        // first run initialization
        chrome.windows.getAll(windows => {
            windows.forEach(window => {
                this.updateWindowId(window.id).then();
            });
            prettyPrint(0, moduleName, 'Initiated module', {
                windowIds: windows.map(window => window.id)
            });
        });

        // listening for window create
        chrome.windows.onCreated.addListener(window => {
            prettyPrint(0, moduleName, 'Window created', {
                windowId: window.id,
                win2tab: toJS(this.allActiveTabIds)
            });
            this.updateWindowId(window.id).then();
        });
        // listening for window switch
        chrome.windows.onFocusChanged.addListener(windowId => {
            prettyPrint(0, moduleName, 'Window focused', {
                windowId,
                win2tab: toJS(this.allActiveTabIds)
            });
            this.updateWindowId(windowId).then();
        });
        // listening for window remove
        chrome.windows.onRemoved.addListener(windowId => {
            delete this.allActiveTabIds[windowId];
            prettyPrint(2, moduleName, 'Window removed', {
                windowId: windowId,
                win2tab: toJS(this.allActiveTabIds)
            });
        });
        // listening for tab switch
        chrome.tabs.onActivated.addListener(activeInfo => {
            prettyPrint(0, moduleName, 'Tab focused', {
                windowId: activeInfo.windowId,
                tabId: activeInfo.tabId
            });
            this.updateActiveTabId(activeInfo.windowId, activeInfo.tabId);
        });
        // listening for tab onCreated is not necessary as it is always followed by onUpdated
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.url) {
                // should ignore parameter change
                if (!this.cache[tabId] || this.diffIgnoreParams(this.cache[tabId].url, changeInfo.url)) {
                    // previous profile doesn't exist, or URL non-param part changed
                    // create new tab, or jump to a new url
                    this.createProfile(tabId, changeInfo.url);
                    prettyPrint(0, moduleName, 'URL non-param change', {
                        tabId,
                        url: changeInfo.url
                    });
                } else {
                    // previous profile exists, and URL non-param part unchanged
                    prettyPrint(0, moduleName, 'URL param change', {
                        tabId,
                        url: changeInfo.url
                    });
                }
            }
        });
        chrome.tabs.onRemoved.addListener(tabId => {
            delete this.cache[tabId];
            prettyPrint(2, moduleName, 'Tab removed', {
                tabId,
                win2tab: toJS(this.allActiveTabIds)
            });
        });
        // listen message from content script for page refreshing event
        chrome.runtime.onMessage.addListener((message, sender) => {
            if (message.src === 'content script' && message.action === 'page unloading') {
                if (this.cache[sender.tab.id]) {
                    this.cache[sender.tab.id].abpBlockedRequests = {};
                    prettyPrint(1, moduleName, 'Content unload', {
                        tabId: sender.tab.id
                    });
                }
            }
        });
    }

    static ensureTabProfile(tabId) {
        // mid-way reload can cause loss of all tab profiles, check if profile exists
        if (!this.cache[tabId]) {
            chrome.tabs.get(tabId, tab => {
                this.createProfile(tabId, tab.url);
                prettyPrint(1, moduleName, 'Missing tab', {
                    tabId
                });
            });
        }
    }

    static updateActiveTabId(windowId, tabId) {
        // update active tab id of specific window
        this.allActiveTabIds[windowId] = tabId;
        prettyPrint(0, moduleName, 'Change active tab', {
            windowId,
            tabId,
            win2tab: toJS(this.allActiveTabIds)
        });
        // check if tab profile exists
        this.ensureTabProfile(tabId);
        // update current active tab id
        this.currentActiveTabId = tabId;
    }

    static async updateWindowId(windowId) {
        // when all chrome windows lose focus, window id is -1
        // ignore -1 to avoid problems
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            prettyPrint(1, moduleName, 'All windows lose focus', {
                win2tab: toJS(this.allActiveTabIds)
            });
            return;
        }
        // check if this window id exists in window2tab map
        // if not, query the active tab id of this window
        if (!this.allActiveTabIds[windowId]) {
            await new Promise(resolve => {
                chrome.windows.get(windowId, {
                    populate: true
                }, window => {
                    this.allActiveTabIds[windowId] = (window.tabs.filter(tab => tab.active)[0] || {}).id || chrome.tabs.TAB_ID_NONE;
                    prettyPrint(0, moduleName, 'Missing window', {
                        windowId,
                        activeTabId: this.allActiveTabIds[windowId],
                        win2tab: toJS(this.allActiveTabIds)
                    });
                    resolve();
                });
            });
        }
        // check if tab profile exists
        if (this.allActiveTabIds[windowId] !== chrome.tabs.TAB_ID_NONE) {
            this.ensureTabProfile(this.allActiveTabIds[windowId]);
        }
    }

    static diffIgnoreParams(url1, url2) {
        url1 = url1
            .split(/\//)
            .slice(0,3) // only take protocol and domain into consideration
            .map(i => i.replace(/[?#](.*)$/, ''))
            .filter(i => i.match(/[=&;]/) === null)
            .join('/');
        url2 = url2
            .split(/\//)
            .slice(0,3) // only take protocol and domain into consideration
            .map(i => i.replace(/[?#](.*)$/, ''))
            .filter(i => i.match(/[=&;]/) === null)
            .join('/');
        return url1 !== url2;
    }

    static createProfile(tabId, url) {
        this.cache[tabId] = {
            url,
            abpBlockedRequests: {}
        };
    }

    static getUrl(tabId) {
        if (this.cache[tabId]) {
            return this.cache[tabId].url;
        } else {
            return '';
        }
    }

    static getAbpBlockedRequests(tabId) {
        if (this.cache[tabId]) {
            return this.cache[tabId].abpBlockedRequests;
        } else {
            return {};
        }
    }

    static addAbpBlockedRequest(tabId, category, requestUrl, userAllowed) {
        if (this.cache[tabId]) {
            if (!this.cache[tabId].abpBlockedRequests[category]) {
                this.cache[tabId].abpBlockedRequests[category] = [{
                    rule: getRuleFromUrl(requestUrl),
                    userAllowed: userAllowed
                }];
            } else {
                if (!this.cache[tabId].abpBlockedRequests[category]
                    .map(i => i.rule)
                    .includes(getRuleFromUrl(requestUrl))
                ) {
                    this.cache[tabId].abpBlockedRequests[category].push({
                        rule: getRuleFromUrl(requestUrl),
                        userAllowed: userAllowed
                    });
                }
            }
        }
    }

    static getBlockedTrackerCount(tabId, forceAllowedAll) {
        if (this.cache[tabId]) {
            if (forceAllowedAll) {
                return 0;
            } else {
                let result = 0;
                for (let category in this.cache[tabId].abpBlockedRequests) {
                    result += this.cache[tabId].abpBlockedRequests[category]
                        .filter(request => !request.userAllowed)
                        .length;
                }
                return result;
            }
        } else {
            return 0;
        }
    }
}