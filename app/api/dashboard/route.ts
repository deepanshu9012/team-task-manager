import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import { getUserFromRequest } from "@/src/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    await connectDB();

    const filter = user.role === "admin" ? {} : { assignedTo: user.userId };
    const tasks = await Task.find(filter).select("status dueDate");

    const now = new Date();
    const groupedStatus = {
      Pending: 0,
      "In Progress": 0,
      Completed: 0,
    };

    let overdueTasks = 0;

    for (const task of tasks) {
      if (task.status === "todo") {
        groupedStatus.Pending += 1;
      } else if (task.status === "in-progress") {
        groupedStatus["In Progress"] += 1;
      } else if (task.status === "done") {
        groupedStatus.Completed += 1;
      }

      if (task.dueDate < now && task.status !== "done") {
        overdueTasks += 1;
      }
    }

    return NextResponse.json(
      {
        totalTasks: tasks.length,
        tasksByStatus: groupedStatus,
        overdueTasks,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
