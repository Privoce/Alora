import {autorun, observable, toJS} from 'mobx';

import {prettyPrint, getRuleFromUrl} from "./utils";

const moduleName = '🔧 Config';

export class ConfigManager {
    static cache = observable({
        cookieBlacklist: [],
        trackerMasterSwitch: false,
        trackerWhitelist: [],
        trackerAllowedList: {}
    });

    static async initiate() {
        const storage = await new Promise(resolve => {
            chrome.storage.local.get(
                ['cookieBlacklist', 'trackerMasterSwitch', 'trackerWhitelist', 'trackerAllowedList'],
                items => {
                    resolve(items);
                }
            );
        });
        this.cache.cookieBlacklist = storage.cookieBlacklist || [];
        this.cache.trackerMasterSwitch = storage.trackerMasterSwitch !== undefined ? storage.trackerMasterSwitch : true;
        this.cache.trackerWhitelist = storage.trackerWhitelist || [];
        this.cache.trackerAllowedList = storage.trackerAllowedList || {};
        autorun(() => {
            chrome.storage.local.set({
                cookieBlacklist: toJS(this.cache.cookieBlacklist)
            }, () => {
                prettyPrint(3, moduleName, '(autorun) Cookie blacklist saved', {
                    cookieBlacklist: toJS(this.cache.cookieBlacklist)
                });
            });
        }, {delay: 1000});
        autorun(() => {
            console.log()
            chrome.storage.local.set({
                trackerMasterSwitch: this.cache.trackerMasterSwitch
            }, () => {
                prettyPrint(3, moduleName, '(autorun) Tracker master switch saved', {
                    trackerMasterSwitch: this.cache.trackerMasterSwitch
                });
            });
        }, {delay: 1000});
        autorun(() => {
            chrome.storage.local.set({
                trackerWhitelist: toJS(this.cache.trackerWhitelist)
            }, () => {
                prettyPrint(3, moduleName, '(autorun) Tracker whitelist saved', {
                    trackerWhitelist: toJS(this.cache.trackerWhitelist)
                });
            });
        }, {delay: 1000});
        autorun(() => {
            chrome.storage.local.set({
                trackerAllowedList: toJS(this.cache.trackerAllowedList)
            }, () => {
                prettyPrint(3, moduleName, '(autorun) Tracker allowed list saved', {
                    trackerAllowedList: toJS(this.cache.trackerAllowedList)
                });
            });
        }, {delay: 1000});
    }

    static getCookieBlacklist() {
        return toJS(this.cache.cookieBlacklist);
    }

    static checkCookieBlacklist(domain) {
        return this.cache.cookieBlacklist.includes(domain);
    }

    static addCookieBlacklist(domain) {
        if (!this.checkCookieBlacklist(domain)) {
            this.cache.cookieBlacklist.push(domain);
            return true;
        } else {
            return false;
        }
    }

    static removeCookieBlacklist(domain) {
        if (this.checkCookieBlacklist(domain)) {
            this.cache.cookieBlacklist.remove(domain);
            return true;
        } else {
            return false;
        }
    }

    static getTrackerMasterSwitch() {
        return this.cache.trackerMasterSwitch;
    }

    static setTrackerMasterSwitch(value) {
        if (this.cache.trackerMasterSwitch !== value) {
            this.cache.trackerMasterSwitch = value;
            return true;
        } else {
            return false;
        }
    }

    static checkTrackerWhitelist(domain) {
        return this.cache.trackerWhitelist.includes(domain);
    }

    static addTrackerWhitelist(domain) {
        if (!this.checkTrackerWhitelist(domain)) {
            this.cache.trackerWhitelist.push(domain);
            return true;
        } else {
            return false;
        }
    }

    static removeTrackerWhitelist(domain) {
        if (this.checkTrackerWhitelist(domain)) {
            this.cache.trackerWhitelist.remove(domain);
            return true;
        } else {
            return false;
        }
    }

    static checkTrackerAllowedList(currentPageDomain, urlToCheck) {
        urlToCheck = getRuleFromUrl(urlToCheck);
        let result = false;
        if (this.cache.trackerAllowedList[currentPageDomain]) {
            result = this.cache.trackerAllowedList[currentPageDomain].includes(urlToCheck);
        }
        return result;
    }

    static addTrackerAllowedList(currentPageDomain, urlToAdd) {
        urlToAdd = getRuleFromUrl(urlToAdd);
        if (!this.cache.trackerAllowedList[currentPageDomain]) {
            this.cache.trackerAllowedList[currentPageDomain] = [urlToAdd];
            return true;
        } else if (!this.cache.trackerAllowedList[currentPageDomain].includes(urlToAdd)) {
            this.cache.trackerAllowedList[currentPageDomain].push(urlToAdd);
            return true;
        } else {
            return false;
        }
    }

    static removeTrackerAllowedList(currentPageDomain, urlToRemove) {
        urlToRemove = getRuleFromUrl(urlToRemove);
        if (this.cache.trackerAllowedList[currentPageDomain] &&
            this.cache.trackerAllowedList[currentPageDomain].includes(urlToRemove)) {
            if (this.cache.trackerAllowedList[currentPageDomain].length <= 1) {
                delete this.cache.trackerAllowedList[currentPageDomain];
            } else {
                this.cache.trackerAllowedList[currentPageDomain].remove(urlToRemove);
            }
            return true;
        } else {
            return false;
        }
    }
}