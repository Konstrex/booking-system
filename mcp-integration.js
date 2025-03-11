/**
 * MCP Server Integration Module for Booking System
 * This module handles communication with MCP servers for various booking events
 */

class MCPIntegration {
  constructor(env) {
    this.enabled = env?.MCP_ENABLED === 'true' || false;
    this.serverUrl = env?.MCP_SERVER_URL || '';
    this.apiKey = env?.MCP_API_KEY || '';
    this.initialized = this.enabled && this.serverUrl && this.apiKey;
  }

  /**
   * Notify MCP server about a booking creation event
   * @param {Object} bookingData - The booking data
   * @returns {Promise<Object>} - Response from MCP server
   */
  async notifyBookingCreated(bookingData) {
    return this.sendNotification('booking_created', bookingData);
  }

  /**
   * Notify MCP server about an email sent event
   * @param {Object} emailData - The email data
   * @returns {Promise<Object>} - Response from MCP server
   */
  async notifyEmailSent(emailData) {
    return this.sendNotification('email_sent', emailData);
  }

  /**
   * Notify MCP server about a calendar event creation
   * @param {Object} calendarData - The calendar event data
   * @returns {Promise<Object>} - Response from MCP server
   */
  async notifyCalendarEventCreated(calendarData) {
    return this.sendNotification('calendar_event_created', calendarData);
  }

  /**
   * Notify MCP server about an availability check
   * @param {Object} availabilityData - The availability check data
   * @returns {Promise<Object>} - Response from MCP server
   */
  async notifyAvailabilityCheck(availabilityData) {
    return this.sendNotification('availability_check', availabilityData);
  }

  /**
   * Send a notification to the MCP server
   * @param {string} eventType - The type of event
   * @param {Object} data - The data to send
   * @returns {Promise<Object>} - Response from MCP server
   */
  async sendNotification(eventType, data) {
    if (!this.initialized) {
      console.log(`[MCP] Integration disabled or not configured. Skipping ${eventType} notification.`);
      return { success: false, message: 'MCP integration not enabled' };
    }

    try {
      console.log(`[MCP] Sending ${eventType} notification to MCP server`);
      
      const response = await fetch(`${this.serverUrl}/api/booking-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          eventType,
          timestamp: new Date().toISOString(),
          data
        })
      });

      const responseData = await response.json();
      console.log(`[MCP] Notification sent successfully:`, responseData);
      return { success: true, data: responseData };
    } catch (error) {
      console.error(`[MCP] Error sending notification:`, error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = { MCPIntegration };