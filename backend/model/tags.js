const mongoose = require("mongoose");
const { type } = require("node:os");

const tagsSchema = mongoose.Schema({
    name:{
        type:String,
    },
    description:{
        type:String,
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"course"
    }

});

module.exports = mongoose.model("tags" , tagsSchema);