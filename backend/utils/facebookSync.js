/**
 * Facebook Events Integration
 * Import events from Facebook using Graph API
 */

const axios = require('axios');
const oauthConfig = require('../config/oauth');

/**
 * Fetch Facebook events for authenticated user
 * @param {string} accessToken - Facebook OAuth access token
 * @returns {Promise<Array>} - Array of events
 */
async function fetchFacebookEvents(accessToken) {
  try {
    const { apiUrl } = oauthConfig.facebook;
    
    // Fetch user's events
    const response = await axios.get(`${apiUrl}/me/events`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        fields: 'id,name,description,start_time,end_time,place,attending_count,cover,is_online',
        limit: 100,
      },
    });

    const facebookEvents = response.data.data || [];
    
    // Convert Facebook events to our format
    const convertedEvents = facebookEvents.map(fbEvent => convertFacebookEvent(fbEvent));
    
    return convertedEvents;
  } catch (error) {
    console.error('Facebook Events fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Facebook events');
  }
}

/**
 * Fetch a single Facebook event by ID
 * @param {string} eventId - Facebook event ID
 * @param {string} accessToken - Facebook OAuth access token
 * @returns {Promise<Object>} - Event object
 */
async function fetchFacebookEvent(eventId, accessToken) {
  try {
    const { apiUrl } = oauthConfig.facebook;
    
    const response = await axios.get(`${apiUrl}/${eventId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        fields: 'id,name,description,start_time,end_time,place,attending_count,cover,is_online,ticket_uri',
      },
    });

    return convertFacebookEvent(response.data);
  } catch (error) {
    console.error('Facebook Event fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Facebook event');
  }
}

/**
 * Convert Facebook event format to our internal format
 */
function convertFacebookEvent(fbEvent) {
  const startDate = new Date(fbEvent.start_time);
  const endDate = fbEvent.end_time ? new Date(fbEvent.end_time) : null;
  
  return {
    title: fbEvent.name,
    description: fbEvent.description || '',
    date: formatDate(startDate),
    startTime: formatTime(startDate),
    endTime: endDate ? formatTime(endDate) : '',
    location: fbEvent.place?.name || (fbEvent.is_online ? 'Online' : ''),
    isAllDay: !fbEvent.start_time.includes('T'),
    attendees: [],
    reminders: ['1hour', '1day'],
    recurring: 'none',
    timezone: 'UTC',
    color: '#1877f2', // Facebook blue
    visibility: 'public',
    availability: 'busy',
    source: 'facebook',
    externalId: fbEvent.id,
    meta: {
      attendingCount: fbEvent.attending_count || 0,
      coverImage: fbEvent.cover?.source || null,
      ticketUrl: fbEvent.ticket_uri || null,
      isOnline: fbEvent.is_online || false,
    },
  };
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

module.exports = {
  fetchFacebookEvents,
  fetchFacebookEvent,
  convertFacebookEvent,
};
