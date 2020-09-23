const iconList = {
    0: '🟢', // green circle
    1: '🟡', // yellow circle
    2: '🔴', // red circle
    3: '🔵'  // blue circle
};

function prettyPrint(iconId, moduleName, ...params) {
    console.info(`[${moduleName}]`, iconList[iconId], ...params);
}

function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

function preventDrag(e) {
    e.preventDefault();
}

function getFaviconUrlByDomain(domain) {
    if (domain.includes('.')) {
        // use HTTPS by default
        return 'chrome://favicon/size/20@1x/https://' + domain;
    } else {
        // not a usual domain, use chrome:// protocol instead
        return 'chrome://favicon/size/20@1x/chrome://' + domain;
    }
}

function getFaviconUrlByUrl(url) {
    return 'chrome://favicon/size/20@1x/' + url;
}

// use by popup to display tracker url in a friendly way
function getFriendlyUrl(url) {
    const domain = getDomain(url);
    const filename = url
        .replace(/.*?:\/\/.*?\//, '')   // remove protocol prefix and domain and the / after domain
        .split(/\//)
        .filter(i => i) // ignore empty items
        .slice(-1)[0]  // use the last item
        .replace(/[?#](.*)$/, '');   // remove parameters that starts with ? or #
    return [`/${filename || ''}`, domain];
}

// user allow rule, no protocol prefix, no parameters
function getCustomRule(url) {
    return url
        .replace(/.*?:\/\//, '')
        .replace(/[?#](.*)$/, '');
}

export {
    prettyPrint, getDomain, preventDrag, getFaviconUrlByDomain, getFaviconUrlByUrl, getFriendlyUrl, getCustomRule
};