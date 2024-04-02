// We can use any of the Method to resolve the Errors Handling.


// 1)
// Promise and  async/await Function to handle the errors from the SERVER.
const asyncHandler = (requestHandler) => {
    // Return a function that takes in request, response, and next (error handling) objects
    (req , res , next) => {
        // Use the Promise.resolve method to convert the requestHandler function into a promise
        Promise.resolve(requestHandler(req , res , next)).catch((err) => next(err))
    }
}
// Export the asyncHandler function to make it available to other parts of the code
export {asyncHandler}



// 2)
// Try Catch asyncHandler :
/*
const asyncHandler = (fn) => async (req , res , next) => {
    try {
        await fn(req , res , next)
    } catch (error) {
        res.status(err.code || 400).json({ 
            success: false,
            message: err.message || 'Server Error'
         })
    }
}
export {asyncHandler}
*/
