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

// function toggleIncognito() {
//     // update user option
//     // save_options();
//     console.log("shit");
//     var status = document.querySelector("#switch2").checked;
//     if (status) {
//         chrome.cookies.onChanged.addListener(startIncognito);
//     } else {
//         chrome.cookies.onChanged.removeListener(startIncognito);
//     }
// }

// function incognitoReplyHandeler(response) {
// }

// console.log("content: extension starts");
// // main logic
// document.addEventListener("DOMContentLoaded", function() {
//     // initialization
//     // incongnito
    
//     chrome.storage.sync.get({incognito: false}, function(items) {
//         console.log(items.incognito);
//     });
//     // ask for incognito status
//     chrome.runtime.sendMessage({msg: "incognito_status"}, incognitoReplyHandeler);
// });