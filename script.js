document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.start-scanning-btn');
    
    // Add ripple effect on click
    startButton.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        // Position the ripple at the click location
        const rect = this.getBoundingClientRect();
        ripple.style.left = e.clientX - rect.left + 'px';
        ripple.style.top = e.clientY - rect.top + 'px';
        
        this.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => ripple.remove(), 1000);
    });
    
    // Add hover sound effect
    startButton.addEventListener('mouseenter', () => {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        audio.play().catch(() => {}); // Ignore errors if sound is blocked
    });
    
    // Add magnetic effect
    startButton.addEventListener('mousemove', (e) => {
        const rect = startButton.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        startButton.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });
    
    startButton.addEventListener('mouseleave', () => {
        startButton.style.transform = 'translate(0, 0)';
    });
}); 