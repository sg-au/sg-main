function copyTxt() {
    // Get the text field
    var copyText = document.getElementById("ticketID");
    console.log('hi from copyText.js');

    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.textContent);
}
