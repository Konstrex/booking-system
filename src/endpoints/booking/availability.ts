import { OpenAPIRoute, Path, ValidationError } from 'chanfana';
import { z } from 'zod';
import { MCPIntegration } from '../../../mcp-integration';

export class AvailabilityEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Booking'],
    summary: 'Check availability for a given date',
    description: 'Returns available time slots for a specific date',
    requestBody: {
      content: {
        'application/json': {
          schema: z.object({
            date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
              message: 'Date must be in YYYY-MM-DD format',
            }),
            duration: z.number().positive().default(60),
          }),
        },
      },
    },
    responses: {
      '200': {
        description: 'Available time slots',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              availableSlots: z.array(
                z.object({
                  startTime: z.string(),
                  endTime: z.string(),
                })
              ),
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
      const { date, duration } = c.req.valid('json');

      // Notify MCP server about availability check
      const notifyMCPServer = async () => {
        try {
          await mcpIntegration.notifyAvailabilityCheck({ 
            date, 
            duration,
            timestamp: new Date().toISOString(),
            ip: c.req.headers.get('CF-Connecting-IP') || 'unknown'
          });
        } catch (error) {
          console.error('Failed to notify MCP server:', error);
          // Continue with availability check even if MCP notification fails
        }
      };

      // Start MCP notification (don't await - run in background)
      notifyMCPServer();

      // Mock availability data for now
      // In a real implementation, you would check a database or calendar API
      const availableSlots = generateAvailableSlots(date, duration);

      return c.json({
        success: true,
        availableSlots,
      });
    } catch (error) {
      console.error('Error checking availability:', error);

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
          error: 'Failed to check availability',
        },
        500
      );
    }
  }
}

function generateAvailableSlots(date, duration) {
  // This is a mock function - replace with actual availability logic
  const slots = [];
  const workStartHour = 9; // 9 AM
  const workEndHour = 17; // 5 PM
  const appointmentDurationHours = duration / 60;
  
  for (let hour = workStartHour; hour < workEndHour; hour += appointmentDurationHours) {
    const startHour = Math.floor(hour);
    const startMinute = (hour - startHour) * 60;
    
    const endHour = Math.floor(hour + appointmentDurationHours);
    const endMinute = ((hour + appointmentDurationHours) - endHour) * 60;
    
    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    slots.push({
      startTime,
      endTime,
    });
  }
  
  return slots;
}