import { guestsList } from './guests.js';

// Toast notification function
function showToast(message, duration = 5000) {
    // Remove existing toast if present
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// Get a random guest name from the list
function getRandomGuestName() {
    const randomIndex = Math.floor(Math.random() * guestsList.length);
    return guestsList[randomIndex].name;
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const guestForm = document.getElementById('guestForm');

    if (guestForm) {
        guestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get main attendee name (not required, so we'll use a default if empty)
            const mainAttendee = document.body.innerText.includes('Confirm Your Attendance') ? 'You' : 'You';

            // Get guest info
            const guest1Name = document.getElementById('guest1').value || 'Guest 1';
            const guest1Phone = document.getElementById('guest1-phone').value;
            const guest2Name = document.getElementById('guest2').value || 'Guest 2';
            const guest2Phone = document.getElementById('guest2-phone').value;

            // Get a random guest from the list for personalized message
            const randomGuest = getRandomGuestName();

            // Build personalized message
            let message = `Shooting a text to see if they're on board...`;

            if (guest1Phone && guest2Phone) {
                message = `Texting ${guest1Name} and ${guest2Name}! They're about to get the invite. 🎉`;
            } else if (guest1Phone) {
                message = `Texting ${guest1Name}! Time to get them hyped up for the celebration! 🎊`;
            } else if (guest2Phone) {
                message = `Texting ${guest2Name}! Let's see if they're ready to party! 🎉`;
            } else {
                message = `Yooo! ${randomGuest} is gonna love this! Texting the crew now... 🚀`;
            }

            // Show personalized toast
            showToast(message);

            // Reset form
            guestForm.reset();

            console.log('Attendance confirmed with guests:', {
                guest1: { name: guest1Name, phone: guest1Phone },
                guest2: { name: guest2Name, phone: guest2Phone }
            });
        });
    }
});
