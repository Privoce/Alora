import {AbpRulesManager, abpRulesUpdateUrls} from "./abp-rules-manager";
import {ConfigManager} from "./config-manager";
import {TabProfileManager} from "./tab-profile-manager";
import {getDomainFromUrl, prettyPrint} from "./utils";
import {CookieHistoryManager} from "./cookie-history-manager";
import {autorun} from "mobx";
import debounce from 'lodash/debounce';

import baIconDisable from '../assets/images/circle-disabled.png';
import baIconEnabled from '../assets/images/circle-enabled.png';

const moduleName = '👑 Main';

ConfigManager.initiate().then();
AbpRulesManager.initiate().then();
TabProfileManager.initiate();

// store active tab key for popup, no need to store permanently
let activeTabKey = 'home';

// block request
chrome.webRequest.onBeforeRequest.addListener(
    requestDetails => {
        if (requestDetails.tabId === chrome.tabs.TAB_ID_NONE) {
            // allow all requests that are not coming from a tab
            return {};
        }
        // do not use current tab id from tab profile manager,
        // always use tab id from request details,
        // because a web request may come from an inactive tab
        const trackerMasterEnabled = ConfigManager.getTrackerMasterSwitch();
        if (!trackerMasterEnabled) {
            return {};
        }
        const domain = getDomainFromUrl(TabProfileManager.getUrl(requestDetails.tabId));
        const isPageSelf = requestDetails.type === 'main_frame' || requestDetails.type === 'sub_frame';
        const domainWhitelisted = ConfigManager.checkTrackerWhitelist(domain);
        const userAllowed = ConfigManager.checkTrackerAllowedList(domain, requestDetails.url);
        const {result: blockedByRules, category} = AbpRulesManager.checkShouldBlock(domain, requestDetails.url);

        // even if user allows whole site or single tracker,
        // tracker info should still be added to tab profile
        // to be displayed on popup
        const shouldAddToTabProfile = trackerMasterEnabled && !isPageSelf && blockedByRules;
        // now take all conditions into consideration
        const shouldBlock = trackerMasterEnabled && !isPageSelf && !domainWhitelisted && !userAllowed && blockedByRules;

        if (shouldAddToTabProfile) {
            // tracker whitelist is another logic,
            // internally, it is separate from user allowed logic,
            // one controls by site and one controls by tracker,
            // externally, site has higher priority than tracker and can short the latter
            TabProfileManager.addAbpBlockedRequest(requestDetails.tabId, category, requestDetails.url, userAllowed);
        }
        prettyPrint(shouldBlock ? 2 : 0, moduleName, 'Handled web request', {
            requestDetails,
            domain,
            isPageSelf,
            domainWhitelisted,
            userAllowed,
            blockedByRules,
            category,
            shouldAddToTabProfile,
            shouldBlock
        });
        return {cancel: shouldBlock};
    },
    {urls: ['*://*/*']},
    ['blocking']
);

// set default badge color
chrome.browserAction.setBadgeBackgroundColor({
    color: '#ffbd2e'
});

// bind onActivated event to update browserAction
autorun(() => {
    for (let windowId in TabProfileManager.allActiveTabIds) {
        if (TabProfileManager.allActiveTabIds.hasOwnProperty(windowId)) {
            const tabId = TabProfileManager.allActiveTabIds[windowId];
            const domain = getDomainFromUrl(TabProfileManager.getUrl(tabId));
            const cookieBlacklisted = ConfigManager.checkCookieBlacklist(domain);
            const trackerMasterSwitch = ConfigManager.getTrackerMasterSwitch();
            const trackerWhitelisted = ConfigManager.checkTrackerWhitelist(domain);
            const baIconState = trackerMasterSwitch || cookieBlacklisted;
            let badgeText = '';
            if (trackerMasterSwitch) {
                // function that refers observable variables still works as observable
                badgeText = TabProfileManager.getBlockedTrackerCount(tabId, trackerWhitelisted).toString();
            }
            Promise.all([
                new Promise(resolve => {
                    chrome.browserAction.setIcon({
                        path: baIconState ? baIconEnabled : baIconDisable,
                        tabId
                    }, resolve);
                }),
                new Promise(resolve => {
                    chrome.browserAction.setBadgeText({
                        text: badgeText,
                        tabId
                    }, resolve);
                })
            ]).then(() => {
                prettyPrint(0, moduleName, '(autorun) Updated browser action', {
                    domain, cookieBlacklisted, trackerMasterSwitch, trackerWhitelisted, baIconState, badgeText, tabId
                });
            });
        }
    }
}, {
    delay: 100
});

// page refresh
// use debounce to avoid multiple calls in short time
const refreshPage = debounce(tabId => {
    chrome.tabs.reload(
        tabId,
        {bypassCache: false},
        () => {
            prettyPrint(0, moduleName, '(🌊 Debounce) Auto refreshed page', {
                tabId
            });
        }
    );
}, 2000);

// handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // wrap it up so that the outer function is a synchronous function
    (async (message, sender, sendResponse) => {
        let response = {};
        if (message.src === 'content script' && message.action === 'page unloading') {
            // check if domain is in cookie blacklist
            if (ConfigManager.checkCookieBlacklist(message.domain)) {
                // blacklisted, clear cookie and history
                CookieHistoryManager.clearBlacklistCookies(message.data).then();   // performance data
                CookieHistoryManager.clearBlacklistHistory(message.domain).then();
            }
            // content script does not wait for response
        } else if (message.src === 'popup' && message.action === 'query config') {
            const url = TabProfileManager.getUrl(message.data.tabId);
            const appState = {
                activeTabKey,
                homeTabState: {
                    url,
                    trackerSwitchState: ConfigManager.getTrackerMasterSwitch()
                },
                trackerTabState: {
                    listItems: {},  // fill later
                    siteTrusted: ConfigManager.checkTrackerWhitelist(getDomainFromUrl(url))
                },
                manageTabState: {
                    listItems: ConfigManager.getCookieBlacklist()
                }
            };
            // fill trackerTabState.listItems
            const abpBlockedRequests = TabProfileManager.getAbpBlockedRequests(message.data.tabId);
            for (let category of Object.entries(abpRulesUpdateUrls).map(i => i[1].category)) {
                if (abpBlockedRequests.hasOwnProperty(category)) {
                    appState.trackerTabState.listItems[
                        chrome.i18n.getMessage(`trackerCategory_${category}`)
                        ] = abpBlockedRequests[category].map(request => (
                        {
                            content: request.rule,
                            userAllowed: request.userAllowed
                        }
                    ));
                }
            }
            // send response
            response = {appState};
        } else if (message.src === 'popup' && message.action === 'add cookie blacklist') {
            response = {
                result: ConfigManager.addCookieBlacklist(message.data.domain)
            };
        } else if (message.src === 'popup' && message.action === 'del cookie blacklist') {
            response = {
                result: ConfigManager.removeCookieBlacklist(message.data.domain)
            };
        } else if (message.src === 'popup' && message.action === 'set tracker master') {
            response = {
                result: ConfigManager.setTrackerMasterSwitch(message.data.value)
            };
        } else if (message.src === 'popup' && message.action === 'add tracker whitelist') {
            response = {
                result: ConfigManager.addTrackerWhitelist(message.data.domain)
            };
        } else if (message.src === 'popup' && message.action === 'del tracker whitelist') {
            response = {
                result: ConfigManager.removeTrackerWhitelist(message.data.domain)
            };
        } else if (message.src === 'popup' && message.action === 'add tracker allowed') {
            response = {
                result: ConfigManager.addTrackerAllowedList(message.data.domain, message.data.url)
            };
        } else if (message.src === 'popup' && message.action === 'del tracker allowed') {
            response = {
                result: ConfigManager.removeTrackerAllowedList(message.data.domain, message.data.url)
            };
        } else if (message.src === 'popup' && message.action === 'set active tab key') {
            activeTabKey = message.data.activeTabKey;
            response = {
                result: true
            };
        }

        // check if needed to reload page
        if (message.src === 'popup' && message.action.includes('tracker')) {
            // tracker related features, need to refresh page automatically
            refreshPage(TabProfileManager.currentActiveTabId);
        }
        sendResponse(response);
        prettyPrint(0, moduleName, 'Handled message', {
            message, response
        });
    })(message, sender, sendResponse);
    // return true to keep tunnel open until sendResponse() is called
    return true;
});

// listen for onUninstall event and open uninstall form
chrome.runtime.setUninstallURL('https://pt.surveymonkey.com/r/GFHQ85R');
