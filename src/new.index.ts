import { faker } from "@faker-js/faker";
import { connect } from "mongoose";
import Expense from "./models/expense";
import ExpenseHistory from "./models/expense-history";
import Group from "./models/group";
import Topic from "./models/topic";
import User from "./models/user";
import { createExpenseHistory, manageExpenseHistory } from "./repository/expense-history.repository";
import { createGroup } from "./repository/group.repository";
import { createUser } from "./repository/user.repository";

await connect("mongodb://localhost:27017/learning-mongoose");
// set("debug", true);
await setup();

const userIds: string[] = [];
for (let index = 0; index < 5; index++) {
  const user = await createUser({
    username: faker.internet.username(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  });
  userIds.push(user.id);
}
const userId = userIds[0]!;
const group = (await createGroup(userId, { name: faker.lorem.words() }))!;
const expense = await Expense.create({
  name: faker.lorem.words(),
  creator: userId,
  group: group.id,
  totalAmount: 100,
  dueDate: new Date(Date.now() - (1000 * 60 * 60 * 24)), // 1 week ago
  recurrenceDuration: 1000 * 60 * 60 * 24 * 7, // 1 week
  participants: [
    {
      user: userId,
      allocationType: "EQUAL",
      amount: 23.54,
      paidAt: new Date(),
    },
    {
      user: userIds[1],
      allocationType: "EQUAL",
      amount: 50,
      paidAt: new Date("2023-01-01"),
    },
  ],
});

await createExpenseHistory(expense.id);
await manageExpenseHistory(expense.id);

// console.log(await ExpenseHistory.find());
console.log(JSON.stringify(await Expense.findOne().populate("history"), null, 2));
await setup();
async function setup() {
  await User.deleteMany();
  await Group.deleteMany();
  await Expense.deleteMany();
  await ExpenseHistory.deleteMany();
  await Topic.deleteMany();
}
