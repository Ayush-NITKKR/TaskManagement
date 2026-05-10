const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    gender: {
        type: String,
    },
    dateofBirth: {
        type: String,
    },
    about: {
        type: String,
        trim: true,
    },
    // Store contact as string to preserve leading zeros and + signs
    contact: {
        type: String,
        trim: true,
    },
});

module.exports = mongoose.model('profile', profileSchema);