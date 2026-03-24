import mongoose from 'mongoose';
import orderModel from '../models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function comparePerformance() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Get a real user ID from your orders
  const sampleOrder = await orderModel.findOne({});
  if (!sampleOrder) {
    console.log('No orders found!');
    return;
  }
  
  const userId = sampleOrder.userId;
  console.log(`Testing with userId: ${userId}\n`);
  
  // Test 1: WITH INDEX (normal query)
  console.log('=== WITH INDEX (uses userId_1_createdAt_-1) ===');
  console.time('with index');
  const withIndex = await orderModel.find({ userId: userId }).sort({ createdAt: -1 });
  console.timeEnd('with index');
  console.log(`Found ${withIndex.length} orders\n`);
  
  // Test 2: WITHOUT INDEX (force collection scan)
  console.log('=== WITHOUT INDEX (collection scan) ===');
  console.time('without index');
  const withoutIndex = await orderModel.find({ userId: userId })
    .sort({ createdAt: -1 })
    .hint({ $natural: 1 });
  console.timeEnd('without index');
  console.log(`Found ${withoutIndex.length} orders\n`);
  
  // Show explain for each
  console.log('=== EXPLAIN WITH INDEX ===');
  const explainWith = await orderModel.find({ userId: userId })
    .sort({ createdAt: -1 })
    .explain('executionStats');
  console.log('Stage:', explainWith.queryPlanner.winningPlan.inputStage?.stage || explainWith.queryPlanner.winningPlan.stage);
  console.log('Docs examined:', explainWith.executionStats.totalDocsExamined);
  
  console.log('\n=== EXPLAIN WITHOUT INDEX ===');
  const explainWithout = await orderModel.find({ userId: userId })
    .sort({ createdAt: -1 })
    .hint({ $natural: 1 })
    .explain('executionStats');
  console.log('Stage:', explainWithout.queryPlanner.winningPlan.inputStage?.stage || explainWithout.queryPlanner.winningPlan.stage);
  console.log('Docs examined:', explainWithout.executionStats.totalDocsExamined);
  
  await mongoose.disconnect();
}

comparePerformance();