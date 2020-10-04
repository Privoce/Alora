import {autorun, observable, toJS} from "mobx";
import * as ABPFilterParser from 'abp-filter-parser';

import {prettyPrint} from './utils';

const moduleName = '🔰 ABP Rules';

const abpRulesUpdateUrls = {
    'EasyPrivacy': {
        url: 'https://easylist.to/easylist/easyprivacy.txt',
        category: 'tracker'
    },
    'Fanboy-Social': {
        url: 'https://easylist.to/easylist/fanboy-social.txt',
        category: 'tracker'
    },
    'EasyList': {
        url: 'https://easylist.to/easylist/easylist.txt',
        category: 'ad'
    },
    'EasyList China': {
        url: 'https://easylist-downloads.adblockplus.org/easylistchina.txt',
        category: 'ad'
    }
};

class AbpRulesManager {
    static cache = observable({});
    static parsedFilterData = {};

    static async initiate() {
        const getVersion = content => {
            const result = content.match(/^! Version: (.*)$/m);
            return result ? result[1] : '';
        };
        const abpRulesStorage = await new Promise(resolve => {
            // load rules from storage
            chrome.storage.local.get(['abpRules'], ({abpRules}) => {
                resolve(abpRules || {});
            });
        });
        // cache rules into memory
        for (let ruleName in abpRulesUpdateUrls) {
            if (abpRulesStorage.hasOwnProperty(ruleName)) {
                this.cache[ruleName] = abpRulesStorage[ruleName];
                prettyPrint(0, moduleName, 'Loaded rule', {
                    ruleName
                });
            } else {
                this.cache[ruleName] = '';
                prettyPrint(2, moduleName, 'Cannot find rule', {
                    ruleName
                });
            }
        }
        // make sure further changes will be synced with storage
        autorun(() => {
            chrome.storage.local.set({
                abpRules: toJS(this.cache)
            }, () => {
                prettyPrint(3, moduleName, '(autorun) Saved all rules');
            });
            new Promise(resolve => {
                // clear previous data
                this.parsedFilterData = {};
                for (let ruleName in this.cache) {
                    if (this.cache.hasOwnProperty(ruleName)) {
                        this.parsedFilterData[ruleName] = {}
                        ABPFilterParser.parse(this.cache[ruleName], this.parsedFilterData[ruleName]);
                        prettyPrint(0, moduleName, '(autorun) Parsed rule', {
                            ruleName
                        });
                    }
                }
                resolve();
            });
        }, {delay: 1000});
        for (let ruleName in abpRulesUpdateUrls) {
            const localVersion = getVersion(this.cache[ruleName]);
            const xhr = new XMLHttpRequest();
            xhr.open('get', abpRulesUpdateUrls[ruleName].url, true);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const onlineContent = xhr.responseText;
                        const onlineVersion = getVersion(onlineContent);
                        if (localVersion !== onlineVersion) {
                            this.cache[ruleName] = onlineContent;
                            prettyPrint(0, moduleName, 'Updated rule', {
                                ruleName, onlineVersion, localVersion
                            });
                        } else {
                            prettyPrint(2, moduleName, 'Rule is latest', {
                                ruleName, onlineVersion, localVersion
                            });
                        }
                    } else {
                        prettyPrint(2, moduleName, 'Cannot update rule', {
                            ruleName
                        });
                    }
                }
            };
            xhr.send();
            prettyPrint(1, moduleName, 'Start updating rules', {
                ruleName
            });
        }
    }

    static checkShouldBlock(currentPageDomain, urlToCheck) {
        let result = false;
        let category = '';
        try {
            for (let ruleName in this.parsedFilterData) {
                result = ABPFilterParser.matches(this.parsedFilterData[ruleName], urlToCheck, {
                    domain: currentPageDomain,
                    elementTypeMaskMap: ABPFilterParser.elementTypes.SCRIPT,
                });
                // break on first match
                if (result) {
                    category = abpRulesUpdateUrls[ruleName].category;
                    break;
                }
            }
        } catch {
            // do not fire
        }
        return {
            result,
            category
        };
    }
}

export {
    abpRulesUpdateUrls, AbpRulesManager
}