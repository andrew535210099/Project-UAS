var mongoose = require('mongoose'); 

var videoSchema = new mongoose.Schema({ 
    name: String, 
    desc: String, 
    img: 
    { 
        data: Buffer, 
        contentType: String 
    } 
}); 
module.exports = new mongoose.model('Video', videoSchema);