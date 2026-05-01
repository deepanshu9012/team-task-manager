import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import { getUserFromRequest } from "@/src/lib/auth";

type CreateProjectBody = {
  title?: string;
  description?: string;
};

export async function GET(req: Request) {
  try {
    getUserFromRequest(req);
    await connectDB();

    const projects = await Project.find({})
      .populate("members", "-password")
      .populate("createdBy", "-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can create projects" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = (await req.json()) as CreateProjectBody;
    const title = body.title?.trim();
    const description = body.description?.trim() ?? "";

    if (!title) {
      return NextResponse.json(
        { message: "title is required" },
        { status: 400 }
      );
    }

    const project = await Project.create({
      name: title,
      description,
      members: [user.userId],
      createdBy: user.userId,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can delete projects" },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    await connectDB();
    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to delete project" },
      { status: 500 }
    );
  }
}
