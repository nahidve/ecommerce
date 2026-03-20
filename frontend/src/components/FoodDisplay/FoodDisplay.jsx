import "./FoodDisplay.css";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const { food_list, searchQuery, priceRange, setPriceRange } =
    useContext(StoreContext);

  return (
    <div className="food-display" id="food-display">
      <div className="dishes">
        <h2>Top Dishes Near You</h2>

      {/* ⭐ PRICE FILTER UI */}
      <div className="price-filter">
        <p className="filter-title">Filter by Price</p>

        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min === 0 ? "" : priceRange.min}
            onChange={(e) =>
              setPriceRange((prev) => ({
                ...prev,
                min: Number(e.target.value) || 0,
              }))
            }
          />

          <span className="dash">-</span>

          <input
            type="number"
            placeholder="Max"
            value={priceRange.max === Infinity ? "" : priceRange.max}
            onChange={(e) =>
              setPriceRange((prev) => ({
                ...prev,
                max: Number(e.target.value) || Infinity,
              }))
            }
          />
        </div>
      </div>
      </div>

      <div className="food-display-list">
        {food_list.map((item, index) => {
          // ✅ Category filter
          const matchesCategory =
            category === "All" || item.category === category;

          // ✅ Search filter
          const matchesSearch = item.category
            .toLowerCase()
            .includes(searchQuery);

          // ⭐ Price filter
          const matchesPrice =
            item.price >= priceRange.min && item.price <= priceRange.max;

          // ✅ Combine ALL filters
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
