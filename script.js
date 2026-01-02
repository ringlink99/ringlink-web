document.addEventListener('DOMContentLoaded', () => {

    // Intro Loader
    const loader = document.getElementById('intro-loader');
    const hasSeenLoader = sessionStorage.getItem('hasSeenLoader');

    if (loader) {
        if (hasSeenLoader) {
            loader.remove();
        } else {
            // Prevent scroll on load
            document.body.style.overflow = 'hidden';

            // Timer to match animation duration (approx 2s total now)
            setTimeout(() => {
                loader.classList.add('fade-out');
                document.body.style.overflow = '';
                sessionStorage.setItem('hasSeenLoader', 'true');

                // Remove from DOM after fade transition
                setTimeout(() => {
                    loader.remove();
                }, 550);
            }, 2200); // Extended time for smoother look
        }
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Scroll Animations (IntersectionObserver)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Initial check for elements already in view
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Special Observer for Text Reveal (Threshold 0.35)
    const textSection = document.querySelector('.problem-section');
    if (textSection) {
        // Remove from general observer to avoid double trigger with wrong threshold
        observer.unobserve(textSection);

        const textObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    textObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.35, rootMargin: "0px" });

        textObserver.observe(textSection);
    }

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            // Close other items (optional - currently allowing multiple open)
            // faqItems.forEach(otherItem => {
            //     if (otherItem !== item) otherItem.classList.remove('active');
            // });

            item.classList.toggle('active');
        });
    });
    // Team Statement "Wave of Color" Animation
    const teamStatement = document.querySelector('.team-statement');
    if (teamStatement) {
        const text = teamStatement.innerText;
        teamStatement.innerHTML = text.split('').map((char, index) => {
            if (char === ' ') return ' '; // Keep spaces as is
            // Handle line breaks (innerText usually converts <br> to \n)
            if (char === '\n') return '<br>';
            return `<span style="--i:${index}">${char}</span>`;
        }).join('');
    }
});
