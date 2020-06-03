// if( document.readyState !== 'loading' ) {
//     var data = performance.getEntriesByType("resource").map(e => e.name);
//     console.log(data);
// } else {
//     document.addEventListener('DOMContentLoaded', function () {
//         var data = performance.getEntriesByType("resource").map(e => e.name);
//         console.log("content: " + data);
//     });
// }


// document.addEventListener("DOMContentLoaded", function() {
//     var data = performance.getEntriesByType("resources").map(e => e.name);
//     console.log("content: " + data);
// });


window.addEventListener("beforeunload", function(event) {
    var data = performance.getEntriesByType("resource").map(e => e.name);
    chrome.runtime.sendMessage({domain: location.hostname, data: data}, function(response) {});
});