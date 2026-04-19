import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    stripeSessionId: {
      type: String,
      index: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
      sparse: true,
    },

    // 🧾 Audit fields
    fulfilledAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔍 Query performance indexes
purchaseSchema.index({ userId: 1, status: 1 });
purchaseSchema.index({ courseId: 1, status: 1 });

// Only one pending purchase per user-course
purchaseSchema.index(
  { userId: 1, courseId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "unique_pending_purchase",
  }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;