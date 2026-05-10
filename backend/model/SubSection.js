const mongoose = require("mongoose");

const SubSectionSchema = mongoose.Schema({
    title:{
        type:String,
    },
    timeDuration:{
        type:String,
    },
    description:{
        type:String,
    },
    videoUrl:{
        type:String,
    },
})
module.exports = mongoose.model("subsection",SubSectionSchema);