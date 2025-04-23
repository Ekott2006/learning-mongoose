import { faker } from "@faker-js/faker";
import User from "./models/user";
import { connect, startSession } from "mongoose";

await connect("mongodb://localhost:27017/learning-mongoose");
await User.deleteMany();

const session = await startSession();
console.log("Starting session: ", session.id);

const user = createUser();
const user2 = createUser();
console.log("Creating user: ", user.username);

session.withTransaction(async () => {
  await User.create([user], { session });
  // await User.create([user2], { session });

  throw new Error("Test error"); // This will cause the transaction to be aborted
});

// await session.endSession();

console.log(await User.find({}));

User.deleteMany();

function createUser() {
  return {
    username: faker.internet.username(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    groups: [],
  }
}