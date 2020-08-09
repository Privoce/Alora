export class CookieAPI {
    static async clearBlacklistCookies(data) {
        function getCookieUrl(cookie) {
            return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
        }
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
                console.log("background: Cookie " + getCookieUrl(deletedCookie) + " has been deleted by blacklist.");
            });
        })));
    }

    static async clearBlacklistHistory(urlVisited) {
        await new Promise(resolve => {
            chrome.history.deleteUrl({domain: urlVisited}, resolve);
        });
    }
}