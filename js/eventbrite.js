/**
 * Eventbrite Integration for Michael Geiregger Website
 * Fetches live events from Eventbrite and renders them dynamically.
 */

const EVENTBRITE_CONFIG = {
    PRIVATE_TOKEN: 'N75POTQOTC5J5URPAW7V',
    ORG_ID: '239725805730'
};

async function fetchEvents() {
    const url = `https://www.eventbriteapi.com/v3/organizations/${EVENTBRITE_CONFIG.ORG_ID}/events/?status=live&order_by=start_asc&expand=venue`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${EVENTBRITE_CONFIG.PRIVATE_TOKEN}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_description || 'Failed to fetch events');
        }

        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching Eventbrite events:', error);
        return [];
    }
}

function renderEvents(events) {
    const container = document.getElementById('event-container');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="reveal" style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--color-warm-white); border-radius: 2rem;">
                <p style="font-size: 1.05rem; color: var(--color-text-light); margin-bottom: 1.5rem;">Aktuell sind keine öffentlichen Events geplant. Schau bald wieder vorbei oder kontaktiere mich direkt!</p>
                <a href="kontakt.html" class="btn btn-primary">Kontakt aufnehmen <span class="btn-arrow">&rarr;</span></a>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map((event, index) => {
        const startDate = new Date(event.start.local);
        const dateString = startDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const timeString = startDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const imageUrl = event.logo ? event.logo.original.url : '';
        const venueName = event.venue ? event.venue.name : '';
        const venueCity = event.venue && event.venue.address ? event.venue.address.city : '';
        const locationStr = [venueName, venueCity].filter(Boolean).join(', ');

        return `
            <div class="vision-block reveal" style="--i: ${index}">
                <div class="vision-number">${(index + 1).toString().padStart(2, '0')}</div>
                <div class="event-block-content">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${event.name.text}" class="event-block-image">` : ''}
                    <h3>${event.name.text}</h3>
                    <div class="event-meta">
                        <span>📅 ${dateString}</span>
                        <span>⏰ ${timeString} Uhr</span>
                        ${locationStr ? `<span>📍 ${locationStr}</span>` : ''}
                    </div>
                    <p>${event.description.text ? truncateText(event.description.text, 200) : ''}</p>
                    <a href="${event.url}" target="_blank" rel="noopener" class="btn btn-outline">
                        Platz sichern <span class="btn-arrow">&rarr;</span>
                    </a>
                </div>
            </div>
        `;
    }).join('');

    // Re-observe for scroll reveal animations
    if (window.revealObserver) {
        container.querySelectorAll('.reveal').forEach(el => {
            window.revealObserver.observe(el);
        });
    }
}

function truncateText(text, length) {
    if (text.length <= length) return text;
    const truncated = text.substring(0, length);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated).trim() + '...';
}

// Run immediately if DOM is already ready, otherwise wait
async function initEvents() {
    const container = document.getElementById('event-container');
    if (container) {
        try {
            const events = await fetchEvents();
            renderEvents(events);
        } catch (err) {
            console.error('Eventbrite init error:', err);
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;"><p>Events konnten nicht geladen werden.</p></div>';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
} else {
    initEvents();
}
