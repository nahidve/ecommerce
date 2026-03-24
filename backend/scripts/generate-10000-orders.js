import mongoose from 'mongoose';
import userModel from '../models/user.model.js';
import orderModel from '../models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

const STATUSES = ['Food Processing', 'Preparing', 'Out for Delivery', 'Delivered'];
const FOOD_ITEMS = [
  { id: 'food1', name: 'Margherita Pizza', price: 12.99 },
  { id: 'food2', name: 'Pepperoni Pizza', price: 14.99 },
  { id: 'food3', name: 'Burger', price: 8.99 },
  { id: 'food4', name: 'Caesar Salad', price: 7.99 },
  { id: 'food5', name: 'Pasta Carbonara', price: 11.99 }
];

async function generateLargeDataset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // CLEAR EXISTING DATA FIRST
    console.log('Clearing existing test data...');
    await userModel.deleteMany({ email: { $regex: /test/ } });
    await orderModel.deleteMany({});
    console.log('Cleared existing test data\n');

    // Create 50 users
    const users = [];
    for (let i = 1; i <= 50; i++) {
      const user = await userModel.create({
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: '$2a$10$testhash',
        isVerified: i % 2 === 0,
        cartData: {}
      });
      users.push(user);
      if (i % 10 === 0) console.log(`Created ${i}/50 users`);
    }
    console.log(`\n✅ Created ${users.length} users\n`);

    // Generate 10,000 orders
    console.log('Generating 10,000 orders...');
    const orders = [];
    const batchSize = 1000;
    
    for (let i = 1; i <= 10000; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomItems = [];
      const numItems = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numItems; j++) {
        const food = FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)];
        randomItems.push({
          _id: food.id,
          name: food.name,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: food.price
        });
      }
      
      const totalAmount = randomItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const randomDate = new Date(2026, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
      
      orders.push({
        userId: randomUser._id.toString(),
        items: randomItems,
        amount: totalAmount,
        address: {
          street: `${Math.floor(Math.random() * 1000)} Test Street`,
          city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
          zip: Math.floor(Math.random() * 90000 + 10000)
        },
        status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
        payment: Math.random() > 0.3,
        date: randomDate,
        createdAt: randomDate,
        updatedAt: randomDate
      });
      
      // Insert in batches
      if (orders.length === batchSize) {
        await orderModel.insertMany(orders);
        console.log(`Inserted ${i} orders`);
        orders.length = 0;
      }
    }
    
    // Insert remaining orders
    if (orders.length > 0) {
      await orderModel.insertMany(orders);
      console.log(`Inserted final ${orders.length} orders`);
    }
    
    const totalOrders = await orderModel.countDocuments();
    const totalUsers = await userModel.countDocuments({ email: { $regex: /test/ } });
    console.log(`\n✅ Created ${totalUsers} users and ${totalOrders} orders total\n`);
    
    await mongoose.disconnect();
    console.log('Data generation complete!');
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

generateLargeDataset();