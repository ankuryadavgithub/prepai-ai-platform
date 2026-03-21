import { pool } from "../db.js";

export const createUser = async (name: string, email: string, password: string, phone: string) => {
  const res = await pool.query(
    "INSERT INTO users (name, email, password, phone) VALUES ($1,$2,$3,$4) RETURNING id, name, email",
    [name, email, password, phone]
  );
  return res.rows[0];
};

export const findUserByEmail = async (email: string) => {
  const res = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );
  return res.rows[0];
};