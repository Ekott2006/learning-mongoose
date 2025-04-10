import {faker} from "@faker-js/faker";
import mongoose, {type HydratedDocument} from "mongoose";
import {afterAll, beforeAll, beforeEach, describe, expect, it} from "vitest";
import Group, {type GroupSchema} from "../models/group";
import Topic from "../models/topic";
import type {UserSchema} from "../models/user";
import User from "../models/user";
import {addExpenseToTopic, createTopic, deleteTopic, editTopic, getTopic,} from "./topic.repository";
import Expense from "../models/expense";

let user: HydratedDocument<UserSchema>;
let group: HydratedDocument<GroupSchema>;

beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/learning-mongoose-test");
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Group.deleteMany({});
  await User.deleteMany({});
  await Topic.deleteMany({});
  await Expense.deleteMany();

  user = await User.create({
    username: faker.internet.username(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    groups: [],
  });

  group = await Group.create({
    creator: user.id,
    name: "Test Group",
    participants: [user.id],
  });
});

describe("Topic Service", () => {
  it("createTopic: should create topic if user is in group and name is unique", async () => {
    const topic = await createTopic(user.id, group.id, {
      name: "Topic A",
    });

    expect(topic).toBeTruthy();
    expect(topic?.name).toBe("Topic A");

    const updatedGroup = await Group.findById(group.id);
    expect(updatedGroup?.topics).toContainEqual(topic?._id);
  });

  it("createTopic: should return undefined if name exists", async () => {
    await createTopic(user.id, group.id, { name: "Duplicate" });
    const second = await createTopic(user.id, group.id, {
      name: "Duplicate",
    });

    expect(second).toBeUndefined();
  });

  it("getTopic: should return topic if user is in participants", async () => {
    const topic = await Topic.create({
      name: "Topic B",
      group: group.id,
      creator: user.id,
    });
    await Group.findByIdAndUpdate(group.id, {$addToSet: {topics: [topic.id]}})
  
    const found = await getTopic(user.id, topic.id);
    expect(found).toBeTruthy();
    expect(found?.name).toBe("Topic B");
  });

  it("getTopic: should return undefined if user not in participants", async () => {
    const topic = await Topic.create({
      name: "Topic B",
      group: group.id,
      creator: user.id,
    });

    const found = await getTopic(user.id, topic.id);
    expect(found).toBeUndefined();
  });

  it("editTopic: should update topic if name is unique", async () => {
    const topic = await Topic.create({
      name: "Original",
      group: group.id,
      creator: user.id,
    });

    const updated = await editTopic(user.id, topic.id, {
      name: "Updated",
    });

    expect(updated).toBeTruthy();
    expect(updated?.name).toBe("Updated");
  });

  it("editTopic: should return undefined if name already exists in group", async () => {
    await Topic.create({
      name: "Existing",
      group: group.id,
      creator: user.id,
    });

    const topicToEdit = await Topic.create({
      name: "To Edit",
      group: group.id,
      creator: user.id,
    });

    const result = await editTopic(user.id, topicToEdit.id, {
      name: "Existing",
    });

    expect(result).toBeUndefined();
  });

  it("deleteTopic: should delete topic by creator", async () => {
    const topic = await Topic.create({
      name: "Deletable",
      group: group.id,
      creator: user.id,
    });

    const deleted = await deleteTopic(user.id, topic.id);
    expect(deleted).toBe(true);

    const found = await Topic.findById(topic._id);
    expect(found).toBeNull();
  });

  it("deleteTopic: should return false if topic not found or creator mismatch", async () => {
    const topic = await Topic.create({
      name: "Keep",
      group: group.id,
      creator: user.id,
    });

    const otherUserId = new mongoose.Types.ObjectId().toString();
    const deleted = await deleteTopic(otherUserId, topic.id);
    expect(deleted).toBe(false);
  });

  it("addExpenseToTopic: should add expenses to topic", async () => {
    const topic = await Topic.create({
      name: "Expense Topic",
      group: group.id,
      creator: user.id,
    });
    const expense1 = await createExpense(topic.id)
    const expense2 = await createExpense(topic.id)

    const result = await addExpenseToTopic(topic.id, [expense1.id, expense2.id,]);

    expect(result).toBe(true);

    const updated = await Topic.findById(topic._id);
    expect(updated?.expenses).toEqual(
      expect.arrayContaining([expense1.id, expense2.id])
    );
  });

  it("addExpenseToTopic: should return false if no update happened", async () => {
    const invalidId = new mongoose.Types.ObjectId();
    const result = await addExpenseToTopic(invalidId.toString(), [
      new mongoose.Types.ObjectId().toString(),
    ]);
    console.log(result)
    expect(result).toBeFalsy();
  });
});

async function createExpense(topicId: string) {
  return await Expense.create({
    name: faker.lorem.words(),
    topic: topicId,
    creator: user.id,
    totalAmount: faker.number.float({min: 10, max: 100})
  });
}