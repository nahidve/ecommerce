import { createSelector } from "@reduxjs/toolkit";

export const selectCartTotal = createSelector(
  [(state) => state.cart.items, (state) => state.catalog.foodList],
  (items, foodList) => {
    let totalAmount = 0;
    for (const itemId in items) {
      if (items[itemId] > 0) {
        const itemInfo = foodList.find(
          (product) => String(product._id) === String(itemId)
        );
        if (itemInfo) {
          totalAmount += itemInfo.price * items[itemId];
        }
      }
    }
    return totalAmount;
  }
);
