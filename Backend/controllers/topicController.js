const Topic = require("../models/Topic");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.searchTopics = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return sendSuccess(res, { topics: [] }, "No query provided", 200);
    }

    // Text search or regex match
    const regex = new RegExp(`^${escapeRegex(q)}`, "i");
    const topics = await Topic.find({ name: regex }).limit(10).lean();

    sendSuccess(res, { topics }, "Topics retrieved", 200);
  } catch (error) {
    next(error);
  }
};

exports.getAllTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find().lean();
    sendSuccess(res, { topics }, "All topics retrieved", 200);
  } catch (error) {
    next(error);
  }
};
