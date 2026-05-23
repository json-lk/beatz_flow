// public/js/main.js

// Standalone authentication worker trigger
async function submitLogin(email, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    if (result.success) {
        console.log("Logged in successfully as:", result.user);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // Prevent the browser from reloading the page natively
            event.preventDefault();

            // 1. Extract values typed by the user
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitBtn = document.getElementById('login-submit-btn');

            // Provide visual loading state feedback
            submitBtn.textContent = "Connecting...";
            submitBtn.disabled = true;

            try {
                // 2. This line links your HTML frontend directly to /functions/api/login.js or Worker endpoint
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                // 3. Handle the response coming back from the server
                if (response.ok && data.success) {
                    alert(`Welcome back, ${data.user}!`);
                    // Hide login modal and update dashboard view here if applicable
                } else {
                    // Show error message returned by backend api
                    alert(`Error: ${data.error || 'Invalid login details.'}`);
                }

            } catch (error) {
                console.error("Network connectivity issue:", error);
                alert("Could not reach the authentication servers. Try again later.");
            } finally {
                // Reset button state
                submitBtn.textContent = "Sign In";
                submitBtn.disabled = false;
            }
        });
    }
});