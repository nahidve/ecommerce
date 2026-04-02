import { useEffect, useState } from "react";
import "./List.css";
import axios from "../../utils/axios";
import { toast } from "react-toastify";

const List = ({ url }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list?limit=1000`, {
      headers: {
        token: localStorage.getItem("adminToken"),
      },
    });
    console.log(response.data);
    if (response.data.success) setList(response.data.data);
    else toast.error("Error");
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId }, {
        headers: {
          token: localStorage.getItem("adminToken"),
        }
      });
      await fetchList();
      if (response.data.success) toast.success(response.data.message);
      else toast.error(response.data.message || "Error");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error removing food");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>FOOD LIST</p>
      <div className="list-table">
        <div className="list-table-format title ">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item, index) => (
          <div key={index} className="list-table-format">
            <img src={`${url}/images/` + item.image} alt="" />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>${item.price}</p>
            <p onClick={() => removeFood(item._id)} className="cursor">
              Remove
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
