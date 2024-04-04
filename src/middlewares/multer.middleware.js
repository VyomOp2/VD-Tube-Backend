// Read the Documentation from here : https://github.com/expressjs/multer

import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, "./public/temp")
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({ storage: storage })
