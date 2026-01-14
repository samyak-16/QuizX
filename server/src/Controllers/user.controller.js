import bcrytp from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../Models/user.model.js';
import { inngest } from '../Config/inngest.js';
import { ApiError } from '../Utils/api-error.js';
import { env } from '../Config/env.js';
import { ApiResponse } from '../Utils/api-response.js';

const registerUser = async (req, res) => {
  const { email = '', name = '', password = '' } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json(new ApiError(400, 'All Fields are required'));
  }
  try {
    const hashedPassword = await bcrytp.hash(password, 10);
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
    });

    await newUser.save();
    await inngest.send({
      name: 'user/signup',
      data: {
        email,
      },
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { newUser }, 'User registered Successfully'));
  } catch (error) {
    console.error('Internal Server Error at registerUser : ', error.message);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at registerUser'));
  }
};

const loginUser = async (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password) {
    return res.status(400).json(new ApiError(400, 'All Fields are required'));
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiError(404, 'User not registered yet'));
    }
    const isPasswordCorrect = await bcrytp.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json(new ApiError(400, 'Invalid Credtentials'));
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    const cookieOptions = {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production only
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Allow setting Cookies for Cross Origin requests in production
    };

    res.cookie('token', token, cookieOptions);
    return res
      .status(200)
      .json(new ApiResponse(200, { user }, 'User logged in successfully'));
  } catch (error) {
    console.error('Internal Server Error at loginUser', error);
    res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at loginUser'));
  }
};
const logoutUser = async (req, res) => {
  try {
    //Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'User logged out successfully'));
  } catch (error) {
    console.error('Error in logoutUser:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at logoutUser'));
  }
};



export { registerUser, loginUser, logoutUser };
