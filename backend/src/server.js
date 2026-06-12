const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const sequelize = require("./config/database");
const Task = require("./models/Task");
const taskRoutes = require("./routes/tasks");
const client = require("prom-client");

// Collect default Node.js metrics
client.collectDefaultMetrics();

const register = client.register;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "taskflow-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Metrics endpoint
app.get("/app-metrics", async (req, res) => {
  try {
    const [total, completed, highPriority, criticalPriority] = await Promise.all([
      Task.count(),
      Task.count({ where: { status: "Done" } }),
      Task.count({ where: { priority: "High" } }),
      Task.count({ where: { priority: "Critical" } }),
    ]);

    const avgHoursResult = await Task.findOne({
      attributes: [
        [sequelize.fn("AVG", sequelize.col("estimated_hours")), "avg_hours"]
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        total_tasks: total,
        completed_tasks: completed,
        high_priority_tasks: highPriority + criticalPriority,
        avg_estimated_hours: parseFloat(
          avgHoursResult?.avg_hours || 0
        ).toFixed(1),
        in_progress: await Task.count({
          where: { status: "In Progress" }
        }),
        todo: await Task.count({
          where: { status: "Todo" }
        }),
      },
    });
  } catch (err) {
    console.error("metrics error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics"
    });
  }
});

// API routes
app.use("/api/tasks", taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// Boot sequence
const boot = async () => {
  const maxRetries = 10;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log("✓ Database connected");

      await sequelize.sync({ alter: true });
      console.log("✓ Database synced");

      const count = await Task.count();

      if (count === 0) {
        await Task.bulkCreate([
          {
            title: "Design system audit",
            description: "Review and update component library",
            priority: "High",
            status: "In Progress",
            estimated_hours: 8
          },
          {
            title: "Set up CI/CD pipeline",
            description: "Configure GitHub Actions",
            priority: "Critical",
            status: "Todo",
            estimated_hours: 12
          }
        ]);

        console.log("✓ Sample data seeded");
      }

      app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
      });

      break;

    } catch (err) {

      attempt++;

      console.error(
        `Boot attempt ${attempt}/${maxRetries} failed:`,
        err.message
      );

      if (attempt >= maxRetries) {
        console.error("Max retries reached. Exiting.");
        process.exit(1);
      }

      await new Promise((r) => setTimeout(r, 3000));
    }
  }
};

boot();