import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req?.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json(new ApiError(401, 'Unauthorized - No token provided'));
    }
    // Un-signing JWT token ;

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, 'No user found with the provided token.'));
    }
    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json(new ApiError(500, 'Authentication Failed'));
  }
};
