const mongoose = require("mongoose");
const Task = require("../models/Task");

const VALID_STATUS = ["Pending", "In Progress", "Completed"];
const VALID_SORT_FIELDS = ["dueDate", "priority"];

const handleTaskError = (res, error) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid request data" });
  }

  return res.status(500).json({ message: error.message });
};

const parsePagination = (page, limit) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit
  };
};

const getPriorityRankExpression = () => ({
  $switch: {
    branches: [
      { case: { $eq: ["$priority", "High"] }, then: 3 },
      { case: { $eq: ["$priority", "Medium"] }, then: 2 },
      { case: { $eq: ["$priority", "Low"] }, then: 1 }
    ],
    default: 2
  }
});

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description,
      status,
      priority,
      dueDate
    });

    return res.status(201).json({ task });
  } catch (error) {
    return handleTaskError(res, error);
  }
};

// GET /api/tasks
exports.getUserTasks = async (req, res) => {
  try {
    const { status, page, limit, sortBy = "dueDate", sortOrder = "asc" } = req.query;

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      return res.status(400).json({ message: "Invalid sortBy value. Use dueDate or priority" });
    }

    const normalizedSortOrder = String(sortOrder).toLowerCase() === "desc" ? -1 : 1;
    const { page: currentPage, limit: pageSize, skip } = parsePagination(page, limit);

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const match = { userId: userObjectId };

    if (status) {
      match.status = status;
    }

    const sortStage =
      sortBy === "priority"
        ? { priorityRank: normalizedSortOrder, createdAt: -1 }
        : { dueDate: normalizedSortOrder, createdAt: -1 };

    const now = new Date();

    const [tasks, filteredCount, totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.aggregate([
        { $match: match },
        {
          $addFields: {
            priorityRank: getPriorityRankExpression(),
            isOverdue: {
              $and: [
                { $ne: ["$status", "Completed"] },
                { $ne: ["$dueDate", null] },
                { $lt: ["$dueDate", now] }
              ]
            }
          }
        },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: pageSize },
        { $project: { priorityRank: 0 } }
      ]),
      Task.countDocuments(match),
      Task.countDocuments({ userId: req.user._id }),
      Task.countDocuments({ userId: req.user._id, status: "Completed" }),
      Task.countDocuments({
        userId: req.user._id,
        dueDate: { $lt: now },
        status: { $ne: "Completed" }
      })
    ]);

    const completedPercentage =
      totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

    return res.json({
      tasks,
      pagination: {
        page: currentPage,
        limit: pageSize,
        totalFilteredTasks: filteredCount,
        totalPages: Math.ceil(filteredCount / pageSize)
      },
      metrics: {
        totalTasks,
        completedTasks,
        completedPercentage,
        overdueTasks
      }
    });
  } catch (error) {
    return handleTaskError(res, error);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const allowedUpdates = ["title", "description", "status", "priority", "dueDate"];
    const updateData = {};

    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { returnDocument: "after", runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ task });
  } catch (error) {
    return handleTaskError(res, error);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return handleTaskError(res, error);
  }
};

// PATCH /api/tasks/:id/complete
exports.markTaskCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { status: "Completed" },
      { returnDocument: "after", runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ task });
  } catch (error) {
    return handleTaskError(res, error);
  }
};