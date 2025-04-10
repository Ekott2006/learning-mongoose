import { connect, set } from "mongoose";
import User from "./models/user";
import { createUser } from "./repository/user.repository";
import { faker } from "@faker-js/faker";
import Group from "./models/group";
import { createGroup } from "./repository/group.repository";
import {
    createExpense,
    upsertExpenseParticipants,
} from "./repository/expense.repository";
import Expense from "./models/expense";
import { createTopic } from "./repository/topic.repository";
import Topic from "./models/topic";
import ParticipantDetail from "./models/participant-detail";

console.log("Hello via Bun!");
await connect("mongodb://127.0.0.1:27017/learning-mongoose");
set('debug', true);


await User.deleteMany();
await Group.deleteMany();
await Expense.deleteMany();
await ParticipantDetail.deleteMany();
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
const topicName = faker.lorem.words();
const group = await createGroup({ name: groupName, creatorId: userId });
await createGroup({ name: groupName, creatorId: userId });
await createGroup({ name: groupName, creatorId: userId });
const topic = await createTopic({ groupId: group?.id, name: topicName });
await createTopic({ groupId: group?.id, name: topicName });
await createTopic({ groupId: group?.id, name: topicName });

const expense = await createExpense({
    creatorId: userId,
    groupId: group!.id,
    name: faker.lorem.words(),
    totalAmount: 23.54,
});
await createExpense({
    creatorId: userId,
    groupId: group!.id,
    name: faker.lorem.words(),
    topicId: topic!.id,
    totalAmount: 213.54,
});

await upsertExpenseParticipants(expense!.id, [
    {
        userId: userId,
        allocationType: "equal",
        amount: 30,
    },
    {
        userId: userIds[1]!,
        allocationType: "fixed-value",
        amount: 300,
    },
    {
        userId: userId,
        allocationType: "percentage",
        amount: 50,
    },
]);
await upsertExpenseParticipants(expense!.id, [
    {
        userId: userId,
        allocationType: "equal",
        amount: 30,
    },
    {
        userId: userIds[1]!,
        allocationType: "fixed-value",
        amount: 300,
    },
    {
        userId: userId,
        allocationType: "percentage",
        amount: 50,
    },
]);

// console.log({"Users": await User.find({})})
// console.log({"Groups": await Group.find({})})
console.log({ Expenses: await Expense.find({}).populate("participants") });
// console.log({"Topics": await Topic.find({})})
console.log({ "Expense Participant ": await ParticipantDetail.find({}) });

console.log(
    JSON.stringify(
        await Group.findOne({})
            .populate("creator", "username")
            .populate("participants", "username")
            .populate("expenses", ["name", "participants"])
            .populate("topics", "name")
    )
);

await User.deleteMany();
await Group.deleteMany();
await Expense.deleteMany();
await ParticipantDetail.deleteMany();
await Topic.deleteMany();
