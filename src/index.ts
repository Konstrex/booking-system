import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { html } from 'hono/html';
import { AvailabilityEndpoint } from './endpoints/booking/availability';
import { BookingEndpoint } from './endpoints/booking/book';

// Create an async function to read the HTML file
async function getBookingHtml() {
  try {
    // In Cloudflare Workers, you would typically serve static files from KV
    // For local development, use a static import or fetch it from your repo
    const response = await fetch('https://raw.githubusercontent.com/Konstrex/booking-system/main/booking.html');
    if (!response.ok) {
      throw new Error(`Failed to fetch booking.html: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading booking HTML:', error);
    return '<h1>Error loading booking page</h1><p>Please try again later.</p>';
  }
}

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/api-docs',
  title: 'Booking API',
  description: 'API for booking appointments',
  version: '1.0.0',
});

// Register booking API endpoints
openapi.post('/api/availability', AvailabilityEndpoint);
openapi.post('/api/book', BookingEndpoint);

// Serve booking.html at the root endpoint
app.get('/', async (c) => {
  const bookingHtml = await getBookingHtml();
  return c.html(bookingHtml);
});

// Serve booking.html at the /booking endpoint as well
app.get('/booking', async (c) => {
  const bookingHtml = await getBookingHtml();
  return c.html(bookingHtml);
});

// Health check endpoint
app.get('/health-check', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Export the Hono app
export default app;