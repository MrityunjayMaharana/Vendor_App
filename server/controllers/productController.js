const Product = require("../models/productModel");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");

const createProduct = async (req, res, next) => {
  try {
    const { productName, category, description, price } = req.body;
    if (!productName || !category || !description || !req.files) {
      return next(new HttpError("Fill in all fields and choose thumbnail.", 422));
    }

    const { thumbnail } = req.files;
    if (thumbnail.size > 2000000) {
      return next(new HttpError("Thumbnail size is too big. File should be less than 2MB", 422));
    }

    const fileName = thumbnail.name;
    const newFilename = uuid() + path.extname(fileName);
    thumbnail.mv(path.join(__dirname, "..", "uploads", newFilename), async (err) => {
      if (err) {
        return next(new HttpError(err));
      } else {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
          return next(new HttpError("User not found.", 404));
        }

        const newProduct = await Product.create({
          productName,
          category,
          description,
          price,
          thumbnail: newFilename,
          vendor: req.user.id,
          shopName: currentUser.shopName,
          contact: currentUser.contact,
        });

        if (!newProduct) {
          return next(new HttpError("Product couldn't be created.", 422));
        }

        const userProductCount = currentUser.products + 1;
        await User.findByIdAndUpdate(req.user.id, { products: userProductCount });
        res.status(201).json(newProduct);
      }
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return next(new HttpError("Product not found.", 404));
    }
    res.status(200).json(product);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getCatProducts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catProducts = await Product.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(catProducts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getVendorProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ vendor: id }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const editProduct = async (req, res, next) => {
  try {
    const { productName, category, description } = req.body;
    const productId = req.params.id;

    if (!productName || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields and provide valid data.", 422));
    }

    const oldProduct = await Product.findById(productId);
    if (!oldProduct) {
      return next(new HttpError("Product not found.", 404));
    }

    if (req.user.id != oldProduct.vendor) {
      return next(new HttpError("Unauthorized to edit this product.", 403));
    }

    let updatedProduct;
    if (!req.files) {
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { productName, category, description },
        { new: true }
      );
    } else {
      const { thumbnail } = req.files;
      if (thumbnail.size > 2000000) {
        return next(new HttpError("Thumbnail size is too big. File should be less than 2MB", 422));
      }
      const newFilename = uuid() + path.extname(thumbnail.name);
      thumbnail.mv(path.join(__dirname, "..", "uploads", newFilename), async (err) => {
        if (err) {
          return next(new HttpError(err));
        }
      });
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { productName, category, description, thumbnail: newFilename },
        { new: true }
      );
    }

    if (!updatedProduct) {
      return next(new HttpError("Product couldn't be updated.", 422));
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return next(new HttpError("Product ID not provided.", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new HttpError("Product not found.", 404));
    }

    if (req.user.id != product.vendor) {
      return next(new HttpError("Unauthorized to delete this product.", 403));
    }

    const fileName = product.thumbnail;
    fs.unlink(path.join(__dirname, "..", "uploads", fileName), async (err) => {
      if (err) {
        return next(new HttpError(err));
      }

      await Product.findByIdAndDelete(productId);
      const currentVendor = await User.findById(req.user.id);
      if (currentVendor) {
        const vendorProductCount = currentVendor.products - 1;
        await User.findByIdAndUpdate(req.user.id, { products: vendorProductCount });
      }
      res.json(`Product ${productId} deleted successfully.`);
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getCatProducts,
  getVendorProducts,
  editProduct,
  deleteProduct,
};
