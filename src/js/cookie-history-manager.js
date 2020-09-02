import {prettyPrint} from "./utils";

const moduleName = '💧 Cookie & History';

export class CookieHistoryManager {
    static async clearBlacklistCookies(data) {
        const getCookieUrl = cookie => {
            return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
        };
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
                resolve();
            });
        })));
        prettyPrint(0, moduleName, 'Cleared cookie', {
            data
        });
    }

    static async clearBlacklistHistory(domain) {
        // search history entries
        const historyItems = await new Promise(resolve => {
            chrome.history.search({
                text: domain
            }, resolve)
        });
        const pattern = `.*://${domain}`;
        const re = new RegExp(pattern);
        const pool = [];
        let count = 0;
        historyItems.forEach(historyItem => {
            if (re.test(historyItem.url)) {
                pool.push(new Promise(resolve => {
                    chrome.history.deleteUrl({
                        url: historyItem.url
                    }, () => {
                        count++;
                        resolve();
                    });
                }));
            }
        });
        await Promise.all(pool);
        prettyPrint(0, moduleName, 'Cleared history', {
            count
        });
    }
}