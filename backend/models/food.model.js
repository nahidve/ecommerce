import mongoose from "mongoose"

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 }
})

// Index for category-based filtering (most common query)
foodSchema.index({ category: 1 });

// Index for sorting by rating (popular items)
foodSchema.index({ rating: -1 });

// Index for price range queries
foodSchema.index({ price: 1 });

// Compound index for category + price (filtering by category and sorting by price)
foodSchema.index({ category: 1, price: 1 });

// Compound index for search by name (text search)
foodSchema.index({ name: "text", description: "text" });

// Index for rating + category (top items in category)
foodSchema.index({ category: 1, rating: -1 });

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema)

export default foodModel