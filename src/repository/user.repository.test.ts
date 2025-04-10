import { faker } from "@faker-js/faker";
import { connect, disconnect } from "mongoose";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import Expense from "../models/expense";
import Group from "../models/group";
import Topic from "../models/topic";
import User from "../models/user";
import { createUser } from "./user.repository";

beforeAll(async () => {
  await connect("mongodb://127.0.0.1:27017/learning-mongoose-test");
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await disconnect();
});

describe("User Repository", () => {
  test("Create Mongoose", async () => {
    const user = generateUser()
    const newUser = await createUser(user);
    const doesUserExists = await User.exists(user);
    expect(newUser).toBeDefined(); // Successful Insertion (Returns the User)
    expect(newUser.email).toBe(user.email); // Same Email
    expect(doesUserExists).toBeDefined(); // checks if the user entered the DB
  });

  test("should not allow duplicate usernames", async () => {
    const user = generateUser()

    // First user should be created successfully
    await createUser({ ...user, email: faker.internet.email() });
    try {
      await createUser(user);
      expect.fail("Expected duplicate username error, but none was thrown");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    }

    // Ensure only one user was inserted with that username
    const foundUser = await User.findOne({ username: user.username });

    expect(foundUser).toBeDefined(); // User exists
    expect(foundUser?.email).not.toBe(user.email); // Email differs because the second user failed
  });

  test("should not allow duplicate email", async () => {
    const user = generateUser()

    // First user should be created successfully
    await createUser({ ...user, username: faker.internet.username() });
    try {
      await createUser(user);
      expect.fail("Expected duplicate email error, but none was thrown");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    }

    // Ensure only one user was inserted with that username
    const foundUser = await User.findOne({ email: user.email });

    expect(foundUser).toBeDefined(); // User exists
    expect(foundUser?.username).not.toBe(user.username); // Username differs because the second user failed
  });
});

async function cleanup() {
  await User.deleteMany();
  await Group.deleteMany();
  await Expense.deleteMany();
  await Topic.deleteMany();
}

function generateUser() {
  return {
    username: faker.internet.username(),
    password: faker.internet.password(),
    email: faker.internet.email(),
  };
}