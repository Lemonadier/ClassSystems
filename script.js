/**
 * Minimal Entry Point - Loads all modules and runs initialization
 */

// Load all modules in dependency order
function loadScripts() {
    const scripts = [
        'app/config.js',
        'app/auth.js',
        'app/data.js',
        'app/ui.js',
        'app/charts.js',
        'app/handlers.js',
        'app/app.js'
    ];

    let loaded = 0;
    
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            loaded++;
            if(loaded === scripts.length) {
                // All modules loaded, initialize app
                setTimeout(app.init, 100);
            }
        };
        script.onerror = () => console.error('Failed to load ' + src);
        document.head.appendChild(script);
    });
}

// Start loading when DOM is ready
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadScripts);
} else {
    loadScripts();
}
