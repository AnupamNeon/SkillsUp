import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../utils/roles.js';

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Clerk user ID
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    imageUrl: { type: String, required: true },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.STUDENT,
    },
    enrolledCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    ],
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ enrolledCourses: 1 });

const User = mongoose.model('User', userSchema);

export default User;