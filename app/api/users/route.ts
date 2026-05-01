import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/src/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Only admin can access users" },
        { status: 403 }
      );
    }

    await connectDB();

    const users = await User.find({})
      .select("_id name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("token") ||
        msg.includes("authorization") ||
        msg.includes("expired")
      ) {
        return NextResponse.json({ message: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
