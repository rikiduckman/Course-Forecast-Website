const mongoose = require('mongoose');

// Define the schema for storing file metadata and data
const fileDataSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  data: [{
    studentId: String,
    gender: String,
    education: String,
    grade1: String,
    grade2: String,
    grade3: String,
    uploadedAt: Date,
  }],
  uploadedAt: { type: Date, default: Date.now },
});

const FileData = mongoose.model('FileData', fileDataSchema);

module.exports = FileData;
