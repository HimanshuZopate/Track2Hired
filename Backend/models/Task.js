const mongoose = require("mongoose");

const TASK_STATUS = ["Pending", "In Progress", "Completed"];
const TASK_PRIORITY = ["Low", "Medium", "High"];

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: TASK_STATUS,
      default: "Pending"
    },
    priority: {
      type: String,
      enum: TASK_PRIORITY,
      default: "Medium"
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ userId: 1, status: 1 });

taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.completedAt = this.status === "Completed" ? new Date() : null;
  }
  next();
});

taskSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (!update) {
    return next();
  }

  const status = update.status || (update.$set && update.$set.status);

  if (status === "Completed") {
    if (update.$set) {
      update.$set.completedAt = new Date();
    } else {
      update.completedAt = new Date();
    }
  }

  if (status && status !== "Completed") {
    if (update.$set) {
      update.$set.completedAt = null;
    } else {
      update.completedAt = null;
    }
  }

  next();
});

module.exports = mongoose.model("Task", taskSchema);