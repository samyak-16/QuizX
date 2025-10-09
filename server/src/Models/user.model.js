import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },

    avatar: { type: String }, // profile image URL

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    //Quizes
    quizzesCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],

    quizzesAttempted: [
      {
        quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
        score: Number,
        completedAt: Date,
      },
    ], //Update this in submitQuiz controller :)

    password: { type: String, required: true },
    // Verification
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpires: { type: Date },

    // Reset Password
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  // It checks each token separately.
  // Uses its own expiry field (emailVerificationTokenExpires and resetPasswordExpires).
  // Only updates expiry if a non-null/defined value is set.
  // Will not mistakenly update expiry when token is deleted or undefined.
  // Let me know if you want to clean expired tokens automatically or add a cron job/TTL.

  // For email verification
  if (
    this.isModified('emailVerificationToken') &&
    this.emailVerificationToken
  ) {
    this.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
  }

  // For reset password
  if (this.isModified('resetPasswordToken') && this.resetPasswordToken) {
    this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    console.log('Reset password token expiry set to 10 minutes from now');
  }

  next();
});

// userSchema.pre('save', async function (next) {
//   //Hash password before saving
//   if (this.isModified('password') || this.isNew) {
//     this.password = await bcrypt.hash(this.password, 10);
//     console.log('Password hashed successfully');
//   }

//   next();
// });

// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

const User = mongoose.models.User || mongoose.model('User', userSchema);

export { User };
