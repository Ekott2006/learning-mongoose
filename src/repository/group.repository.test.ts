import mongoose, { type HydratedDocument } from "mongoose";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "vitest";
import Group, { type GroupSchema } from "../models/group";
import User, { type UserSchema } from "../models/user";
import {
  checkGroupParticipantsExists,
  confirmGroupParticipant,
  createGroup,
  deleteGroup,
  deleteGroupParticipant,
  editGroup,
} from "./group.repository";
import { faker } from "@faker-js/faker";
import Topic, { type TopicSchema } from "../models/topic";

type UserResult = HydratedDocument<UserSchema>;

let creator: UserResult;
let user: UserResult;
let group: HydratedDocument<GroupSchema>;
let topic: HydratedDocument<TopicSchema>;

beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/learning-mongoose-test");
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Group.deleteMany({});
  await User.deleteMany({});
  await Topic.deleteMany({})

  creator = await User.create({
    username: faker.internet.username(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    groups: [],
  });
  user = await User.create({
    username: faker.internet.username(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    groups: [],
  });

  group = await Group.create({
    creator: creator.id,
    name: "Test Group",
    participants: [creator.id, user.id],
  });
  topic = await Topic.create({creator: creator.id, name: "Topic 1", group: group.id})
  await Group.findByIdAndUpdate(group.id, {$addToSet: {topics: [topic.id]}})
});

describe("Group Services", () => {
  test("createGroup should create a group and update user's groups", async () => {
    const group = await createGroup(creator.id.toString(), {
      name: "My Group",
    });
    expect(group).toBeTruthy();
    expect(group?.creator.toString()).toBe(creator.id.toString());

    const updatedUser = await User.findById(creator.id);
    // console.log({updatedUser})
    expect(updatedUser?.groups).toContainEqual(group?._id);
  });

  test("createGroup should not allow duplicate group names", async () => {
    await createGroup(creator.id.toString(), { name: "Group A" });
    const duplicate = await createGroup(creator.id.toString(), {
      name: "Group A",
    });

    expect(duplicate).toBeUndefined();
  });
  test("createGroup should allow duplicate group names for different Id", async () => {
    await createGroup(user.id.toString(), { name: "Group A" });
    const duplicate = await createGroup(creator.id.toString(), {
      name: "Group A",
    });

    expect(duplicate).toBeDefined();
  });

  test("editGroup should change the group's name", async () => {
    const group = await createGroup(creator.id.toString(), {
      name: "Old Name",
    });
    const updated = await editGroup(
      creator.id.toString(),
      group!.id.toString(),
      {
        name: "New Name",
      }
    );

    expect(updated?.name).toBe("New Name");
  });

  test("editGroup should return null if name already exists", async () => {
    await createGroup(creator.id.toString(), { name: "Group A" });
    const groupB = await createGroup(creator.id.toString(), {
      name: "Group B",
    });

    const result = await editGroup(
      creator.id.toString(),
      groupB!.id.toString(),
      {
        name: "Group A",
      }
    );

    expect(result).toBeNull();
  });

  test("editGroup should change if name already exists on another ID", async () => {
    await createGroup(user.id.toString(), { name: "Group A" });
    const groupB = await createGroup(creator.id.toString(), {
      name: "Group B",
    });

    const updated = await editGroup(
      creator.id.toString(),
      groupB!.id.toString(),
      {
        name: "Group A",
      }
    );

    expect(updated?.name).toBe("Group A");
  });

  test("deleteGroup should remove the group and update user's groups", async () => {
    const group = await createGroup(creator.id.toString(), {
      name: "Group To Delete",
    });

    const deleted = await deleteGroup(
      creator.id.toString(),
      group!.id.toString()
    );
    expect(deleted).toBe(true);

    const found = await Group.findById(group!.id);
    expect(found).toBeNull();

    const updatedUser = await User.findById(creator.id);
    expect(updatedUser?.groups).not.toContainEqual(group!.id);
  });

  test("deleteGroup should fail if the person deleting is not the creator", async () => {
    const group = await createGroup(creator.id.toString(), {
      name: "Group To Delete",
    });

    const result = await deleteGroup(user.id.toString(), group!.id.toString());
    expect(result).toBe(false);

    const found = await Group.findById(group!.id);
    expect(found).toBeDefined();

    const updatedUser = await User.findById(creator.id);
    expect(updatedUser?.groups).toContainEqual(group!._id);
  });

  test("confirmGroupParticipant should add user to group and user.groups", async () => {
    const group = await Group.create({
      name: "Invitable Group",
      creator: creator.id,
      participants: [],
      inviteCode: "1234",
    });

    const result = await confirmGroupParticipant(user.id.toString(), "1234");
    expect(result).toBe(true);

    const updatedGroup = await Group.findById(group.id);
    const updatedUser = await User.findById(user.id);
    expect(updatedGroup?.participants).toContainEqual(user._id);
    expect(updatedUser?.groups).toContainEqual(group._id);
  });

  test("confirmGroupParticipant should return false on invalid code", async () => {
    const result = await confirmGroupParticipant(
      user.id.toString(),
      "invalid-code"
    );
    expect(result).toBe(false);
  });

  test("deleteGroupParticipant should remove user from group and user.groups", async () => {
    const group = await Group.create({
      name: "Removable Group",
      creator: creator.id,
      participants: [user.id],
    });
    await User.findByIdAndUpdate(user.id, {
      $addToSet: { groups: [group.id] },
    });

    const result = await deleteGroupParticipant(
      user.id.toString(),
      group.id.toString()
    );
    expect(result).toBe(true);

    const updatedGroup = await Group.findById(group.id);
    const updatedUser = await User.findById(user.id);
    expect(updatedGroup?.participants).not.toContainEqual(user.id);
    expect(updatedUser?.groups).not.toContainEqual(group.id);
  });

  test("deleteGroupParticipant should return false if user is the creator", async () => {
    const group = await createGroup(creator.id.toString(), {
      name: "Owned Group",
    });

    const result = await deleteGroupParticipant(
      creator.id.toString(),
      group!.id.toString()
    );
    expect(result).toBe(false);
  });

  it("checkParticipantsExists should return true if all participants exist in the group by groupId", async () => {
    const result = await checkGroupParticipantsExists(
      { type: "group", groupId: group.id },
      [creator.id, creator.id]
    );
    expect(result).toBe(true);
  });

  it("checkParticipantsExists should return true if all participants exist in the group by topic.Id", async () => {
    const result = await checkGroupParticipantsExists(
      { type: "topic", topicId: topic.id },
      [creator.id]
    );
    expect(result).toBe(true);
  });

  it("checkParticipantsExists should return false if any participant is missing in the group", async () => {
    const missingId = new mongoose.Types.ObjectId();
    const result = await checkGroupParticipantsExists(
      { type: "group", groupId: group.id },
      [creator.id, missingId]
    );
    expect(result).toBe(false);
  });

  it("checkParticipantsExists should return false if group/topic does not exist", async () => {
    const result = await checkGroupParticipantsExists(
      { type: "group", groupId: new mongoose.Types.ObjectId() },
      [creator.id]
    );
    expect(result).toBe(false);
  });
});
