import mongoose from 'mongoose';

const classMaterialSchema = new mongoose.Schema({
  material_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  file_url: { type: String, required: true },
  batches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true 
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

classMaterialSchema.index({ batches: 1, created_at: -1 });

classMaterialSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('ClassMaterial', classMaterialSchema);