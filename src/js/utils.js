const iconList = {
    0: '🟢', // green circle
    1: '🟡', // yellow circle
    2: '🔴', // red circle
    3: '🔵'  // blue circle
};

function prettyPrint(iconId, moduleName, ...params) {
    console.info(`[${moduleName}]`, iconList[iconId], ...params);
}

function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

function preventDrag(e) {
    e.preventDefault();
}

function getFaviconUrlFromDomain(domain) {
    if (domain.includes('.')) {
        // use HTTPS by default
        return 'chrome://favicon/size/128@1x/https://' + domain;
    } else {
        // not a usual domain, use chrome:// protocol instead
        return 'chrome://favicon/size/128@1x/chrome://' + domain;
    }
}

function getFaviconUrlFromUrl(url) {
    return 'chrome://favicon/size/128@1x/' + url;
}

// use by popup to display tracker url in a friendly way
function getFriendlyRuleFromRule(rule) {
    const ruleSlices = rule.split(/\//);
    const domain = ruleSlices[0] || '';
    const filename = ruleSlices
        .slice(1)   // get rid of the first item, which is domain
        .filter(i => i)   // filter empty items
        .slice(-1)[0] || '/';   // choose the last one, and default value
    return [filename, domain];
}

// user allow rule, no protocol prefix, no parameters
function getRuleFromUrl(url) {
    return url
        .replace(/.*?:\/\//, '')
        .split(/\//)
        .map(i => i.replace(/[?#](.*)$/, ''))   // remove parameters that starts with ? or #
        .filter(i => i.match(/[=&;]/) === null)   // only allow item that doesn't contains =&;
        .join('/');  // re-join items
}

export {
    prettyPrint,
    getDomainFromUrl,
    preventDrag,
    getFaviconUrlFromDomain,
    getFaviconUrlFromUrl,
    getFriendlyRuleFromRule,
    getRuleFromUrl
};