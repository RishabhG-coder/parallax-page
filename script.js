document.addEventListener('DOMContentLoaded', () => {

    // --- 1. HIGH-PERFORMANCE, ACCESSIBLE PARALLAX LOGIC ---
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    function updateParallax() {
        if (!prefersReducedMotion) {
            const scrollPosition = lastScrollY;
            // Element parallax
            document.querySelectorAll('.parallax-element').forEach(el => {
                const speed = parseFloat(el.dataset.speed);
                // Check if speed is a valid number before applying transform
                if (!isNaN(speed)) {
                    el.style.transform = `translateY(${-scrollPosition * speed}px)`;
                }
            });

            // Background parallax for scenes
            document.querySelectorAll('.parallax-scene').forEach(scene => {
                const rect = scene.getBoundingClientRect();
                // Check if rect exists before calculating offset
                if (rect) {
                    const offset = rect.top * 0.2; // Tweak this factor for more/less depth
                    scene.style.backgroundPosition = `center calc(50% + ${offset}px)`;
                }
            });
        }
        ticking = false;
    }

    function onScroll() {
        lastScrollY = window.pageYOffset;
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // Ensure scroll listener is added correctly
    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax(); // Run once on load to set initial positions

    // --- 2. FADE-IN ANIMATION ON SCROLL ---
    const contentSections = document.querySelectorAll('.content-section');
    if (contentSections.length > 0) { // Check if sections exist
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        contentSections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(50px)';
            section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            observer.observe(section);
        });
    }

    // --- 3. DARK/LIGHT MODE TOGGLE ---
    const themeCheckbox = document.getElementById('theme-checkbox');
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // Switch is ON (checked) for Dark Mode
        if (themeCheckbox) { // Check if checkbox exists
            themeCheckbox.checked = theme === 'dark';
        }
    }
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || 'light'); // Default to light theme

    if (themeCheckbox) { // Check if checkbox exists before adding listener
        themeCheckbox.addEventListener('change', function () {
            const theme = this.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            applyTheme(theme);
        });
    }


    // --- 4. LOGIN MODAL & VALIDATION ---
    const loginModal = document.getElementById('login-modal');
    const openModalBtn = document.getElementById('login-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const loginForm = document.getElementById('login-form');
    // Check if all elements exist before adding listeners
    if (loginModal && openModalBtn && closeModalBtn && loginForm) {
        const welcomeMessage = document.getElementById('welcome-message');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const togglePasswordBtn = document.getElementById('toggle-password-btn');
        const togglePasswordIcon = document.getElementById('toggle-password-icon');
        const usernameValidation = document.getElementById('username-validation');
        const passwordValidation = document.getElementById('password-validation');
        const confirmPasswordValidation = document.getElementById('confirm-password-validation');
        const submitLoginBtn = document.getElementById('submit-login-btn');

        // Check if potentially null elements exist
        if (!usernameInput || !passwordInput || !confirmPasswordInput || !togglePasswordBtn || !togglePasswordIcon || !usernameValidation || !passwordValidation || !confirmPasswordValidation || !submitLoginBtn || !welcomeMessage) {
            console.error("One or more login modal elements not found.");
            return; // Stop execution of this block if elements are missing
        }


        const icons = {
            show: "https://img.icons8.com/?size=100&id=85329&format=png&color=000000",
            hide: "https://img.icons8.com/?size=100&id=85344&format=png&color=000000"
        };
        const validators = {
            username: (value) => value.length >= 4,
            password: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(value),
            confirmPassword: (value) => value === passwordInput.value && value.length > 0
        };
        let validationState = { username: false, password: false, confirmPassword: false };

        function validateAndCheckForm() {
            validationState.username = validateField(usernameInput, usernameValidation, validators.username);
            validationState.password = validateField(passwordInput, passwordValidation, validators.password);
            // Re-validate confirm password whenever password changes
            validationState.confirmPassword = validateField(confirmPasswordInput, confirmPasswordValidation, validators.confirmPassword);
            submitLoginBtn.disabled = !(validationState.username && validationState.password && validationState.confirmPassword);
        }
        function validateField(input, validationElement, validatorFn) {
            // Ensure elements exist before proceeding
            if (!input || !validationElement) return false;

            const isValid = validatorFn(input.value);
            input.classList.toggle('invalid', !isValid);
            validationElement.classList.toggle('error', !isValid);
            return isValid;
        }
        [usernameInput, passwordInput, confirmPasswordInput].forEach(input => {
            if (input) input.addEventListener('input', validateAndCheckForm);
        });

        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordIcon.src = isPassword ? icons.show : icons.hide;
            togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });

        openModalBtn.addEventListener('click', () => { loginModal.hidden = false; usernameInput.focus(); });
        const closeModal = () => { loginModal.hidden = true; openModalBtn.focus(); };
        closeModalBtn.addEventListener('click', closeModal);
        loginModal.addEventListener('click', (e) => { if (e.target === loginModal) closeModal(); });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Recheck validity on submit just in case
            validateAndCheckForm();
            if (validationState.username && validationState.password && validationState.confirmPassword) {
                welcomeMessage.textContent = `Welcome, ${usernameInput.value}!`;
                openModalBtn.textContent = 'Logout';
                closeModal();
            }
        });
    } else {
        console.warn("Login modal elements not found, skipping setup.");
    }


    // --- 5. NASA PICTURE OF THE DAY API with Fallback ---
    async function fetchNasaApod() {
        // IMPORTANT: Use your actual NASA API Key here
        const apiKey = 'NuNHezrbOYosawGqXoRYjXoFCnn8ke0sGfsbAajQ';

        const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&thumbs=true`;

        const imageEl = document.getElementById('api-image');
        const titleEl = document.getElementById('api-title');
        const explanationEl = document.getElementById('api-explanation');
        const loader = document.getElementById('api-loader');

        // Ensure elements exist
        if (!imageEl || !titleEl || !explanationEl || !loader) {
            console.error("API display elements not found.");
            return;
        }

        loader.hidden = false;
        imageEl.hidden = true;
        titleEl.textContent = 'Contacting NASA...'; // Updated loading text
        explanationEl.textContent = '';

        try {
            const response = await fetch(url);
            // Check for specific shutdown-related issues or general errors
            if (!response.ok) {
                // Try to read the response body for clues, but handle potential errors
                let errorBody = `HTTP error! status: ${response.status}`;
                try {
                    const text = await response.text();
                    // Check if the response mentions funding issues (common during shutdowns)
                    if (text.toLowerCase().includes('funding') || text.toLowerCase().includes('shutdown')) {
                        errorBody = 'NASA API unavailable due to government funding lapse.';
                    } else {
                        errorBody += ` - ${text.substring(0, 100)}`; // Show part of the error
                    }
                } catch (e) { /* Ignore errors reading the body */ }
                throw new Error(errorBody);
            }

            const data = await response.json();

            let imgSrc = '';
            if (data.media_type === 'video' && data.thumbnail_url) {
                imgSrc = data.thumbnail_url;
            } else if (data.media_type === 'image') {
                imgSrc = data.url;
            } else { // Fallback if unexpected media type
                imgSrc = 'https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg';
            }

            // Set up handlers *before* setting src
            imageEl.onerror = () => {
                console.error("Failed to load NASA image source:", imageEl.src);
                displayFallback('Image failed to load.'); // Use fallback function
            };

            imageEl.onload = () => {
                loader.hidden = true;
                imageEl.hidden = false;
            };

            imageEl.src = imgSrc; // Trigger image loading
            imageEl.alt = data.title || 'NASA Picture of the Day';
            titleEl.textContent = data.title || 'NASA Picture of the Day';
            explanationEl.textContent = data.explanation || 'No explanation provided.';

        } catch (error) {
            console.error('NASA API Fetch error:', error);
            // Display a specific fallback message on error
            displayFallback(error.message); // Pass the specific error message
        }
    }

    // Helper function to display fallback content
    function displayFallback(errorMessage) {
        const imageEl = document.getElementById('api-image');
        const titleEl = document.getElementById('api-title');
        const explanationEl = document.getElementById('api-explanation');
        const loader = document.getElementById('api-loader');

        if (loader) loader.hidden = true; // Ensure loader is hidden

        if (imageEl && titleEl && explanationEl) {
            imageEl.src = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; // A default space image
            imageEl.alt = 'Placeholder space image';
            titleEl.textContent = 'NASA APOD Temporarily Unavailable';
            // Show the specific error message from the catch block
            explanationEl.textContent = `Could not fetch data. Reason: ${errorMessage}. Displaying placeholder content.`;
            imageEl.hidden = false; // Show the fallback image
        }
    }

    fetchNasaApod(); // Call the function to fetch data


    // --- 6. DATA VISUALIZATION CHART ---
    try {
        const ctx = document.getElementById('resourceChart');
        if (ctx && typeof Chart !== 'undefined') { // Check if Chart.js is loaded
            const chart = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Water Ice', 'Helium-3', 'Iron', 'Silicon', 'Rare Metals'],
                    datasets: [{
                        label: 'Resource Distribution', data: [45, 25, 15, 10, 5],
                        backgroundColor: ['#36a2eb', '#ffcd56', '#ff6384', '#4bc0c0', '#9966ff'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                // Initial color set later by updateChartColors
                            }
                        }
                    }
                }
            });

            function updateChartColors() {
                // Ensure chart and options exist before updating
                if (chart && chart.options && chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                    const theme = document.documentElement.getAttribute('data-theme');
                    const labelColor = theme === 'light' ? '#333' : 'rgba(255, 255, 255, 0.9)';
                    chart.options.plugins.legend.labels.color = labelColor;
                    chart.update();
                }
            }
            // Ensure themeCheckbox exists before adding listener
            if (themeCheckbox) {
                themeCheckbox.addEventListener('change', updateChartColors);
            }
            updateChartColors(); // Initial update

        } else if (!ctx) {
            console.warn("Chart canvas element not found.");
        } else if (typeof Chart === 'undefined') {
            console.error("Chart.js library not loaded.");
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) chartContainer.innerHTML = "<p>Chart library failed to load.</p>";
        }
    } catch (e) {
        console.error("Chart.js failed to initialize:", e);
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) chartContainer.innerHTML = "<p>Chart could not be loaded due to an error.</p>";
    }

    // --- 7. REAL-TIME CONNECTIVITY STATUS ---
    const statusDot = document.querySelector('.status-dot');
    const connectionText = document.getElementById('connection-text');
    const connectionSpeed = document.getElementById('connection-speed');

    // Check if connectivity elements exist
    if (statusDot && connectionText && connectionSpeed) {
        function updateConnectionStatus() {
            if (navigator.onLine) {
                statusDot.className = 'status-dot online';
                let status = 'Online';
                if (navigator.connection && navigator.connection.effectiveType) {
                    status += ` (${navigator.connection.effectiveType.toUpperCase()})`;
                }
                connectionText.textContent = status;
                if (navigator.connection && navigator.connection.downlink) {
                    connectionSpeed.textContent = `Speed: ~${navigator.connection.downlink} Mbps`;
                } else {
                    connectionSpeed.textContent = 'Speed: N/A';
                }
            } else {
                statusDot.className = 'status-dot offline';
                connectionText.textContent = 'Offline';
                connectionSpeed.textContent = 'Speed: N/A';
            }
        }

        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateConnectionStatus);
        }
        updateConnectionStatus(); // Initial check on load
    } else {
        console.warn("Connectivity status elements not found, skipping setup.");
    }

}); // End of DOMContentLoaded
