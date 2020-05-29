function startIncognito() {
    console.log("switched!");
}


// main logic
document.addEventListener("DOMContentLoaded", function() {
    // initialization
    // incongnito
    document.querySelector("#switch2").addEventListener("change", startIncognito);
});
