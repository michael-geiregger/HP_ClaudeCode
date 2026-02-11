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

        return `
            <div class="event-card reveal" style="--i: ${index}">
                ${imageUrl ? `<div class="event-image" style="margin-bottom: 20px; border-radius: 16px; overflow: hidden;"><img src="${imageUrl}" alt="${event.name.text}" style="width: 100%; height: 220px; object-fit: cover; display: block;"></div>` : ''}
                <div class="event-date">
                    <div class="day">${startDate.getDate()}</div>
                    <div class="month">${startDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}</div>
                </div>
                <div class="event-info">
                    <h3>${event.name.text}</h3>
                    <p>${event.description.text ? truncateText(event.description.text, 180) : ''}</p>
                    <div class="event-meta" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; font-size: 0.85rem; color: var(--color-text-muted);">
                        <span style="display: flex; align-items: center; gap: 5px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            ${timeString} Uhr
                        </span>
                        ${event.venue ? `<span style="display: flex; align-items: center; gap: 5px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${event.venue.name}
                        </span>` : ''}
                    </div>
                </div>
                <a href="${event.url}" target="_blank" rel="noopener" class="btn btn-primary">
                    Platz sichern
                    <span class="btn-arrow">&rarr;</span>
                </a>
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

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('event-container');
    if (container) {
        const events = await fetchEvents();
        renderEvents(events);
    }
});
