import {observable, toJS} from 'mobx';

import {prettyPrint} from './utils';

const moduleName = '📚 Tab Profile';

export class TabProfileManager {
    // make it observable, so external logics can monitor changes in userAllowedTrackerCount
    static cache = observable({});

    // track current active tab id
    static activeTabId = observable.box(Number(chrome.tabs.TAB_ID_NONE));

    static get currentTabId() {
        return this.activeTabId.get();
    }

    static initiate() {
        // by default no event listener will be called on startup
        // collect current tab info manually
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            if (tabs && tabs[0]) {
                this.activeTabId.set(tabs[0].id);
                this.createProfile(tabs[0].id, tabs[0].url);
                prettyPrint(0, moduleName, 'Module initialized, profile created', {
                    tabId: tabs[0].id,
                    url: tabs[0].url
                });
            }
        });
        // onCreated is not necessary as it is always followed by onUpdated
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.url) {
                // create new tab, or jump to a new url
                this.createProfile(tabId, changeInfo.url);
                prettyPrint(0, moduleName, 'Tab URL updated, profile created or overwritten', {
                    tabId,
                    url: changeInfo.url
                });
            } else if (changeInfo.status === 'loading') {
                // changeInfo does not have url property
                // refresh page
                // clear statistical data
                this.cache[tabId].abpBlockedRequests = {};
                prettyPrint(0, moduleName, 'Tab refreshed, clear requests data', {
                    tabId,
                });
            }
        });
        chrome.tabs.onActivated.addListener(activeInfo => {
            // update active tab id
            this.activeTabId.set(activeInfo.tabId);
            // mid-way reload can cause loss of all tab profiles, check profile when onActivated
            if (!this.cache.hasOwnProperty(activeInfo.tabId)) {
                chrome.tabs.get(activeInfo.tabId, tab => {
                    this.createProfile(activeInfo.tabId, tab.url);
                    prettyPrint(0, moduleName, 'Untracked tab found, profile created', {
                        tabId: activeInfo.tabId,
                        url: tab.url
                    });
                });
            }
        });
        chrome.tabs.onRemoved.addListener(tabId => {
            delete this.cache[tabId];
            prettyPrint(2, moduleName, 'Tab removed, profile removed', {
                tabId
            });
        });
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
            return toJS(this.cache[tabId].abpBlockedRequests);
        } else {
            return {};
        }
    }

    static addAbpBlockedRequest(tabId, abpRuleName, requestUrl, userAllowed) {
        if (this.cache[tabId]) {
            if (!this.cache[tabId].abpBlockedRequests[abpRuleName]) {
                this.cache[tabId].abpBlockedRequests[abpRuleName] = [{
                    url: requestUrl,
                    userAllowed: userAllowed
                }];
            } else {
                this.cache[tabId].abpBlockedRequests[abpRuleName].push({
                    url: requestUrl,
                    userAllowed: userAllowed
                });
            }
        }
    }

    static getUserAllowedTrackerCount(tabId, forceAllowedAll) {
        if (this.cache[tabId]) {
            let result = 0;
            for (let ruleName in this.cache[tabId].abpBlockedRequests) {
                result += this.cache[tabId].abpBlockedRequests[ruleName]
                    .filter(request => request.userAllowed || forceAllowedAll)
                    .length;
            }
            return result;
        } else {
            return 0;
        }
    }
}