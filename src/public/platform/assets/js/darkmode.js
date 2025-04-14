function darkMode() {
    var x = document.getElementById("darkbtn");
    x.style.display = "none"; //hides the Dark Mode button

    var y = document.getElementById("lightbtn");
    y.style.display = "block"; //shows the Light Mode button

    document.querySelector("html", "c-wiz").style.filter = "invert(1) hue-rotate(180deg)";

    let media = document.querySelectorAll("img, picture, video");

    media.forEach((mediaItem) => {
        mediaItem.style.filter = "invert(1) hue-rotate(180deg)";
    });
    //document.getElementById("demo").innerHTML = "Hello World";
}

function lightMode() {
    var x = document.getElementById("darkbtn");
    x.style.display = "block"; //hides the Dark Mode button

    var y = document.getElementById("lightbtn");
    y.style.display = "none"; //shows the Light Mode button

    document.querySelector("html").style.filter = "invert(0) hue-rotate(0deg)";

    let media = document.querySelectorAll("img, picture, video");

    media.forEach((mediaItem) => {
        mediaItem.style.filter = "invert(0) hue-rotate(0deg)";
    });
}