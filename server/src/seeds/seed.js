import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Notification } from '../models/Notification.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Hub } from '../models/Hub.js';
import { FarmerSupplyRequest } from '../models/FarmerSupplyRequest.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { FarmerSettlement } from '../models/FarmerSettlement.js';
import { categoriesSeed, usersSeed, productsSeed } from './seedData.js';
import { getDefaultHub, syncProductStockFromBatches } from '../services/hubService.js';

export const runSeed = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database demo seeding is strictly prohibited in production mode to protect genuine records.');
  }

  try {
    console.log('[Seed] Starting Mandi+ centralized hub database seeding...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // 1. Provision Central Mandi+ Hub
    const defaultHub = await getDefaultHub();
    console.log(`[Seed] Provisioned Mandi+ Hub: ${defaultHub.name} (${defaultHub.code})`);

    // 2. Seed Categories
    console.log('[Seed] Seeding product categories...');
    for (const cat of categoriesSeed) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] Seeded ${categoriesSeed.length} categories.`);

    // 3. Seed Users
    console.log('[Seed] Seeding platform personas...');
    const userMap = {};
    for (const userData of usersSeed) {
      let existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        try {
          existingUser = await User.create(userData);
        } catch (createErr) {
          if (createErr.code === 11000) {
            existingUser = await User.findOne({ email: userData.email });
          } else {
            throw createErr;
          }
        }
      }
      Object.assign(existingUser, {
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        businessName: userData.businessName,
        locality: userData.locality,
        status: userData.status || 'active',
        approvalStatus: userData.approvalStatus || (['buyer', 'admin', 'hub_operator'].includes(userData.role) ? 'not_required' : 'approved'),
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        sellerProfile: userData.sellerProfile || existingUser.sellerProfile,
        deliveryProfile: userData.deliveryProfile || existingUser.deliveryProfile
      });
      await existingUser.save();
      userMap[userData.email] = existingUser;
    }
    console.log(`[Seed] Seeded ${Object.keys(userMap).length} users.`);

    // 4. Seed Produce Catalog Products fulfilled by Mandi+ Hub
    console.log('[Seed] Seeding catalog produce items fulfilled by Mandi+ Hub...');
    const farmerA = userMap['farmer@mandiplus.com']; // Rajesh Patil
    const farmerB = userMap['ramesh@mandiplus.com']; // Rameshwar Khot
    const farmerC = userMap['sunita@mandiplus.com']; // Sunita Deshmukh

    const createdProducts = {};

    for (let i = 0; i < productsSeed.length; i++) {
      const p = productsSeed[i];
      let assignedFarmer = farmerA;
      if (i % 3 === 1) assignedFarmer = farmerB;
      if (i % 3 === 2) assignedFarmer = farmerC;

      const product = await Product.findOneAndUpdate(
        { name: p.name },
        {
          ...p,
          hub: defaultHub._id,
          fulfilledBy: 'Mandi+ Hub',
          seller: assignedFarmer ? assignedFarmer._id : null,
          sellerName: 'Mandi+ Hub Partner Farmers',
          sourceFarmers: assignedFarmer ? [assignedFarmer._id] : [],
          pickupLocality: 'Mandi+ Central Fulfilment Hub (Pune)',
          isAvailable: true,
          approvalStatus: 'approved'
        },
        { upsert: true, new: true }
      );
      createdProducts[p.name] = product;
    }
    console.log(`[Seed] Seeded ${productsSeed.length} catalog produce items.`);

    // 5. Seed Farmer Inbound Supplies & Batch Inventory (Farmer A/B/C Scenario)
    console.log('[Seed] Seeding Farmer A/B/C produce supply requests and inventory batches at Mandi+ Hub...');

    const supplyConfigs = [
      {
        farmer: farmerA,
        productName: 'Hybrid Salad Tomatoes (Farm Fresh)',
        produceName: 'Hybrid Salad Tomatoes',
        category: 'Vegetables',
        unit: 'kg',
        quantity: 500,
        purchasePrice: 22,
        sellingPrice: 32,
        batchNumber: 'BATCH-TOM-202610-101'
      },
      {
        farmer: farmerB,
        productName: 'Nashik Red Onions (Export Quality)',
        produceName: 'Nashik Red Onions',
        category: 'Vegetables',
        unit: 'kg',
        quantity: 600,
        purchasePrice: 20,
        sellingPrice: 28,
        batchNumber: 'BATCH-ONI-202610-102'
      },
      {
        farmer: farmerC,
        productName: 'Jyoti Table Potatoes (Cold Store Fresh)',
        produceName: 'Fresh Jyoti Table Potatoes',
        category: 'Vegetables',
        unit: 'kg',
        quantity: 800,
        purchasePrice: 18,
        sellingPrice: 24,
        batchNumber: 'BATCH-POT-202610-103'
      }
    ];

    for (const sc of supplyConfigs) {
      if (!sc.farmer) continue;
      const product = createdProducts[sc.productName] || await Product.findOne({ name: sc.productName });
      if (!product) continue;

      let supplyReq = await FarmerSupplyRequest.findOne({ requestNumber: `SR-${sc.batchNumber}` });
      if (!supplyReq) {
        supplyReq = await FarmerSupplyRequest.create({
          requestNumber: `SR-${sc.batchNumber}`,
          farmer: sc.farmer._id,
          farmerName: sc.farmer.name,
          farmerPhone: sc.farmer.phone,
          hub: defaultHub._id,
          hubName: defaultHub.name,
          product: product._id,
          produceName: sc.produceName,
          category: sc.category,
          unit: sc.unit,
          proposedQuantity: sc.quantity,
          proposedPricePerUnit: sc.purchasePrice,
          harvestDate: new Date(Date.now() - 3600000 * 48),
          qualityGradeProposed: 'Grade A',
          status: 'accepted',
          reviewedBy: userMap['admin@mandiplus.com']?._id,
          reviewedAt: new Date(Date.now() - 3600000 * 36),
          reviewNotes: 'Standard A-grade shipment accepted for hub stock.',
          receiving: {
            receivedQuantity: sc.quantity,
            acceptedQuantity: sc.quantity,
            rejectedQuantity: 0,
            gradeAssigned: 'Grade A',
            inspectionNotes: 'Clean, undamaged, moisture within permissible APMC limits.',
            inspectedBy: userMap['hub@mandiplus.com']?._id || userMap['admin@mandiplus.com']?._id,
            inspectedAt: new Date(Date.now() - 3600000 * 24),
            agreedPurchasePricePerUnit: sc.purchasePrice,
            batchNumber: sc.batchNumber
          },
          statusHistory: [
            { status: 'submitted', note: 'Supply request submitted by farmer.', timestamp: new Date(Date.now() - 3600000 * 48) },
            { status: 'approved_for_delivery', note: 'Approved for delivery to Mandi+ Hub.', timestamp: new Date(Date.now() - 3600000 * 36) },
            { status: 'accepted', note: `Physical receipt & QC pass: ${sc.quantity} ${sc.unit} accepted.`, timestamp: new Date(Date.now() - 3600000 * 24) }
          ]
        });
      }

      let batch = await InventoryBatch.findOne({ batchNumber: sc.batchNumber });
      if (!batch) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 10);

        batch = await InventoryBatch.create({
          batchNumber: sc.batchNumber,
          hub: defaultHub._id,
          product: product._id,
          sourceFarmer: sc.farmer._id,
          farmerName: sc.farmer.name,
          supplyRequest: supplyReq._id,
          receivedQuantity: sc.quantity,
          remainingQuantity: sc.quantity,
          reservedQuantity: 0,
          soldQuantity: 0,
          rejectedQuantity: 0,
          unit: sc.unit,
          purchaseCostPerUnit: sc.purchasePrice,
          sellingPricePerUnit: sc.sellingPrice,
          qualityGrade: 'Grade A',
          qualityStatus: 'accepted',
          isSellable: true,
          binLocation: 'BAY-A1',
          storageCondition: 'Temperature Controlled APMC Pod',
          receivedAt: new Date(Date.now() - 3600000 * 24),
          expiryDate
        });

        supplyReq.receiving.inventoryBatch = batch._id;
        await supplyReq.save();

        await InventoryMovement.create({
          hub: defaultHub._id,
          batch: batch._id,
          batchNumber: sc.batchNumber,
          product: product._id,
          productName: product.name,
          movementType: 'receive_inbound',
          quantityDelta: sc.quantity,
          balanceAfter: sc.quantity,
          reason: `Initial seed inbound receiving from ${sc.farmer.name}`,
          actor: userMap['hub@mandiplus.com']?._id,
          actorName: 'Kavita Joshi'
        });

        // Create settlement
        await FarmerSettlement.create({
          settlementNumber: `SETTL-${sc.batchNumber}`,
          farmer: sc.farmer._id,
          farmerName: sc.farmer.name,
          farmerPhone: sc.farmer.phone,
          hub: defaultHub._id,
          hubName: defaultHub.name,
          supplyRequest: supplyReq._id,
          batch: batch._id,
          produceName: sc.produceName,
          acceptedQuantity: sc.quantity,
          unit: sc.unit,
          ratePerUnit: sc.purchasePrice,
          grossPayable: sc.quantity * sc.purchasePrice,
          deductions: 0,
          netPayable: sc.quantity * sc.purchasePrice,
          paidAmount: 0,
          settlementStatus: 'approved',
          notes: 'Standard approved settlement for accepted hub produce.'
        });
      }

      await syncProductStockFromBatches(product._id, defaultHub._id);
    }
    console.log('[Seed] Created traceable inventory batches and farmer settlements.');

    // 6. Seed a Consolidated Multi-Farmer Order for Buyer
    const buyer = userMap['buyer@mandiplus.com'];
    const deliveryPartner = userMap['delivery@mandiplus.com'];

    const tomatoProd = await Product.findOne({ name: 'Hybrid Salad Tomatoes (Farm Fresh)' });
    const onionProd = await Product.findOne({ name: 'Nashik Red Onions (Export Quality)' });
    const potatoProd = await Product.findOne({ name: 'Jyoti Table Potatoes (Cold Store Fresh)' });

    if (buyer && tomatoProd && onionProd && potatoProd && deliveryPartner) {
      const existingOrder = await Order.findOne({ buyer: buyer._id });
      if (!existingOrder) {
        const orderNumber = 'MP-202610-10001';

        const orderItems = [
          {
            product: tomatoProd._id,
            name: tomatoProd.name,
            image: tomatoProd.images[0] || '',
            category: tomatoProd.category,
            unit: 'kg',
            seller: farmerA._id,
            sellerName: 'Mandi+ Hub',
            unitPrice: tomatoProd.pricePerUnit || 32,
            quantity: 2,
            subtotal: (tomatoProd.pricePerUnit || 32) * 2,
            allocatedBatches: [{
              batchNumber: 'BATCH-TOM-202610-101',
              farmer: farmerA._id,
              farmerName: farmerA.name,
              quantity: 2,
              purchaseCost: 22
            }],
            pickStatus: 'picked',
            pickedQuantity: 2
          },
          {
            product: onionProd._id,
            name: onionProd.name,
            image: onionProd.images[0] || '',
            category: onionProd.category,
            unit: 'kg',
            seller: farmerB._id,
            sellerName: 'Mandi+ Hub',
            unitPrice: onionProd.pricePerUnit || 28,
            quantity: 1,
            subtotal: (onionProd.pricePerUnit || 28) * 1,
            allocatedBatches: [{
              batchNumber: 'BATCH-ONI-202610-102',
              farmer: farmerB._id,
              farmerName: farmerB.name,
              quantity: 1,
              purchaseCost: 20
            }],
            pickStatus: 'picked',
            pickedQuantity: 1
          },
          {
            product: potatoProd._id,
            name: potatoProd.name,
            image: potatoProd.images[0] || '',
            category: potatoProd.category,
            unit: 'kg',
            seller: farmerC._id,
            sellerName: 'Mandi+ Hub',
            unitPrice: potatoProd.pricePerUnit || 24,
            quantity: 3,
            subtotal: (potatoProd.pricePerUnit || 24) * 3,
            allocatedBatches: [{
              batchNumber: 'BATCH-POT-202610-103',
              farmer: farmerC._id,
              farmerName: farmerC.name,
              quantity: 3,
              purchaseCost: 18
            }],
            pickStatus: 'picked',
            pickedQuantity: 3
          }
        ];

        const subtotal = orderItems.reduce((acc, i) => acc + i.subtotal, 0);
        const deliveryCharge = 50;
        const totalAmount = subtotal + deliveryCharge;

        const order = await Order.create({
          orderNumber,
          hub: defaultHub._id,
          hubName: defaultHub.name,
          fulfilledBy: 'Mandi+ Hub',
          buyer: buyer._id,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerPhone: buyer.phone,
          items: orderItems,
          subtotal,
          deliveryCharge,
          totalAmount,
          shippingAddress: buyer.addresses[0],
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          status: 'ready_for_pickup',
          statusHistory: [
            { status: 'confirmed', note: 'Consolidated order confirmed. Fulfilment scheduled at Mandi+ Hub.', timestamp: new Date(Date.now() - 3600000 * 2) },
            { status: 'processing_hub', note: 'Order assigned to picking workspace.', timestamp: new Date(Date.now() - 3600000 * 1.5) },
            { status: 'picking', note: 'Items picked from inventory bins BAY-A1.', timestamp: new Date(Date.now() - 3600000 * 1) },
            { status: 'packing', note: 'Consolidated parcel packed and quality-sealed.', timestamp: new Date(Date.now() - 3600000 * 0.5) },
            { status: 'ready_for_pickup', note: 'Order packed in 1 parcel. Ready for pickup at Mandi+ Hub dispatch bay.', timestamp: new Date(Date.now() - 3600000 * 0.2) }
          ],
          picking: {
            startedAt: new Date(Date.now() - 3600000 * 1.5),
            completedAt: new Date(Date.now() - 3600000 * 1),
            pickedBy: userMap['hub@mandiplus.com']?._id
          },
          packing: {
            startedAt: new Date(Date.now() - 3600000 * 1),
            completedAt: new Date(Date.now() - 3600000 * 0.5),
            packedBy: userMap['hub@mandiplus.com']?._id,
            packageCount: 1
          },
          pickupOtp: '4829',
          deliveryPartner: deliveryPartner._id
        });

        await DeliveryAssignment.create({
          order: order._id,
          deliveryPartner: deliveryPartner._id,
          pickupAddress: {
            hubId: defaultHub._id,
            hubName: defaultHub.name,
            supplierName: 'Mandi+ Central Fulfilment Hub Dispatch Bay 1',
            address: defaultHub.address.street,
            locality: defaultHub.address.locality,
            city: defaultHub.address.city,
            pincode: defaultHub.address.pincode,
            phone: defaultHub.phone
          },
          packageCount: 1,
          pickupOtpVerified: false,
          deliveryAddress: {
            recipientName: buyer.name,
            phone: buyer.phone,
            locality: 'Kothrud, Pune',
            city: 'Pune',
            pincode: '411038',
            instructions: 'Deliver before 11:00 AM at rear kitchen entrance.'
          },
          status: 'assigned'
        });

        console.log('[Seed] Created sample multi-farmer consolidated order fulfilled at Mandi+ Hub.');
      }
    }

    console.log('[Seed] Centralized Mandi+ Hub seeding completed successfully! ✅');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    throw err;
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
