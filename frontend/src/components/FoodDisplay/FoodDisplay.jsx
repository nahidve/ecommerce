import "./FoodDisplay.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { setPriceRange } from "../../store/slices/uiSlice.js";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const dispatch = useAppDispatch();
  const food_list = useAppSelector((state) => state.catalog.foodList);
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const priceRange = useAppSelector((state) => state.ui.priceRange);

  return (
    <div className="food-display" id="food-display">
      <div className="dishes">
        <h2>Top Dishes Near You</h2>

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
                  })
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
                  })
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="food-display-list">
        {food_list.map((item, index) => {
          const matchesCategory =
            category === "All" || item.category === category;

          const matchesSearch = item.category
            .toLowerCase()
            .includes(searchQuery);

          const matchesPrice =
            item.price >= priceRange.min && item.price <= priceRange.max;

          if (matchesCategory && matchesSearch && matchesPrice) {
            return (
              <FoodItem
                key={index}
                id={item._id}
                name={item.name}
                price={item.price}
                description={item.description}
                image={item.image}
                rating={item.rating}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default FoodDisplay;
