export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class Validator {
  static validate(data: Record<string, any>, rules: ValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const value = data[rule.field];
      const fieldErrors = this.validateField(rule.field, value, rule);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  private static validateField(field: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value
      });
      return errors; // Skip other validations if required field is missing
    }

    // If field is not required and value is empty, skip other validations
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(field, value, rule.type);
      if (typeError) {
        errors.push(typeError);
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters long`,
          value
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must be no more than ${rule.maxLength} characters long`,
          value
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          value
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.min}`,
          value
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} must be no more than ${rule.max}`,
          value
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field,
          message: typeof customResult === 'string' ? customResult : `${field} is invalid`,
          value
        });
      }
    }

    return errors;
  }

  private static validateType(field: string, value: any, type: ValidationRule['type']): ValidationError | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field,
            message: `${field} must be a string`,
            value
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field,
            message: `${field} must be a valid number`,
            value
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field,
            message: `${field} must be a boolean`,
            value
          };
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          return {
            field,
            message: `${field} must be a valid email address`,
            value
          };
        }
        break;

      case 'url':
        try {
          if (typeof value !== 'string') {
            throw new Error('Not a string');
          }
          new URL(value);
        } catch {
          return {
            field,
            message: `${field} must be a valid URL`,
            value
          };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return {
            field,
            message: `${field} must be an object`,
            value
          };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return {
            field,
            message: `${field} must be an array`,
            value
          };
        }
        break;
    }

    return null;
  }

  // Common validation rules
  static rules = {
    email: {
      field: 'email',
      required: true,
      type: 'email' as const
    },
    
    password: {
      field: 'password',
      required: true,
      type: 'string' as const,
      minLength: 8
    },

    name: {
      field: 'name',
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100
    },

    message: {
      field: 'message',
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 10000
    },

    userId: {
      field: 'userId',
      required: true,
      type: 'string' as const,
      minLength: 1
    },

    prompt: {
      field: 'prompt',
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 5000
    }
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JavaScript URLs
    .replace(/on\w+=/gi, ''); // Remove potential event handlers
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
