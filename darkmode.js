// Dark Mode Toggle
(function() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle?.querySelector('.toggle-icon');
    
    // Check saved preference or system preference
    function getPreference() {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return saved === 'true';
        }
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Apply dark mode
    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (icon) icon.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            if (icon) icon.textContent = '🌙';
        }
    }
    
    // Initialize
    applyDarkMode(getPreference());
    
    // Toggle event
    if (toggle) {
        toggle.addEventListener('click', () => {
            const isDark = !document.body.classList.contains('dark-mode');
            applyDarkMode(isDark);
            localStorage.setItem('darkMode', isDark);
        });
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            applyDarkMode(e.matches);
        }
    });
})();
