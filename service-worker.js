const CACHE_NAME = 'time-elapsed-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  'https://cdn.jsdelivr.net/npm/date-fns@2.30.0/index.min.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Time to check your elapsed time!',
    icon: data.icon || 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15/svgs/regular/clock.svg',
    badge: data.badge || 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15/svgs/solid/stopwatch.svg'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Time Elapsed Reminder', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'scheduleNotification') {
    const { title, body, when } = event.data;
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15/svgs/regular/clock.svg'
      });
    }, when - Date.now());
  }
});
