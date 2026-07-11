using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class AppException : Exception
    {
        public int StatusCode { get; }
        public string Code { get; }
        public bool IsOperational { get; } = true;

        public AppException(string message, int statusCode, string code)
            : base(message)
        {
            StatusCode = statusCode;
            Code = code;
        }
    }

    public class BadRequestException : AppException
    {
        public BadRequestException(string message = "Bad request")
            : base(message, 400, "BAD_REQUEST") { }
    }

    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message = "Unauthorized")
            : base(message, 401, "UNAUTHORIZED") { }
    }

    public class ForbiddenException : AppException
    {
        public ForbiddenException(string message = "Forbidden")
            : base(message, 403, "FORBIDDEN") { }
    }

    public class NotFoundException : AppException
    {
        public NotFoundException(string message = "Resource not found")
            : base(message, 404, "NOT_FOUND") { }
    }

    // Added
    public class MethodNotAllowedException : AppException
    {
        public MethodNotAllowedException(string message = "Method not allowed")
            : base(message, 405, "METHOD_NOT_ALLOWED") { }
    }

    // Added
    public class NotAcceptableException : AppException
    {
        public NotAcceptableException(string message = "Not acceptable")
            : base(message, 406, "NOT_ACCEPTABLE") { }
    }

    // Added
    public class RequestTimeoutException : AppException
    {
        public RequestTimeoutException(string message = "Request timeout")
            : base(message, 408, "REQUEST_TIMEOUT") { }
    }

    public class ConflictException : AppException
    {
        public ConflictException(string message = "Resource already exists")
            : base(message, 409, "CONFLICT") { }
    }

    // Added
    public class PayloadTooLargeException : AppException
    {
        public PayloadTooLargeException(string message = "Payload too large")
            : base(message, 413, "PAYLOAD_TOO_LARGE") { }
    }

    // Added
    public class UnsupportedMediaTypeException : AppException
    {
        public UnsupportedMediaTypeException(string message = "Unsupported media type")
            : base(message, 415, "UNSUPPORTED_MEDIA_TYPE") { }
    }

    public class ValidationException : AppException
    {
        public Dictionary<string, string[]> Errors { get; }

        public ValidationException(
            string message = "Validation failed",
            Dictionary<string, string[]>? errors = null)
            : base(message, 422, "VALIDATION_ERROR")
        {
            Errors = errors ?? new Dictionary<string, string[]>();
        }
    }

    // Added
    public class BusinessRuleException : AppException
    {
        public BusinessRuleException(string message)
            : base(message, 422, "BUSINESS_RULE_ERROR") { }
    }

    // Added
    public class TooManyRequestsException : AppException
    {
        public TooManyRequestsException(string message = "Too many requests")
            : base(message, 429, "TOO_MANY_REQUESTS") { }
    }

    public class InternalException : AppException
    {
        public InternalException(string message = "Internal server error")
            : base(message, 500, "INTERNAL_ERROR") { }
    }

    // Added
    public class DatabaseException : AppException
    {
        public DatabaseException(string message = "Database operation failed")
            : base(message, 500, "DATABASE_ERROR") { }
    }

    // Added
    public class ExternalServiceException : AppException
    {
        public ExternalServiceException(string message = "External service error")
            : base(message, 500, "EXTERNAL_SERVICE_ERROR") { }
    }

    // Added
    public class NotImplementedApiException : AppException
    {
        public NotImplementedApiException(string message = "Feature not implemented")
            : base(message, 501, "NOT_IMPLEMENTED") { }
    }

    // Added
    public class ServiceUnavailableException : AppException
    {
        public ServiceUnavailableException(string message = "Service unavailable")
            : base(message, 503, "SERVICE_UNAVAILABLE") { }
    }

    // Added
    public class GatewayTimeoutException : AppException
    {
        public GatewayTimeoutException(string message = "Gateway timeout")
            : base(message, 504, "GATEWAY_TIMEOUT") { }
    }
}