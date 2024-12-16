/**
 * @typedef {object} Logger
 * @property {"warn"|"error"} variant - The type of log entry.
 * @property {string} category
 * @property {string} code
 * @property {string} context
 * @property {string | undefined} message
 */

class ApiError extends Error {
  /**
   * Creates an ApiError instance.
   * @param {number} [statusCode=500] - HTTP status code for the error.
   * @param {string} [message="An error occurred"] - Error message.
   * @param {object|null} [error=null] - Detailed error type (e.g., "validation", "authentication").
   * @param {object|null} [data=null] - Additional error-related data.
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode = 500,
    message = "An error occurred",
    error = null,
    data = null,
    logger = null
  ) {
    super(message);
    this.name = "Api call error";
    this.statusCode = statusCode;
    this.error = error;
    this.data = data;
    this.logger = logger;
  }
}

class ValidationError extends ApiError {
  /**
   * Creates a ValidationError instance.
   * @param {number} [statusCode=400] - HTTP status code for the error.
   * @param {string} [message="Invalid property provided"] - Error message.
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(statusCode = 400, message = "Validation failure", logger = null) {
    super(statusCode, message, null, null, logger);
    this.name = "Validation error";
  }
}

class FS_Error extends ApiError {
  /**
   * Creates an FS_Error instance.
   * @param {number} [statusCode=500] - HTTP status code for the error.
   * @param {string} [message="File system error"] - Error message.
   * @param {string|null} [path=null] - Path of the file causing the error.
   * @param {object|null} [error=null] - Detailed error type (e.g., "validation", "authentication").
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode = 500,
    message = "File system error",
    path = null,
    error = null,
    logger = null
  ) {
    super(statusCode, message, error, null, logger);
    this.name = "File system operation error";
    this.path = path;
  }
}

class GitError extends ApiError {
  /**
   * Creates a GitError instance.
   * @param {number} [statusCode=500] - HTTP status code for the error.
   * @param {string} [message="Git operation failed"] - Error message.
   * @param {string|null} [log=null] - Additional log details.
   * @param {string|null} [path=null] - Path of the git repository.
   * @param {string|null} [command=null] - Git command that caused the error.
   * @param {object|null} [error=null] - Detailed error type (e.g., "validation", "authentication").
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode = 500,
    message = "Git operation failed",
    log = null,
    path = null,
    command = null,
    error = null,
    logger = null
  ) {
    super(statusCode, message, error, null, logger);
    this.name = "Git error";
    this.log = log;
    this.path = path;
    this.command = command;
  }
}

class AuthError extends ApiError {
  /**
   * Creates an AuthError instance.
   * @param {number} [statusCode=401] - HTTP status code for the error.
   * @param {string} [message="Authentication failed"] - Error message.
   * @param {object|null} [error=null] - Detailed error type (e.g., "validation", "authentication").
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode = 401,
    message = "Authentication failed",
    error = null,
    logger = null
  ) {
    super(statusCode, message, error, null, logger);
    this.name = "Authentication error";
  }
}

class DataBaseError extends ApiError {
  /**
   * Creates a DataBaseError instance.
   * @param {number} [statusCode=500] - HTTP status code for the error.
   * @param {string} [message="Database operation failed"] - Error message.
   * @param {string|null} [error=null] - Database-specific error details.
   * @param {object|null} [data=null] - Additional error-related data.
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode = 500,
    message = "Database operation failed",
    error = null,
    data = null,
    logger = null
  ) {
    super(statusCode, message, error, data, logger);
    this.name = "DataBase error";
  }
}

class QlikError extends ApiError {
  /**
   * Creates a QlikError instance.
   * @param {number} [statusCode=500] - HTTP status code for the error.
   * @param {string} [message="Qlik Sense error occurred"] - Error message.
   * @param {object|null} [error=null] - Qlik-specific error details.
   * @param {object|null} [data=null] - Additional error-related data.
   * @param {Logger} [logger=null] - Logger instance for logging errors.
   */
  constructor(
    statusCode = 500,
    message = "Qlik Sense error occurred",
    error = null,
    data = null,
    logger = null
  ) {
    super(statusCode, message, error, data, logger);
    this.name = "Qlik sense error";
  }
}

export {
  ApiError,
  ValidationError,
  FS_Error,
  GitError,
  AuthError,
  DataBaseError,
  QlikError,
};
