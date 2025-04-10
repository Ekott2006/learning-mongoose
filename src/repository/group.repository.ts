import { z } from "zod";
import Group from "../models/group";
import User from "../models/user";
import type { Id } from "../lib/types";

export const insertGroupSchema = z.object({
  name: z.string().min(3),
});
type InsertGroup = z.infer<typeof insertGroupSchema>;

async function doesGroupNameExists(creatorId: string, name: string) {
  const exists = await Group.exists({ creator: creatorId, name });
  return !!exists;
}

export async function createGroup(creatorId: string, data: InsertGroup) {
  if (await doesGroupNameExists(creatorId, data.name)) return undefined;

  const newGroup = await Group.create({
    name: data.name,
    creator: creatorId,
    participants: [creatorId],
  });
  // Do the same for add participants
  await User.findByIdAndUpdate(creatorId, {
    $addToSet: { groups: [newGroup.id] },
  });
  return newGroup;
}

export async function editGroup(
  creatorId: string,
  id: string,
  data: InsertGroup
) {
  if (await doesGroupNameExists(creatorId, data.name)) return null;

  const group = await Group.findOneAndUpdate(
    { _id: id, creator: creatorId },
    { name: data.name },
    { new: true }
  );

  return group;
}

export async function deleteGroup(creatorId: string, id: string) {
  const result = await Group.findOneAndDelete({
    _id: id,
    creator: creatorId,
  }).select("id");
  await User.findByIdAndUpdate(creatorId, {
    $pullAll: { groups: [id] },
  });
  return !!result;
}

export async function confirmGroupParticipant(
  userId: string,
  inviteCode: string
) {
  const group = await Group.findOneAndUpdate(
    { inviteCode },
    { $addToSet: { participants: [userId] } }
  ).select("id");
  if (!group) return false;
  await User.findByIdAndUpdate(userId, {
    $addToSet: { groups: [group.id] },
  });
  return true;
}

export async function deleteGroupParticipant(userId: string, id: string) {
  const group = await Group.findOneAndUpdate(
    { _id: id, creator: { $ne: userId } },
    { $pullAll: { participant: [userId] } },
    { new: true }
  ).select("id");
  if (!group) return false;

  await User.findByIdAndUpdate(userId, {
    $pullAll: { groups: [id] },
  });
  return true;
}

export async function checkGroupParticipantsExists(
  data: { type: "topic"; topicId: Id } | { type: "group"; groupId: Id },
  participantsId: string[]
) {
  const options =
    data.type === "group" ? { _id: data.groupId } : { topics: data.topicId };
  const groupExist = await Group.exists({
    ...options,
    participants: { $all: participantsId },
  });
  return !!groupExist;
}
