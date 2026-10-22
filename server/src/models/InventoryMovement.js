import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema({
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: true,
    index: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryBatch',
    required: true,
    index: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true
  },
  movementType: {
    type: String,
    enum: [
      'receive_inbound',
      'reserve_order',
      'release_reservation',
      'dispatch_sale',
      'manual_adjustment',
      'quarantine',
      'spoilage_damage',
      'return_restock'
    ],
    required: true,
    index: true
  },
  quantityDelta: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  orderNumber: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    default: ''
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorName: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

inventoryMovementSchema.index({ hub: 1, createdAt: -1 });
inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ batch: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
