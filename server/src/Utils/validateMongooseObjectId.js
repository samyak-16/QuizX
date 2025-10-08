import mongoose from 'mongoose';

const validateMongooseObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};
export { validateMongooseObjectId };
