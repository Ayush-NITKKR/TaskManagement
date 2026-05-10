const mongoose = require("mongoose");

const SectionSchema = mongoose.Schema({
        sectionName:{
            type:String,
        },
        subSection:[
            {
              type:mongoose.Schema.Types.ObjectId,
              required:true,
              ref:"subsection"  
            }
        ]
})

module.exports = mongoose.model("section",SectionSchema);