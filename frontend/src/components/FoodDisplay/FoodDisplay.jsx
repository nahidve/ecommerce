import "./FoodDisplay.css"
import { useContext } from "react"
import { StoreContext } from "../../context/StoreContext"
import FoodItem from "../FoodItem/FoodItem"

const FoodDisplay = ({ category }) => {
  const { food_list, searchQuery } = useContext(StoreContext)

  return (
    <div className="food-display" id="food-display">
      <h2>Top Dishes Near You</h2>

      <div className="food-display-list">
        {food_list.map((item, index) => {

          // ✅ Category filter (existing)
          const matchesCategory =
            category === "All" || item.category === category

          // ⭐ Search filter (new - by category)
          const matchesSearch =
            item.category.toLowerCase().includes(searchQuery)

          // ✅ Combine both
          if (matchesCategory && matchesSearch) {
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
            )
          }

          return null
        })}
      </div>
    </div>
  )
}

export default FoodDisplay