import foodModel from "../models/food.model.js"
import orderModel from "../models/order.model.js"
import fs from "fs"
import { safeRedisGet, safeRedisSet } from "../config/redis.js";

//@desc Add Food Item
//@route POST /api/food/add
//@access Admin
const addFood = async (req, res) => {
  let image_filename = `${req.file.filename}`

  try {
    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image_filename
    })

    await food.save()
    //await redisClient.del("food_list");
    await redisClient.flushAll(); // simple but effective for now
    res.status(201).json({ success: true, message: "Food Added Successfully" })

  } catch (error) {
    console.error("Error adding food:", error)
    res.json({ success: false, message: "Error adding food!" })
  }
}

//@desc List All Foods
//@route GET /api/food/list
//@access Admin
const listFood = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;

    // -------- BUILD FILTER OBJECT --------
    let filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // -------- PAGINATION --------
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // -------- CACHE KEY (IMPORTANT) --------
    const cacheKey = `food_list:${JSON.stringify({
      filter,
      page: pageNumber,
      limit: limitNumber
    })}`;

    // -------- TRY REDIS --------
    const cached = await safeRedisGet(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cached),
        source: "cache",
      });
    }

    // -------- DB QUERY --------
    const [foods, total] = await Promise.all([
      foodModel.find(filter).skip(skip).limit(limitNumber).lean(),
      foodModel.countDocuments(filter),
    ]);

    const response = {
      success: true,
      data: foods,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
      },
    };

    // -------- CACHE RESULT --------
    safeRedisSet(cacheKey, JSON.stringify(foods), { EX: 3600 });

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching food list", error);
    res.status(500).json({
      success: false,
      message: "Error fetching food list",
    })
  }
}

//@desc Remove Food Item
//@route DELETE /api/food/remove/:id
//@access Admin
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id)

    if (!food) return res.status(404).json({ success: false, message: "Food Item Does Not Exist" })

    //remove image from uploads folder
    fs.unlink(`uploads/${food.image}`, () => { })

    //remove food item from database
    await foodModel.findByIdAndDelete(req.body.id)
    //await redisClient.del("food_list");
    await redisClient.flushAll(); // simple but effective for now
    res.status(200).json({ success: true, message: "Food Item Removed Successfully" })

  } catch (error) {
    console.error("Error removing food item:", error)
    res.status(500).json({ success: false, message: "Error removing food item!" })
  }
}

// @desc Rate Food Item
//@route POST /api/food/rate
//@access Public
const rateFood = async (req, res) => {
  try {
    const { foodId, rating } = req.body;
    const userId = req.user.id;

    const numericRating = Number(rating);

    // ⭐ Update order item rating
    const updated = await orderModel.updateOne(
      {
        userId: userId,
        "items._id": foodId
      },
      {
        $set: {
          "items.$.rating": numericRating
        }
      }
    );

    if (updated.modifiedCount === 0) {
      return res.json({ success: false, message: "Order item not found" });
    }

    res.json({ success: true, message: "Rated successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error rating food" });
  }
}

export { addFood, listFood, removeFood, rateFood }