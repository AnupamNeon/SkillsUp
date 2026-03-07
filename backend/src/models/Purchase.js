import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ userId: 1, status: 1 });
purchaseSchema.index({ courseId: 1, status: 1 });
purchaseSchema.index({ userId: 1, courseId: 1 }, { unique: false });

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;