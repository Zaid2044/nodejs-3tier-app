const { Op } = require("sequelize");
const Task = require("../models/Task");

// GET /api/tasks
const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "created_at",
      sortOrder = "DESC",
      priority,
      status,
    } = req.query;

    const validSortFields = ["title", "priority", "estimated_hours", "created_at", "updated_at", "status"];
    const validSortOrders = ["ASC", "DESC"];

    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : "DESC";

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (search.trim()) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    if (priority) where.priority = priority;
    if (status) where.status = status;

    const { count, rows } = await Task.findAndCountAll({
      where,
      order: [[safeSortBy, safeSortOrder]],
      limit: limitNum,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error("getAllTasks error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    console.error("getTaskById error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch task" });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, status, estimated_hours } = req.body;

    const task = await Task.create({
      title: title?.trim(),
      description: description?.trim() || null,
      priority: priority || "Medium",
      status: status || "Todo",
      estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
    });

    res.status(201).json({ success: true, data: task, message: "Task created successfully" });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors.map((e) => e.message),
      });
    }
    console.error("createTask error:", err);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { title, description, priority, status, estimated_hours } = req.body;

    await task.update({
      title: title?.trim() ?? task.title,
      description: description !== undefined ? (description?.trim() || null) : task.description,
      priority: priority ?? task.priority,
      status: status ?? task.status,
      estimated_hours: estimated_hours !== undefined ? (estimated_hours ? parseFloat(estimated_hours) : null) : task.estimated_hours,
    });

    res.json({ success: true, data: task, message: "Task updated successfully" });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors.map((e) => e.message),
      });
    }
    console.error("updateTask error:", err);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.destroy();
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    console.error("deleteTask error:", err);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
