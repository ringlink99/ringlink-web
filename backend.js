document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    //  SUPABASE BACKEND LOGIC
    // ==========================================

    // Your Supabase Function URL
    const API_URL = "https://qptiepgdqhuimxfpswqn.supabase.co/functions/v1/send-email";

    // Helper: Send Data
    async function sendToSupabase(data) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error sending data');
            return true;
        } catch (error) {
            console.error("Submission error:", error);
            alert("Something went wrong. Please try again.");
            return false;
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

            const success = await sendToSupabase({
                email: emailInput.value,
                type: 'waitlist'
            });

            if (success) {
                if (successMessage) {
                    waitlistForm.classList.add('hidden');
                    successMessage.classList.remove('hidden');
                } else {
                    btn.textContent = "Joined!";
                    btn.style.background = "#2F9E44"; // Green
                    btn.style.color = "white";
                }
                emailInput.value = "";

                // Track Event in PostHog (Optional)
                if (typeof posthog !== 'undefined') posthog.capture('joined_waitlist');
            } else {
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

            const success = await sendToSupabase({
                type: 'contact',
                email: email,
                name: `${firstName} ${lastName}`,
                subject: subject,
                message: message
            });

            if (success) {
                btn.textContent = "Sent!";
                btn.style.background = "#2F9E44";
                contactForm.reset();

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = "";
                    btn.disabled = false;
                }, 3000);
            } else {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});