// Load the current mode from localStorage and apply on page load
var currentMode = localStorage.getItem('darkMode');
if (currentMode === 'true') {
    darkMode();
} else if (currentMode === null) {
    localStorage.setItem('darkMode', 'false');
}

function changeTheme() {
    const cMode = localStorage.getItem('darkMode');
    const newMode = cMode === 'true' ? 'false' : 'true';

    // Toggle dark mode in localStorage
    localStorage.setItem('darkMode', newMode);

    // Apply styles based on the new mode
    if (newMode === 'true') {
        darkMode();
    } else {
        lightMode();
    }
}

function darkMode() {
    // Change the dark mode icon
    document.getElementById('drkMdIcon').className = "ti ti-sun";

    // Set the data-bs-theme attribute to "dark"
    document.documentElement.setAttribute('data-bs-theme', 'dark');
}

function lightMode() {
    // Change the light mode icon
    document.getElementById('drkMdIcon').className = "ti ti-moon";

    // Set the data-bs-theme attribute to "light"
    document.documentElement.setAttribute('data-bs-theme', 'light');
}
