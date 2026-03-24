import mongoose from 'mongoose';
import userModel from '../models/user.model.js';
import orderModel from '../models/food.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function testIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get first user
    const user = await userModel.findOne({ email: /test/ });
    if (!user) {
      console.log('❌ No test users found. Run generate-test-data.js first\n');
      await mongoose.disconnect();
      return;
    }
    console.log(`Testing with user: ${user.email} (ID: ${user._id})\n`);

    // TEST 1: User by email
    console.log('=== TEST 1: Find user by email ===');
    const userExplain = await userModel.find({ email: user.email }).explain('executionStats');
    console.log('Index used:', userExplain.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN');
    console.log('Documents examined:', userExplain.executionStats.totalDocsExamined);
    console.log('Execution time:', userExplain.executionStats.executionTimeMillis, 'ms\n');

    // TEST 2: Orders by userId sorted by createdAt
    console.log('=== TEST 2: Orders by userId sorted by createdAt ===');
    const orderExplain = await orderModel.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .explain('executionStats');
    console.log('Index used:', orderExplain.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN');
    console.log('Documents examined:', orderExplain.executionStats.totalDocsExamined);
    console.log('Execution time:', orderExplain.executionStats.executionTimeMillis, 'ms\n');

    // TEST 3: Orders by status
    console.log('=== TEST 3: Orders by status ===');
    const statusExplain = await orderModel.find({ status: 'Delivered' })
      .explain('executionStats');
    console.log('Index used:', statusExplain.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN');
    console.log('Documents examined:', statusExplain.executionStats.totalDocsExamined);
    console.log('Execution time:', statusExplain.executionStats.executionTimeMillis, 'ms\n');

    // TEST 4: Orders by payment and status
    console.log('=== TEST 4: Orders by payment=true and status=Delivered ===');
    const compoundExplain = await orderModel.find({ payment: true, status: 'Delivered' })
      .explain('executionStats');
    console.log('Index used:', compoundExplain.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN');
    console.log('Documents examined:', compoundExplain.executionStats.totalDocsExamined);
    console.log('Execution time:', compoundExplain.executionStats.executionTimeMillis, 'ms\n');

    // TEST 5: Index usage statistics
    console.log('=== INDEX USAGE STATISTICS ===');
    const userIndexStats = await userModel.collection.aggregate([{ $indexStats: {} }]).toArray();
    console.log('Users collection indexes:');
    userIndexStats.forEach(stat => {
      console.log(`  - ${stat.name}: ${stat.accesses.ops} accesses`);
    });

    const orderIndexStats = await orderModel.collection.aggregate([{ $indexStats: {} }]).toArray();
    console.log('\nOrders collection indexes:');
    orderIndexStats.forEach(stat => {
      console.log(`  - ${stat.name}: ${stat.accesses.ops} accesses`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Index testing complete');

  } catch (error) {
    console.error('Error testing indexes:', error);
    await mongoose.disconnect();
  }
}

testIndexes();