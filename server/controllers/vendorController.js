const User = require('../models/userModel');
const HttpError = require('../models/errorModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const registerUser = async (req, res, next) => {
  try {
    const { name, shopName, location, contact, email, password, password2 } = req.body;

    // Check if required fields are missing
    if (!name || !email || !password || !shopName) {
      return next(new HttpError("Fill in all fields", 422));
    }

    // Check if passwords match
    if (password !== password2) {
      return next(new HttpError("Passwords do not match", 422));
    }

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return next(new HttpError("Email already exists", 422));
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      shopName,
      location,
      contact,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return next(new HttpError("User registration failed.", 500)); // Use 500 for internal server error
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Fill in all fields", 422));
    }
    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });
    if (!user) {
      return next(new HttpError("Invalid Credentials", 422));
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(new HttpError("Wrong password.", 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ token, id, name });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Login failed. Please check your credentials.", 500));
  }
};

const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return next(new HttpError("User not found.", 404));
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return next(new HttpError(error));
  }
};

const changeAvatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return next(new HttpError("Please choose an image.", 422));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found.", 404));
    }

    if (user.avatar) {
      fs.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
        if (err) {
          return next(new HttpError(err));
        }
      });
    }

    const { avatar } = req.files;
    if (avatar.size > 500000) {
      return next(new HttpError("Profile picture too big. Should be less than 500kb", 422));
    }

    const fileName = avatar.name;
    const newFileName = uuid() + path.extname(fileName);
    avatar.mv(path.join(__dirname, "..", "uploads", newFileName), async (err) => {
      if (err) {
        return next(new HttpError(err));
      }

      const updatedAvatar = await User.findByIdAndUpdate(req.user.id, { avatar: newFileName }, { new: true });
      if (!updatedAvatar) {
        return next(new HttpError("Avatar couldn't be changed."));
      }
      res.status(200).json(updatedAvatar);
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError(error));
  }
};

const editUser = async (req, res, next) => {
  try {
    const { name, email, shopName, location, contact, currentPassword, newPassword, newConfirmPassword } = req.body;
    if (!name || !email || !currentPassword || !newPassword) {
      return next(new HttpError("Fill in all fields.", 422));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found.", 404));
    }

    const emailExist = await User.findOne({ email });
    if (emailExist && emailExist._id != req.user.id) {
      return next(new HttpError("Email already exists.", 422));
    }

    const validateUserPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validateUserPassword) {
      return next(new HttpError("Invalid current password.", 422));
    }

    if (newPassword !== newConfirmPassword) {
      return next(new HttpError("New Password do not match.", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashP = await bcrypt.hash(newPassword, salt);

    const newInfo = await User.findByIdAndUpdate(req.user.id, { name, email, shopName, location, contact, password: hashP }, { new: true });
    res.status(200).json(newInfo);
  } catch (error) {
    console.error(error);
    return next(new HttpError(error));
  }
};

const getVendors = async (req, res, next) => {
  try {
    const vendors = await User.find().select('-password');
    res.json(vendors);
  } catch (error) {
    console.error(error);
    return next(new HttpError(error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getVendors
};
