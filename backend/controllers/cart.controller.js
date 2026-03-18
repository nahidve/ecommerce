import userModel from "../models/user.model.js";
 
 
//@desc Add Items To Cart
//@route POST /api/cart/add
//@access Private
const addToCart = async (req, res) => {
 
  try {
    let userData = await userModel.findById({ _id: req.body.userId });
    if (!userData) {
      return res.json({ success: false, message: "User not found" })
    }
    let cartData = userData.cartData || {}
    if (!cartData[req.body.itemId]) {
      cartData[req.body.itemId] = 1
    }
    else {
      cartData[req.body.itemId] += 1
    }
    await userModel.findByIdAndUpdate(req.body.userId, { $set: { cartData: cartData } })
    res.json({ success: true, message: "Added To cart" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error" })
  }
}
 
//@desc Remove Items From Cart
//@route POST /api/cart/remove
//@access Private
const removeFromCart = async (req, res) => {
 
  try {
    let userData = await userModel.findById(req.body.userId);
    console.log("removeFromCart - userId:", req.body.userId || 'undefined');
    if (!userData) {
      return res.json({ success: false, message: "User not found" })
    }
    let cartData = userData?.cartData || {};
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= 1
      if (cartData[req.body.itemId] === 0) {
        delete cartData[req.body.itemId]
      }
    }
    await userModel.findByIdAndUpdate(req.body.userId, { $set: { cartData } });
    console.log("removeFromCart updated cartData:", cartData);
    res.json({ success: true, message: "Removed From Cart" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error" })
  }
}
 
// @desc Get user cart
// @route POST /api/cart/get
// @access Private
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    console.log("getCart - userId:", req.body.userId || 'undefined');
    if (!userData) {
      return res.json({ success: false, message: "User not found" })
    }
    let cartData = userData.cartData
    res.json({ success: true, cartData })
 
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}
 
export { addToCart, removeFromCart, getCart }