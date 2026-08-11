const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    _id: { type: mongoose.Schema.Types.Mixed }, // Can be an ObjectId or 'temp-...' string
    name: { type: String },
    email: { type: String },
    avatar: { type: String },
    role: { type: String, default: 'Viewer' },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Accepted' }
  }],
  activityLog: [{
    message: String,
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', TeamSchema);
