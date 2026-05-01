import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { generateToken } from "@/src/lib/jwt";
import User from "@/models/User";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: "email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    return NextResponse.json(
      { message: "Login successful", token, user: safeUser },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
