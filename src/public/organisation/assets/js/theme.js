var currentMode = localStorage.getItem('darkMode');
if (currentMode === 'true') {
    darkMode()
} if (currentMode == null) {
    localStorage.setItem('darkMode', 'false');
}
function changeTheme() {
    const cMode = localStorage.getItem('darkMode');
    const newMode = cMode === 'true' ? 'false' : 'true';
    // Toggle dark mode in localStorage
    localStorage.setItem('darkMode', newMode);

    // Apply styles based on the new mode
    if (newMode === 'true') {
        // Dark mode styles
        darkMode()
    } else {
        // Light mode styles
        lightMode()
    }
}

function darkMode() {
    console.log("Here")
    document.documentElement.classList.add("dark");
    var icon = document.getElementById("icon");
    var htmlElement = document.querySelector("html");
    var heroElement = document.querySelector("#hero");
    var iframeElement = document.querySelector("iframe");
    var memberImages = document.querySelectorAll(".member-img");
    var imageElement = document.querySelector(".card img");

    document.getElementById('drkMdIcon').className = "ti ti-sun";

    document.querySelector("html", "c-wiz").style.filter = "invert(1) hue-rotate(180deg)";
    if (heroElement) {
        heroElement.style.filter = "invert(1) hue-rotate(180deg) brightness(2.0)";
    }
    if (iframeElement) {
        iframeElement.style.filter = "invert(1) hue-rotate(180deg) brightness(2.0)";
    }
    // if(memberImages){
    //     memberImages.forEach((image)=>{
    //         image.style.filter = "invert(1) hue-rotate(180deg)";
    //     });
    // }
    if (imageElement) {
        imageElement.style.filter = "invert(1) hue-rotate(180deg) brightness(2.0)";
    }
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // Check the background image URL (assuming it's set via inline style)
        const backgroundImage = card.style.backgroundImage;

        // Check if the background image URL contains a specific image file name or URL
        if (backgroundImage) {
            card.style.filter = "invert(1) hue-rotate(180deg)";
            const cardBody = card.querySelector('.card-body');
            // Check if the 'card-body' div was found
            if (cardBody) {
                cardBody.style.filter = "invert(1) hue-rotate(180deg) brightness(2.0)";
            }
        }
    });
    // let media = document.querySelectorAll("img, picture, video");
    // media.forEach((mediaItem) => {
    //     mediaItem.style.filter = "invert(1) hue-rotate(180deg) brightness(2.0)";
    // });
}

function lightMode() {
    document.documentElement.classList.remove("dark");
    var icon = document.getElementById("icon");
    var htmlElement = document.querySelector("html");
    var heroElement = document.querySelector("#hero");
    var iframeElement = document.querySelector("iframe");
    var memberImages = document.querySelectorAll(".member-img");
    var imageElement = document.querySelector(".card img");

    document.getElementById('drkMdIcon').className = "ti ti-moon";

    document.querySelector("html", "c-wiz").style.filter = "invert(0) hue-rotate(0deg)";
    if (heroElement) {
        heroElement.style.filter = "invert(0) hue-rotate(0deg)";
    }
    if (iframeElement) {
        iframeElement.style.filter = "invert(0) hue-rotate(0deg)";
    }

    if (imageElement) {
        imageElement.style.filter = "invert(0) hue-rotate(0deg)";
    }
    let media = document.querySelectorAll("img, picture, video");
    media.forEach((mediaItem) => {
        mediaItem.style.filter = "invert(0) hue-rotate(0deg)";
    });
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // Check the background image URL (assuming it's set via inline style)
        const backgroundImage = card.style.backgroundImage;

        // Check if the background image URL contains a specific image file name or URL
        if (backgroundImage) {
            card.style.filter = "invert(0) hue-rotate(0deg)";
            const cardBody = card.querySelector('.card-body');
            // Check if the 'card-body' div was found
            if (cardBody) {
                cardBody.style.filter = "invert(0) hue-rotate(0deg)";
            }
        }
    });
}