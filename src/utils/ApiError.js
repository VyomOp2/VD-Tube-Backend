// This is a custom error class named 'apiError' that extends the built-in 'Error' class.
// The purpose of this custom error class is to provide more specific and detailed error information when working with APIs.

class ApiError extends Error {
    constructor (
        // The HTTP status code associated with the error, an Integer.
        statusCode,
        // The human-readable error message, a String. Default value is "Something went wrong".
        message = "Something went wrong",
        // An array containing additional error information, such as validation errors, a JSON object or null. Default value is an empty array.
        errors = [],
        // The stack trace, a String. Default value is an empty string.
        stack = ""
    ) {
        // The 'super' keyword is used to call the constructor of the parent class, in this case, the 'Error' class.
        super(message); 
        this.statusCode = statusCode;
        this.message = message;
        // A property to hold any additional data related to the error, a JSON object or null. Default value is null.
        this.data = null;
        this.errors = errors;
        this.stack = stack;
        // A boolean property to indicate whether the operation was successful or not. Default value is false.
        this.success = false;

        // If a stack trace is provided, assign it to this.stack.
        // If not, capture the stack trace using the 'captureStackTrace' method from the 'Error' class.
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError};
