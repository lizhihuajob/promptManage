const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  groupName: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  useCount: {
    type: Number,
    default: 0
  },
  updateCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

promptSchema.pre('save', function(next) {
  if (this.isNew) {
    this.updateCount = 0;
  } else {
    this.updateCount += 1;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Prompt', promptSchema);
