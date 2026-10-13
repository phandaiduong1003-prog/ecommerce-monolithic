import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function register(req, res) {
  try {
    const { username, fullname, password } = req.body;

    if (!username || !fullname || !password) {
      return res.status(400).json({
        message: "username, fullname and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    const normalRole = await prisma.role.findFirst({
      where: { rolename: "normal" },
    });

    const normalMembership = await prisma.memberShip.findFirst({
      where: {
        mname: "normal",
        score: 10,
      },
    });

    if (!normalRole || !normalMembership) {
      return res.status(500).json({
        message: "Default role or membership has not been initialized",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        fullname,
        password: hashedPassword,
        roleid: normalRole.roleid,
        mid: normalMembership.mid,
      },
      include: {
        role: true,
        membership: true,
      },
    });

    return res.status(201).json({
      message: "Register successful",
      user: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
        membership: user.membership.mname,
        score: user.membership.score,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Register failed",
      error: error.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "username and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        membership: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        uid: user.uid,
        username: user.username,
        role: user.role.rolename,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
        score: user.membership.score,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
}