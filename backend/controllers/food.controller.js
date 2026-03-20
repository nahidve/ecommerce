import foodModel from "../models/food.model.js"
import fs from "fs"

//@desc Add Food Item
//@route POST /api/food/add
//@access Private
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
        res.status(201).json({ success: true, message: "Food Added Successfully" })

    } catch (error) {
        console.error("Error adding food:", error)
        res.json({ success: false, message: "Error adding food!" })
    }
}

//@desc List All Foods
//@route GET /api/food/list
//@access Public
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({})
        res.status(200).json({ success: true, data: foods })
    } catch (error) {
        console.error("Error listing foods:", error)
        res.status(500).json({ success: false, message: "Error listing foods!" })
    }
}

//@desc Remove Food Item
//@route DELETE /api/food/remove/:id
//@access Private
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id)

        if (!food) return res.status(404).json({ success: false, message: "Food Item Does Not Exist" })

        //remove image from uploads folder
        fs.unlink(`uploads/${food.image}`, () => { })
        //remove food item from database
        await foodModel.findByIdAndDelete(req.body.id)

        res.status(200).json({ success: true, message: "Food Item Removed Successfully" })

    } catch (error) {
        console.error("Error removing food item:", error)
        res.status(500).json({ success: false, message: "Error removing food item!" })
    }
}

// @desc Rate food
import orderModel from "../models/order.model.js";
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