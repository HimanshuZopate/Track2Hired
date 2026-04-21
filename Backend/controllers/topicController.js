const Topic = require("../models/Topic");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.searchTopics = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ topics: [] });
    }

    // Text search or regex match
    const regex = new RegExp(`^${escapeRegex(q)}`, "i");
    const topics = await Topic.find({ name: regex }).limit(10).lean();

    res.status(200).json({ topics });
  } catch (error) {
    next(error);
  }
};

exports.getAllTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find().lean();
    res.status(200).json({ topics });
  } catch (error) {
    next(error);
  }
};
