const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  topic: { type: String, required: true, enum: ['arrays','linkedlist','stack','queue','trees','graph','sorting'] },
  difficulty: { type: String, required: true, enum: ['Easy','Medium','Hard'] },
  description: { type: String, required: true },
  constraints: [String],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [{
    input: String,
    output: String,
    explanation: String
  }],
  starterCode: {
    cpp: { type: String, default: '' },
    java: { type: String, default: '' },
    python: { type: String, default: '' }
  },
  hints: [String],
  usedInMultiplayer: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Problem', problemSchema);