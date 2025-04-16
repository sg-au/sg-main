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
    document.documentElement.classList.add('dark');
    var icon = document.getElementById("icon");
    var htmlElement = document.querySelector("html");
    var heroElement = document.querySelector("#hero");
    var iframeElement = document.querySelector("iframe");
    var memberImages = document.querySelectorAll(".member-img");
    var imageElement = document.querySelector(".card img");

    document.getElementById('drkMdIcon').className = "ti ti-sun";

    document.querySelector("html", "c-wiz").style.filter = "invert(1) hue-rotate(180deg)";
    if (heroElement) {
        heroElement.style.filter = "invert(1) hue-rotate(180deg)";
    }
    if (iframeElement) {
        iframeElement.style.backgroundColor= "#EAEFF4";
    }
    // if(memberImages){
    //     memberImages.forEach((image)=>{
    //         image.style.filter = "invert(1) hue-rotate(180deg)";
    //     });
    // }
    if (imageElement) {
        imageElement.style.filter = "invert(1) hue-rotate(180deg)";
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
                cardBody.style.filter = "invert(1) hue-rotate(180deg)";
            }
        }
    });
    // let media = document.querySelectorAll("img, picture, video");
    // media.forEach((mediaItem) => {
    //     mediaItem.style.filter = "invert(0.5) hue-rotate(180deg)";
    // });
    let imgs = document.querySelectorAll(".bg-image");
    imgs.forEach((item) => {
        item.style.filter = "invert(1) hue-rotate(180deg)";
    });
    let primaryElems = document.querySelectorAll(".btn-primary, .sidebar-link.active");
    primaryElems.forEach((elem) => {
        /* Color: #5d87ff */
        elem.style.filter = "invert(1) hue-rotate(180deg)";
        elem.style.backgroundColor = "#5d87ff";
    });
}

function lightMode() {
    document.documentElement.classList.remove('dark');
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
        iframeElement.style.backgroundColor= "transparent";
    }

    if (imageElement) {
        imageElement.style.filter = "invert(0) hue-rotate(0deg)";
    }
    // let media = document.querySelectorAll("img, picture, video");
    // media.forEach((mediaItem) => {
    //     mediaItem.style.filter = "invert(0) hue-rotate(0deg)";
    // });
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
    let imgs = document.querySelectorAll(".bg-image");
    imgs.forEach((item) => {
        item.style.filter = "invert(0)";
    });
    let primaryElems = document.querySelectorAll(".btn-primary, .sidebar-link.active");
    primaryElems.forEach((elem) => {
        elem.style.filter = "none";
        elem.style.backgroundColor = "#5d87ff";
    });
}