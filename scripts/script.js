// This file contains the JavaScript code for the web banner functionality.

document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('banner');
    const closeButton = document.getElementById('close-banner');

    // Function to show the banner
    function showBanner() {
        banner.style.display = 'block';
    }

    // Function to hide the banner
    function hideBanner() {
        banner.style.display = 'none';
    }

    // Event listener for the close button
    closeButton.addEventListener('click', hideBanner);

    // Show the banner when the page loads
    showBanner();
});