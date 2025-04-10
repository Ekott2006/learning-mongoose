import { Types } from "mongoose";
import { z } from "zod";

export const ZodObjectId = z.string().refine((val) => Types.ObjectId.isValid(val));

