import "./FoodDisplay.css";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { setPriceRange } from "../../store/slices/uiSlice.js";
import { fetchFoodList } from "../../store/slices/catalogSlice.js";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const dispatch = useAppDispatch();

  const food_list = useAppSelector((state) => state.catalog.foodList);
  const status = useAppSelector((state) => state.catalog.status);

  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const priceRange = useAppSelector((state) => state.ui.priceRange);

  const { pagination } = useAppSelector((state) => state.catalog);

  const [page, setPage] = useState(1);

  // Fetch from backend whenever filters change
  useEffect(() => {
    dispatch(
      fetchFoodList({
        category,
        search: searchQuery,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        page,
        limit: 8,
      }),
    );
  }, [category, searchQuery, priceRange, page, dispatch]);

  useEffect(() => {
    setPage(1);
  }, [category, searchQuery, priceRange]);

  return (
    <div className="food-display" id="food-display">
      <div className="dishes">
        <h2>Top Dishes Near You</h2>

        {/* Price Filter UI */}
        <div className="price-filter">
          <p className="filter-title">Filter by Price</p>

          <div className="price-inputs">
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min === 0 ? "" : priceRange.min}
              onChange={(e) =>
                dispatch(
                  setPriceRange({
                    ...priceRange,
                    min: Number(e.target.value) || 0,
                  }),
                )
              }
            />

            <span className="dash">-</span>

            <input
              type="number"
              placeholder="Max"
              value={priceRange.max === Infinity ? "" : priceRange.max}
              onChange={(e) =>
                dispatch(
                  setPriceRange({
                    ...priceRange,
                    max: Number(e.target.value) || Infinity,
                  }),
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Food List */}
      <div className="food-display-list">
        {status === "loading" ? (
          <p>Loading...</p>
        ) : food_list.length === 0 ? (
          <p>No items found</p>
        ) : (
          food_list.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              price={item.price}
              description={item.description}
              image={item.image}
              rating={item.rating}
            />
          ))
        )}
      </div>

      {/* PAGINATION UI */}
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Prev
        </button>

        <span>
          Page {pagination?.page || 1} of {pagination?.pages || 1}
        </span>

        <button
          disabled={page === pagination?.pages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FoodDisplay;
