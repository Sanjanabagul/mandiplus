import { Hub } from '../models/Hub.js';
import { Product } from '../models/Product.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryMovement } from '../models/InventoryMovement.js';

/**
 * Ensures a default primary Mandi+ Hub exists in the database.
 */
export const getDefaultHub = async () => {
  let hub = await Hub.findOne({ code: 'HUB-PUN-01' });
  if (!hub) {
    hub = await Hub.create({
      name: 'Mandi+ Hub Central (Pune)',
      code: 'HUB-PUN-01',
      address: {
        street: 'Gate 4, APMC Commercial Fulfillment Enclave, Market Yard',
        locality: 'Gultekdi',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411037',
        coordinates: { lat: 18.4965, lng: 73.8642 }
      },
      phone: '+91-1800-MANDI-HUB',
      email: 'hub.pune@mandiplus.com',
      capacityMetricTons: 100,
      operatingHours: { open: '05:00 AM', close: '11:00 PM' },
      isActive: true
    });
  }
  return hub;
};

/**
 * Recalculates and synchronizes sellable catalog stock from active inventory batches.
 */
export const syncProductStockFromBatches = async (productId, hubId) => {
  const query = {
    product: productId,
    isSellable: true,
    qualityStatus: 'accepted'
  };
  if (hubId) {
    query.hub = hubId;
  }

  const batches = await InventoryBatch.find(query);
  const totalSellable = batches.reduce((sum, b) => {
    const available = Math.max(0, (b.remainingQuantity || 0) - (b.reservedQuantity || 0));
    return sum + available;
  }, 0);

  const distinctFarmers = [...new Set(batches.map(b => b.sourceFarmer.toString()))];

  await Product.findByIdAndUpdate(productId, {
    stockQuantity: Math.max(0, totalSellable),
    isAvailable: totalSellable > 0,
    sourceFarmers: distinctFarmers,
    fulfilledBy: 'Mandi+ Hub'
  });

  return totalSellable;
};

/**
 * Reserves stock atomically across batches using FIFO/FEFO.
 */
export const reserveStockAcrossBatches = async ({ productId, quantity, hubId, orderId, orderNumber, actor }) => {
  const query = {
    product: productId,
    hub: hubId,
    isSellable: true,
    qualityStatus: 'accepted'
  };

  // Sort by expiry date ascending if present (FEFO), else by received date (FIFO)
  const batches = await InventoryBatch.find(query).sort({ expiryDate: 1, receivedAt: 1 });

  let needed = quantity;
  const allocations = [];

  for (const batch of batches) {
    const available = Math.max(0, (batch.remainingQuantity || 0) - (batch.reservedQuantity || 0));
    if (available <= 0) continue;

    const allocQty = Math.min(available, needed);
    batch.reservedQuantity = (batch.reservedQuantity || 0) + allocQty;
    await batch.save();

    allocations.push({
      batch: batch._id,
      batchNumber: batch.batchNumber,
      farmer: batch.sourceFarmer,
      farmerName: batch.farmerName,
      quantity: allocQty,
      purchaseCost: batch.purchaseCostPerUnit
    });

    // Record inventory reservation movement
    const product = await Product.findById(productId);
    await InventoryMovement.create({
      hub: hubId,
      batch: batch._id,
      batchNumber: batch.batchNumber,
      product: productId,
      productName: product?.name || 'Produce Item',
      movementType: 'reserve_order',
      quantityDelta: -allocQty,
      balanceAfter: batch.remainingQuantity - batch.reservedQuantity,
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      reason: `Stock reserved for Customer Order #${orderNumber || 'Pending'}`,
      actor: actor?._id || null,
      actorName: actor?.name || 'Mandi+ Checkout Engine'
    });

    needed -= allocQty;
    if (needed <= 0) break;
  }

  if (needed > 0) {
    // Release what was reserved so far to prevent partial leak
    for (const alloc of allocations) {
      await InventoryBatch.findByIdAndUpdate(alloc.batch, {
        $inc: { reservedQuantity: -alloc.quantity }
      });
    }
    throw new Error(`Insufficient sellable batch stock at Mandi+ Hub. Short by ${needed} units.`);
  }

  await syncProductStockFromBatches(productId, hubId);
  return allocations;
};

/**
 * Releases batch reservations (e.g. upon order cancellation or payment expiration).
 */
export const releaseStockReservations = async ({ allocatedBatches, hubId, orderId, orderNumber, actor }) => {
  if (!allocatedBatches || allocatedBatches.length === 0) return;

  for (const alloc of allocatedBatches) {
    const batch = await InventoryBatch.findById(alloc.batch);
    if (!batch) continue;

    batch.reservedQuantity = Math.max(0, (batch.reservedQuantity || 0) - alloc.quantity);
    await batch.save();

    const product = await Product.findById(batch.product);
    await InventoryMovement.create({
      hub: hubId || batch.hub,
      batch: batch._id,
      batchNumber: batch.batchNumber,
      product: batch.product,
      productName: product?.name || 'Produce Item',
      movementType: 'release_reservation',
      quantityDelta: alloc.quantity,
      balanceAfter: batch.remainingQuantity - batch.reservedQuantity,
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      reason: `Stock reservation released for Order #${orderNumber || ''}`,
      actor: actor?._id || null,
      actorName: actor?.name || 'Mandi+ Order Lifecycle'
    });

    await syncProductStockFromBatches(batch.product, batch.hub);
  }
};

/**
 * Finalizes sale dispatch from inventory batches upon customer delivery handover.
 */
export const dispatchStockSales = async ({ allocatedBatches, hubId, orderId, orderNumber, actor }) => {
  if (!allocatedBatches || allocatedBatches.length === 0) return;

  for (const alloc of allocatedBatches) {
    const batch = await InventoryBatch.findById(alloc.batch);
    if (!batch) continue;

    batch.reservedQuantity = Math.max(0, (batch.reservedQuantity || 0) - alloc.quantity);
    batch.remainingQuantity = Math.max(0, (batch.remainingQuantity || 0) - alloc.quantity);
    batch.soldQuantity = (batch.soldQuantity || 0) + alloc.quantity;

    if (batch.remainingQuantity <= 0) {
      batch.qualityStatus = 'depleted';
      batch.isSellable = false;
    }
    await batch.save();

    const product = await Product.findById(batch.product);
    await InventoryMovement.create({
      hub: hubId || batch.hub,
      batch: batch._id,
      batchNumber: batch.batchNumber,
      product: batch.product,
      productName: product?.name || 'Produce Item',
      movementType: 'dispatch_sale',
      quantityDelta: -alloc.quantity,
      balanceAfter: batch.remainingQuantity,
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      reason: `Produce dispatched & fulfilled for Order #${orderNumber || ''}`,
      actor: actor?._id || null,
      actorName: actor?.name || 'Mandi+ Hub Dispatch'
    });

    await syncProductStockFromBatches(batch.product, batch.hub);
  }
};
