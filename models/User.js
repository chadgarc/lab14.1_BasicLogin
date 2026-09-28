import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User schema for the Innovate Inc. user portal.
 *
 * Fields:
 * - `username` (required): display name, whitespace trimmed.
 * - `email` (required, unique): stored lowercase/trimmed so
 *   `Test@X.com` and `test@x.com` can't create two accounts.
 * - `password` (required, min 6 chars): stores ONLY the bcrypt hash,
 *   never the plain text (see the `pre('save')` hook below).
 *
 * `timestamps: true` adds `createdAt` / `updatedAt` automatically.
 *
 * Connections:
 * - Imported by `controllers/userController.js`, which creates users
 *   (`new User(...)`) and queries them (`User.findOne(...)`).
 * - Why `bcrypt` is imported here: hashing lives in the model so every
 *   save path gets it automatically — controllers never touch hashes.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook: hashes the password with bcrypt before persisting.
 *
 * Runs automatically on every `user.save()` (i.e. on registration).
 * Skips re-hashing when the password field wasn't modified, so updating
 * e.g. only the username doesn't corrupt the stored hash.
 *
 * NOTE: this must be `async function ()` with NO `next` parameter.
 * Mongoose 9 does not pass `next` to async hooks — declaring it causes
 * `next is not a function` at runtime. Errors are propagated by throwing
 * (or returning a rejected promise), not via callback.
 *
 * @returns {Promise<void>} Resolves once `this.password` holds the hash.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compares a plain-text candidate password against the stored bcrypt hash.
 *
 * Why `bcrypt.compare` instead of `===`: bcrypt hashes are salted, so the
 * same password produces a different hash every time — direct string
 * comparison would always fail. `compare` re-hashes the candidate with the
 * stored salt and checks the result in constant time.
 *
 * Used by the `login` controller to validate credentials.
 *
 * @param {string} candidatePassword - Plain-text password from the request body.
 * @returns {Promise<boolean>} `true` if it matches the stored hash.
 */
userSchema.methods.isCorrectPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Strips the password hash from JSON output.
 *
 * Express calls this automatically via `res.json(user)`. It guarantees the
 * hash is never leaked in API responses (register/login), so controllers
 * don't need to delete it manually.
 *
 * @returns {object} Plain user object without the `password` field.
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
