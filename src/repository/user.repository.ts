import User, { type UserSchema } from "../models/user";

export type CreateUser = Omit<UserSchema, "groups" | "refreshTokens">;

export async function createUser(data: CreateUser) {
  return await User.create(data);
}

export async function getUserById(id: string) {
  return User.findById(id).select("-password");
}

export async function getUserGetPassword(email: string) {
  return User.findOne({ email }).select("password");
}

export async function editUser(
  id: string,
  data: Omit<CreateUser, "password" | "email">
) {
  return User.findByIdAndUpdate(id, data).select("username email");
}

export async function deleteUser(id: string) {
  const result = await User.findByIdAndDelete(id);
  return result?.$isDeleted();
}

export async function createUserToken(id: string, token: string) {
  await User.findByIdAndUpdate(id, { $addToSet: { refreshTokens: [token] } });
  return;
}

export async function deleteUserToken(id: string, token: string) {
  return User.findByIdAndUpdate(id, { $pullAll: { refreshTokens: [token] } });
}
// todo: Recheck Here
export async function editUserToken(token: { old: string; new: string }) {
  return User.findOneAndUpdate(
    { refreshTokens: token.old },
    { $set: { "refreshTokens.$": token.new } }
  ).select("id");
}
