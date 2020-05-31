// function removeCookie(cookie) {
//     var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
//               cookie.path;
//     chrome.cookies.remove({"url": url, "name": cookie.name});
//     alert('Cookie changed: ' +
//     '\n * Cookie: ' + JSON.stringify(cookie) +
//     '\n removed');
// }

// function startIncognito(info) {
//     if (info.cause == "explicit" && info.removed == false) {
//         removeCookie(info.cookie);
//     }
// }

function saveAndNotify(status) {
    chrome.storage.sync.get(["config"], function(res) {
        // update configuration
        var config = res.config;
        config.startTime = status ? (new Date()).toJSON() : config.startTime;
        config.endTime = status ? config.startTime : (new Date()).toJSON();
        config.isIncognito = status;
        // notify
        chrome.storage.sync.set({config: config}, function() {
            console.log("User options saved.");
            chrome.runtime.sendMessage(getMessage("incognito"), function(response) {});
        });
    });
}

function restore_options() {
    // restore button states
    chrome.storage.sync.get(["config"], function(res) {
        document.getElementById("switch2").checked = res.config.isIncognito;
    });
}

function getMessage(type) {
    if (type == "incognito") {
        return {cmd: "incognito", content: null};
    }
}

function toggleIncognito() {
    console.log("popup: toggle");
    // get latest configuration
    var incognitoStatus = document.getElementById("switch2").checked;
    // save and notify background of configuration change
    saveAndNotify(incognitoStatus);
}




console.log("popup: extension starts");



// This js controls popup page
document.addEventListener("DOMContentLoaded", function() {
    restore_options();
    console.log("popup: load configuration");
    document.querySelector("#switch2").addEventListener("change", toggleIncognito);
});

