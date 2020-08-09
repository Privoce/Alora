export class StorageAPI {
    static cache = {};

    static async getCookieBlacklist() {
        if (StorageAPI.cache.cookieBlacklist) {
            return StorageAPI.cache.cookieBlacklist;
        } else {
            return await new Promise(resolve => {
                chrome.storage.local.get('cookieBlacklist', items => {
                    StorageAPI.cache.cookieBlacklist = items.cookieBlacklist ? new Set(items.cookieBlacklist) : new Set();
                    resolve(StorageAPI.cache.cookieBlacklist);
                });
            });
        }
    }

    static async addCookieBlacklist(domain) {
        StorageAPI.cache.cookieBlacklist.add(domain);
        return await new Promise(resolve => {
            chrome.storage.local.set({cookieBlacklist: [...StorageAPI.cache.cookieBlacklist]}, resolve);
        });
    }

    static async deleteCookieBlacklist(domain) {
        StorageAPI.cache.cookieBlacklist.delete(domain);
        return await new Promise(resolve => {
            chrome.storage.local.set({cookieBlacklist: [...StorageAPI.cache.cookieBlacklist]}, resolve);
        });
    }
}
