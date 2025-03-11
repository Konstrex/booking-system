# Booking System

A booking system with Cloudflare Workers integration for appointment scheduling, email confirmations, Google Calendar integration, and MCP Server communication.

## Features

- Availability checking endpoint
- Booking creation endpoint
- Email confirmation sending
- Google Calendar event creation
- MCP Server integration for event notifications

## Setup

### Environment Variables

#### Google Calendar Integration
- `GOOGLE_CLIENT_EMAIL` - Google service account client email
- `GOOGLE_PRIVATE_KEY` - Google service account private key
- `GOOGLE_CALENDAR_ID` - Google Calendar ID

#### Email Configuration
- `EMAIL_FROM` - Email address to send confirmations from
- `BUSINESS_NAME` - Name of the business for email templates
- `BUSINESS_EMAIL` - Business email for reply-to

#### MCP Server Integration
- `MCP_ENABLED` - Set to 'true' to enable MCP integration
- `MCP_SERVER_URL` - URL of the MCP server
- `MCP_API_KEY` - API key for authenticating with the MCP server

## API Endpoints

### Check Availability
`POST /api/availability`

Request body:
```json
{
  "date": "2025-03-15",
  "duration": 60
}
```

### Book Appointment
`POST /api/book`

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date": "2025-03-15",
  "time": "10:00",
  "services": [{
    "name": "Massage",
    "duration": 60,
    "price": 80
  }],
  "notes": "Optional notes",
  "agreed": true
}
```

## MCP Integration

The system uses MCP Servers to track and process important booking events:

1. **Booking Creation**: Notifies when a new booking is created
2. **Email Confirmation**: Notifies when confirmation emails are sent
3. **Calendar Event**: Notifies when Google Calendar events are created
4. **Availability Checks**: Notifies when availability is checked

Each notification includes comprehensive data about the event, allowing MCP Servers to track the booking lifecycle and integrate with other systems.

## Deployment

This project is designed to be deployed to Cloudflare Workers. The booking interface is served directly from the worker, and the API endpoints handle the booking functionality.

### Deploying to Cloudflare

1. Set up required environment variables in Cloudflare
2. Deploy the worker using Wrangler or the Cloudflare dashboard
3. Test the booking system by navigating to the worker URL