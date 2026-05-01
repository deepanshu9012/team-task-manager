import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
};

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = (await request.json()) as RegisterBody;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role?.trim().toLowerCase();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (role !== "admin" && role !== "member") {
      return NextResponse.json(
        { message: "role must be Admin or Member" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    return NextResponse.json(
      { message: "User registered successfully", user: safeUser },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
