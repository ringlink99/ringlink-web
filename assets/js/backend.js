document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    //  SUPABASE BACKEND LOGIC
    // ==========================================

    // Your Supabase Function URL
    const API_URL = "https://qptiepgdqhuimxfpswqn.supabase.co/functions/v1/send-email";

    // Helper: Show Liquid Alert
    function showLiquidAlert(message, type = 'info') {
        let container = document.querySelector('.liquid-alert-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'liquid-alert-container';
            document.body.appendChild(container);
        }

        const alert = document.createElement('div');
        alert.className = `liquid-alert ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        alert.innerHTML = `
            <span class="liquid-alert-icon">${icons[type] || '•'}</span>
            <span class="liquid-alert-message">${message}</span>
        `;

        container.appendChild(alert);

        // Auto-remove
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 400);
        }, 4000);
    }

    // Helper: Send Data
    async function sendToSupabase(data) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                // Return the error message from the server if available
                return { success: false, error: result.error || 'Error sending data' };
            }
            return { success: true };
        } catch (error) {
            console.error("Submission error:", error);
            return { success: false, error: "Something went wrong. Please try again." };
        }
    }

    // 1. Waitlist Form Handling
    const waitlistForm = document.getElementById('hero-waitlist-form') || document.getElementById('waitlist-form');

    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = waitlistForm.querySelector('button');
            const emailInput = waitlistForm.querySelector('input[type="email"]');
            const successMessage = document.getElementById('success-message');
            const originalText = btn.textContent;

            // Loading State
            btn.textContent = "Joining...";
            btn.disabled = true;

            const result = await sendToSupabase({
                email: emailInput.value,
                type: 'waitlist'
            });

            if (result.success) {
                showLiquidAlert("Successfully joined the waitlist!", "success");

                // Keep "Joined!" state for 3 seconds then reset
                const prevBg = btn.style.background;
                const prevColor = btn.style.color;

                btn.textContent = "Joined!";
                btn.style.background = "#2F9E44"; // Green
                btn.style.color = "white";
                emailInput.value = "";

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = prevBg;
                    btn.style.color = prevColor;
                    btn.disabled = false;

                    // If we used a success message overlay, we could optionally show the form again here
                    // but for now we follow the button reset logic requested.
                }, 3000);

                if (typeof posthog !== 'undefined') posthog.capture('joined_waitlist');
            } else {
                // Show specific error (e.g., "already on the list")
                showLiquidAlert(result.error, "error");
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // 2. Contact Form Handling
    const contactForm = document.querySelector('.contact-form-card');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.textContent;

            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            // Loading State
            btn.textContent = "Sending...";
            btn.disabled = true;

            const result = await sendToSupabase({
                type: 'contact',
                email: email,
                name: `${firstName} ${lastName}`,
                subject: subject,
                message: message
            });

            if (result.success) {
                showLiquidAlert("Message sent successfully!", "success");
                btn.textContent = "Sent!";
                btn.style.background = "#2F9E44";
                contactForm.reset();

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = "";
                    btn.disabled = false;
                }, 3000);
            } else {
                showLiquidAlert(result.error, "error");
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});