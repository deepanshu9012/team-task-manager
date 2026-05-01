import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import { getUserFromRequest } from "@/src/lib/auth";

type CreateTaskBody = {
  title?: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  projectId?: string;
};

type UpdateTaskBody = {
  taskId?: string;
  status?: "todo" | "in-progress" | "done";
};

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    await connectDB();

    const filter = user.role === "admin" ? {} : { assignedTo: user.userId };
    const tasks = await Task.find(filter)
      .populate("project")
      .populate("assignedTo", "-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json({ message: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can create tasks" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = (await req.json()) as CreateTaskBody;
    const title = body.title?.trim();
    const description = body.description?.trim() ?? "";
    const dueDate = body.dueDate;
    const assignedTo = body.assignedTo;
    const project = body.projectId;

    if (!title || !dueDate || !assignedTo || !project) {
      return NextResponse.json(
        { message: "title, dueDate, assignedTo, and projectId are required" },
        { status: 400 }
      );
    }

    const task = await Task.create({
      title,
      description,
      dueDate: new Date(dueDate),
      assignedTo,
      project,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project")
      .populate("assignedTo", "-password");

    return NextResponse.json({ task: populatedTask }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json({ message: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = getUserFromRequest(req);
    await connectDB();

    const body = (await req.json()) as UpdateTaskBody;
    const taskId = body.taskId;
    const status = body.status;

    if (!taskId || !status) {
      return NextResponse.json(
        { message: "taskId and status are required" },
        { status: 400 }
      );
    }

    if (!["todo", "in-progress", "done"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    if (user.role !== "admin" && task.assignedTo.toString() !== user.userId) {
      return NextResponse.json(
        { message: "You can only update your own tasks" },
        { status: 403 }
      );
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project")
      .populate("assignedTo", "-password");

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json({ message: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can delete tasks" },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    await connectDB();
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json({ message: "Failed to delete task" }, { status: 500 });
  }
}
