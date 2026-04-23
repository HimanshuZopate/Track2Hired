const mongoose = require("mongoose");

const NOTIFICATION_TYPES = ["warning", "streak_reset", "badge", "system"];

const userNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    dedupeKey: {
      type: String,
      default: null,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userNotificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dedupeKey: { $type: "string" }
    }
  }
);

module.exports = mongoose.model("UserNotification", userNotificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;