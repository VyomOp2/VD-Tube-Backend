// Read the Documentation from here : https://github.com/expressjs/multer

import multer from "multer";

// Define a function to generate a unique suffix
function generateUniqueSuffix() {
    return Date.now();
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/temp");
    },
    filename: function (req, file, callback) {
        // Generate a unique suffix for each file
        const uniqueSuffix = generateUniqueSuffix();
        callback(null, file.fieldname + '-' + uniqueSuffix);
    }
});

export const upload = multer({ storage: storage });
