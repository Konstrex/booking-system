import { OpenAPIRoute, ValidationError } from 'chanfana';
import { z } from 'zod';
import { MCPIntegration } from '../../../mcp-integration';

// Define the Service interface to match expected structure
interface Service {
  name: string;
  duration: number;
  price: number;
}

// Define the BookingData interface to ensure type safety
interface BookingData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  services: Service[];
  notes?: string;
  eventId?: string;
  agreed?: boolean;
}

export class BookingEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Booking'],
    summary: 'Create a new booking',
    description: 'Creates a new booking and sends confirmation emails',
    requestBody: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2, 'Name is required'),
            email: z.string().email('Valid email is required'),
            phone: z.string().min(5, 'Phone number is required'),
            date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
              message: 'Date must be in YYYY-MM-DD format',
            }),
            time: z.string().refine((val) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
              message: 'Time must be in HH:MM format',
            }),
            services: z.array(z.string()).min(1, 'At least one service must be selected'),
            notes: z.string().optional(),
            agreed: z.boolean().refine((val) => val === true, {
              message: 'You must agree to the terms',
            }),
          }),
        },
      },
    },
    responses: {
      '200': {
        description: 'Booking created successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              bookingId: z.string().optional(),
            }),
          },
        },
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
      '500': {
        description: 'Server error',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    try {
      // Initialize MCP integration
      const mcpIntegration = new MCPIntegration(c.env);
      console.log(`MCP Integration initialized: ${mcpIntegration.initialized}`);

      // Extract validated data from request
      const validatedData = c.req.valid('json');
      
      // Get default services from environment
      const defaultServices = this.getDefaultServices(c.env);
      
      // Map service names to full service objects
      const serviceObjects = validatedData.services.map(serviceName => {
        const service = defaultServices.find(s => s.name === serviceName);
        if (!service) {
          throw new Error(`Service "${serviceName}" not found`);
        }
        return service;
      });
      
      // Create booking data object with proper structure
      const bookingData: BookingData = {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        date: validatedData.date,
        time: validatedData.time,
        services: serviceObjects,
        notes: validatedData.notes,
        agreed: validatedData.agreed
      };

      // Create booking steps
      const bookingResult = await this.createBooking(bookingData, c.env, mcpIntegration);
      const bookingWithEventId = bookingResult.booking;
      const bookingId = this.generateBookingId(bookingData);

      // Notify MCP server about booking creation
      try {
        await mcpIntegration.notifyBookingCreated({
          ...bookingWithEventId,
          bookingId,
          timestamp: new Date().toISOString(),
          ip: c.req.headers.get('CF-Connecting-IP') || 'unknown'
        });
      } catch (error) {
        console.error('Failed to notify MCP server about booking creation:', error);
        // Continue with booking process even if MCP notification fails
      }

      // Send confirmation emails
      try {
        await this.sendBookingEmails(bookingWithEventId, c.env, mcpIntegration);
      } catch (error) {
        console.error('Failed to send confirmation emails:', error);
        // Continue and return success even if email sending fails
      }

      return c.json({
        success: true,
        message: 'Booking created successfully',
        bookingId,
      });
    } catch (error) {
      console.error('Error creating booking:', error);

      if (error instanceof ValidationError) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to create booking',
        },
        500
      );
    }
  }

  private async createBooking(bookingData: BookingData, env, mcpIntegration) {
    console.log('Creating booking:', JSON.stringify(bookingData));
    
    // This is a mock implementation
    // In a real implementation, you would save to a database and create calendar events
    
    // Mock creating a Google Calendar event
    const eventId = `event_${Date.now()}`;
    
    const bookingWithEventId = {
      ...bookingData,
      eventId,
    };
    
    // Notify MCP about calendar event creation
    try {
      await mcpIntegration.notifyCalendarEventCreated({
        eventId,
        date: bookingData.date,
        time: bookingData.time,
        clientName: bookingData.name,
        services: bookingData.services.map(s => s.name).join(', ')
      });
    } catch (error) {
      console.error('Failed to notify MCP server about calendar event:', error);
    }
    
    return {
      success: true,
      booking: bookingWithEventId,
    };
  }

  private async sendBookingEmails(bookingData: BookingData, env, mcpIntegration) {
    console.log('Sending confirmation emails for booking:', JSON.stringify(bookingData));
    
    // This is a mock implementation
    // In a real implementation, you would use an email service
    
    // Notify MCP about email sending
    try {
      await mcpIntegration.notifyEmailSent({
        recipient: bookingData.email,
        subject: 'Booking Confirmation',
        timestamp: new Date().toISOString(),
        status: 'sent'
      });
    } catch (error) {
      console.error('Failed to notify MCP server about email sending:', error);
    }
    
    return {
      success: true,
    };
  }

  private generateBookingId(bookingData: BookingData) {
    // Create a unique booking ID based on customer name and timestamp
    const timestamp = Date.now();
    const namePart = bookingData.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    return `BK-${namePart}-${timestamp.toString().substring(timestamp.toString().length - 6)}`;
  }

  private getDefaultServices(env): Service[] {
    // In a real implementation, you would get this from configuration or database
    return [
      {
        name: 'Massage',
        duration: 60,
        price: 80
      },
      {
        name: 'Gesichtsbehandlung',
        duration: 45,
        price: 65
      },
      {
        name: 'Maniküre',
        duration: 30,
        price: 40
      }
    ];
  }
}