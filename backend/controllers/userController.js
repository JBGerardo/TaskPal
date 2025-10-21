import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../config/mailer.js"; 
import jwt from "jsonwebtoken";


export const getUsers = async (req, res) => {
    try {
        const users = await sql`
        SELECT * FROM users
        ORDER BY created_at DESC
        `;
        console.log("fetched users", users);
        res.status(200).json({success:true, data: users});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }   
}
export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    console.error("❌ Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateUsers = async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    last_name,
    email,
    unit_no,
    street,
    city,
    province,
    postal_code,
    password, 
  } = req.body;

  try {
    // 1️ Fetch current user
    const existingUser = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (existingUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = existingUser[0];

    // 2️ If email is being changed, verify password
    if (email && email !== user.email) {
      if (!password) {
        return res.status(400).json({
          error: "Password is required to confirm email change.",
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          error: "Incorrect password. Email update denied.",
        });
      }
    }

    // 3️ Proceed with the update
    const updatedUser = await sql`
      UPDATE users
      SET first_name = ${first_name},
          last_name = ${last_name},
          email = ${email},
          unit_no = ${unit_no},
          street = ${street},
          city = ${city},
          province = ${province},
          postal_code = ${postal_code}
      WHERE id = ${id}
      RETURNING *;
    `;

    return res.status(200).json({
      success: true,
      data: updatedUser[0],
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Server error updating user profile" });
  }
};

export const deleteUsers = async (req, res) => {
    const { id } = req.params;

  try {
    const deleted = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING *
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: `User ${id} deleted`, data: deleted[0] });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}