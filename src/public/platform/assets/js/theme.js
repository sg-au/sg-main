document.addEventListener('DOMContentLoaded', function() {
    const currentMode = localStorage.getItem('darkMode');
    console.log("[Theme] Current mode from localStorage:", currentMode); // Debug log

    if (currentMode === 'true') {
        console.log("[Theme] Applying dark mode"); // Debug log
        darkMode();
    } else if (currentMode === null) {
        console.log("[Theme] Initializing darkMode to false"); // Debug log
        localStorage.setItem('darkMode', 'false');
    }
});

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
