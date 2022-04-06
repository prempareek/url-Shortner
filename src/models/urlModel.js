const mongoose = require('mongoose')

const URLSchema = new mongoose.Schema({
    
    urlCode: { type: String,
         required: true, 
         unique: true,
          trim: true,
           lowercase: true },
    longUrl: { type: String,
         required: true,
          unique: true, 
          trim: true },  
    shortUrl: { type: String,
         required: true,
          unique: true,
           trim: true },
          
    

    date:{type:Date,default: Date.now},
})

module.exports = mongoose.model('Url',URLSchema)