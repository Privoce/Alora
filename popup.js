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
    chrome.storage.sync.get(function(res) {
        var blacklistBtn = document.getElementById("blacklistBtn");

        // restore incognito switch
        document.getElementById("switch2").checked = res.config.isIncognito;
        var blacklist = new Set(res.blacklist);
        // restore blacklist button
        chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
                const url = tabs[0].url;
                const domain = new URL(url).hostname;
                document.querySelector("#siteurl").innerHTML = domain;
                // add/remove from blacklist
                var blacklist = new Set(res.blacklist);
                var btnStatus = blacklist.has(domain);
                //
           // document.querySelector("#switch2").addEventListener("change", toggleIncognito);
            // alert(btnStatus);
            // btnStatus = false;
            blacklistBtn.checked = btnStatus;
                // alert(btnStatus);
                // const btnStyle = btnStatus ? "btn-outline-danger" : "btn-outline-success";
                //make switch match status
                // blacklistBtn.classList.add(btnStyle);
                // blacklistBtn.innerText = btnStatus ? "YES" : "NO";
                // document.querySelector("#blacklistBtn").addEventListener("hover", blacklistBtnHandler(blacklistBtn, domain, blacklist));
            blacklistBtn.addEventListener("click", function() {

                blacklistBtnHandler(blacklistBtn, domain, blacklist,btnStatus)
            });
            }
        );
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


function blacklistBtnHandler(btn, domain, blacklist,btnStatus) {
    const oldBtnStatus = btnStatus;
    // const oldStyle = oldBtnStatus ? "btn-outline-danger" : "btn-outline-success";
    const newBtnStatus = !oldBtnStatus;
    btn.checked = newBtnStatus;

    // const newStyle = newBtnStatus ? "btn-outline-danger" : "btn-outline-success";
    // blacklistBtn.classList.remove(oldStyle);
    // blacklistBtn.classList.add(newStyle);
    // blacklistBtn.innerText = newBtnStatus ? "YES" : "NO";
    // add/remove from blacklist
    if (newBtnStatus) {
        blacklist.add(domain);
        console.log(domain + " added to blacklist.");
    } else {
        blacklist.delete(domain);
        console.log(domain + " removed from blacklist");
    }
    chrome.storage.sync.set({blacklist: Array.from(blacklist)}, function() {
        console.log("popup: blacklist updated");
    });
    restore_options();
}




console.log("popup: extension starts");



// This js controls popup page
document.addEventListener("DOMContentLoaded", function() {
    // load button states
    restore_options(blacklistBtn);
    console.log("popup: load configuration");
    document.querySelector("#switch2").addEventListener("change", toggleIncognito);
});

