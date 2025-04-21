document.addEventListener('DOMContentLoaded', function() {
    // Reference date: August 11, 2006
    const referenceDate = new Date(2006, 7, 11); // Month is 0-indexed
    
    // DOM elements
    const yearsElement = document.getElementById('years');
    const monthsElement = document.getElementById('months');
    const daysElement = document.getElementById('days');
    const totalDaysElement = document.getElementById('totalDays');
    const currentDateElement = document.getElementById('currentDate');
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationStatus = document.getElementById('notificationStatus');
    
    // Load notification preference from local storage
    notificationToggle.checked = localStorage.getItem('notificationsEnabled') === 'true';
    
    // Update the elapsed time
    function updateElapsedTime() {
        const today = new Date();
        currentDateElement.textContent = `As of ${today.toLocaleDateString()}`;
        
        // Calculate years, months, and days
        let years = today.getFullYear() - referenceDate.getFullYear();
        let months = today.getMonth() - referenceDate.getMonth();
        let days = today.getDate() - referenceDate.getDate();
        
        // Adjust for negative months or days
        if (months < 0 || (months === 0 && days < 0)) {
            years--;
            months += 12;
        }
        
        if (days < 0) {
            // Get days in the previous month
            const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += previousMonth.getDate();
            months--;
        }
        
        // Calculate total days using date-fns if available, otherwise fallback to manual calculation
        let totalDays;
        if (window.dateFns) {
            totalDays = dateFns.differenceInDays(today, referenceDate);
        } else {
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            totalDays = Math.round(Math.abs((today - referenceDate) / oneDay));
        }
        
        // Update the DOM
        yearsElement.textContent = years;
        monthsElement.textContent = months;
        daysElement.textContent = days;
        totalDaysElement.textContent = totalDays;
        
        return { years, months, days, totalDays };
    }
    
    // Initialize and update the display
    const elapsedTime = updateElapsedTime();
    
    // Handle notifications
    function handleNotifications() {
        if (!('Notification' in window)) {
            notificationStatus.textContent = 'Notifications not supported in this browser.';
            notificationToggle.disabled = true;
            return;
        }
        
        notificationToggle.addEventListener('change', function() {
            if (this.checked) {
                // Request permission
                Notification.requestPermission().then(function(permission) {
                    if (permission === 'granted') {
                        localStorage.setItem('notificationsEnabled', 'true');
                        notificationStatus.textContent = 'Daily reminders enabled.';
                        
                        // Register service worker for notifications
                        registerServiceWorker();
                    } else {
                        notificationToggle.checked = false;
                        localStorage.setItem('notificationsEnabled', 'false');
                        notificationStatus.textContent = 'Permission denied for notifications.';
                    }
                });
            } else {
                localStorage.setItem('notificationsEnabled', 'false');
                notificationStatus.textContent = 'Daily reminders disabled.';
                
                // Unregister service worker if possible
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for (let registration of registrations) {
                            registration.unregister();
                        }
                    });
                }
            }
        });
        
        // Update status text based on current setting
        if (notificationToggle.checked) {
            notificationStatus.textContent = 'Daily reminders enabled.';
            registerServiceWorker();
        } else {
            notificationStatus.textContent = 'Daily reminders disabled.';
        }
    }
    
    // Register service worker for notifications
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(function(registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                    
                    // Schedule the first notification for the next day
                    scheduleNotification();
                })
                .catch(function(error) {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }
    
    // Schedule notification for the next day
    function scheduleNotification() {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0); // 9 AM tomorrow
        
        const timeUntilNotification = tomorrow - now;
        
        // Schedule the notification
        setTimeout(function() {
            const { years, months, days, totalDays } = updateElapsedTime();
            
            // Create notification
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(function(registration) {
                    registration.showNotification('Time Elapsed Reminder', {
                        body: `${years} years, ${months} months, ${days} days (${totalDays} total days) have passed since August 11, 2006.`,
                        icon: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15/svgs/regular/clock.svg'
                    });
                });
            }
        }, timeUntilNotification);
    }
    
    // Call the notifications handler
    handleNotifications();
    
    // Refresh every minute
    setInterval(updateElapsedTime, 60000);
});
