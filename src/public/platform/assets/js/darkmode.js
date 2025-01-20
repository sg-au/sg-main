function darkMode() {
    var darkBtn = document.getElementById("darkbtn");
    var lightBtn = document.getElementById("lightbtn");

    // Toggle visibility of buttons
    darkBtn.style.display = "none";
    lightBtn.style.display = "block";

    // Apply dark mode theme
    document.documentElement.setAttribute("data-bs-theme", "dark");
}

function lightMode() {
    var darkBtn = document.getElementById("darkbtn");
    var lightBtn = document.getElementById("lightbtn");

    // Toggle visibility of buttons
    darkBtn.style.display = "block";
    lightBtn.style.display = "none";

    // Revert to light mode theme
    document.documentElement.setAttribute("data-bs-theme", "light");
}
