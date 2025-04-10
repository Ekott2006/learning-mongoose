import { connect, set } from "mongoose";
import Expense from "./models/expense";
import Group from "./models/group";
import Topic from "./models/topic";
import User from "./models/user";
import { confirmGroupParticipant, createGroup, deleteGroup, deleteGroupParticipant, editGroup, insertGroupSchema } from "./repository/group.repository";
import { createUser } from "./repository/user.repository";
import { faker } from "@faker-js/faker";

await connect("mongodb://127.0.0.1:27017/learning-mongoose");
set("debug", true);

await User.deleteMany();
await Group.deleteMany();
await Expense.deleteMany();
await Topic.deleteMany();

const userIds: string[] = [];
for (let index = 0; index < 2; index++) {
  const user = await createUser({
    username: faker.internet.username(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  });
  userIds.push(user.id);
}
const userId = userIds[0]!;
const groupName = faker.lorem.words();
const group = await createGroup(userId, insertGroupSchema.parse({ name: groupName }));
const group2 = await createGroup(userIds[1]!, insertGroupSchema.parse({ name: groupName }));

await confirmGroupParticipant(userIds[1]!, group!.inviteCode)
const deletedParticipant = await deleteGroupParticipant(userIds[1]!, group!.id)
// await confirmGroupParticipant(userIds[1]!, group2!.inviteCode)

// console.log({group1: {id: userId, name: groupName}, group2: {id: userIds[1], name: group2Name}});
// console.log(await Group.find().select("name creator"));
console.log("GROUP ID: ", group.id);

console.log(await User.find().select("groups"));

await User.deleteMany();
await Group.deleteMany();
await Expense.deleteMany();
await Topic.deleteMany();
