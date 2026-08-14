import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  name:        { type: String, required: true },
  mobile:      { type: String, required: true },
  wardNumber:  { type: String, required: true },
  area:        { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      'Water Problems',
      'Road & Pothole Problems',
      'Street Light Problems',
      'Garbage & Sanitation',
      'Drainage Problems',
      'Public Health Issues',
      'Public Transport Issues',
      'Electricity Problems',
      'Public School Issues',
      'Other Local Problems',
    ],
  },
  description: { type: String, required: true },
  photo:       { type: String, default: '' },
  landmark:    { type: String, default: '' },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Submitted',
  },
}, { timestamps: true });

ComplaintSchema.pre('save', async function (next) {
  if (this.complaintId) return next();
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  this.complaintId = `TVK-${ymd}-${rand}`;
  next();
});

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
