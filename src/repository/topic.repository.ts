import Topic from "../models/topic";
import Group from "../models/group";
import { checkGroupParticipantsExists } from "./group.repository";

interface CreateTopic {
  name: string;
  description?: string;
}

export async function getTopic(userId: string, id: string) {
  const doesParticipantExists = await checkGroupParticipantsExists(
    {type: "topic", topicId: id},
    [userId]
  );
  if (!doesParticipantExists) return undefined;
  return Topic.findById(id).populate("expenses", ["name", "participants"]);
}

export async function addExpenseToTopic(topicId: string, expenseIds: string[]) {
  const updatedTopic = await Topic.updateOne(
    { _id: topicId },
    {
      $addToSet: expenseIds,
    }
  );
  // TODO: Work Here
  return updatedTopic.modifiedCount != 0;
}

export async function createTopic(
  userId: string,
  groupId: string,
  data: CreateTopic
) {
  const doesParticipantExists = await checkGroupParticipantsExists({type: "group",  groupId}, [
    userId,
  ]);
  if (!doesParticipantExists) return undefined;
  const topic = await Topic.exists({ name: data.name, group: groupId });
  if (topic) return undefined;

  const newTopic = await Topic.create({
    name: data.name,
    description: data.description,
    group: groupId,
    creator: userId,
  });
  await Group.findByIdAndUpdate(groupId, {
    $addToSet: { topics: [newTopic.id] },
  });
  return newTopic;
}

export async function editTopic(
  creatorId: string,
  id: string,
  data: CreateTopic
) {
  // Get group from id
  const topic = await Topic.findById(id).select("group");
  if (!topic) return undefined;
  // Ensure name is unique
  const topicNameExists = await Topic.findOne({
    name: data.name,
    group: topic.group,
  }).select("id");
  if (topicNameExists) return undefined;

  return Topic.findOneAndUpdate(
    { _id: id, creator: creatorId },
    {
      name: data.name,
      description: data.description,
    },
    { new: true }
  );
}

export async function deleteTopic(creatorId: string, id: string) {
  const result = await Topic.findOneAndDelete({
    _id: id,
    creator: creatorId,
  }).select("id");
  return !!result;
}
