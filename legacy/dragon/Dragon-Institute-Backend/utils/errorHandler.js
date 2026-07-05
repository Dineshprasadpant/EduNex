// Factory function to create custom errors
const createError = (name, statusCode, defaultMessage) => {
    return (message = defaultMessage) => {
      const error = new Error(message);
      error.name = name;
      error.statusCode = statusCode;
      return error;
    };
  };
  
  // Specific error creators
  export const NotFoundError = createError('NotFoundError', 404, 'Resource not found');
  export const ValidationError = createError('ValidationError', 400, 'Invalid input data');
  
  // General error handler
  export const handleError = (err, res) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      success: false,
      error: message
    });
  };
  
  // Usage example:
  // throw createNotFoundError('Exam not found');
  // throw createValidationError('Invalid exam ID format');