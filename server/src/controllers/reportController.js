import { Order } from '../models/Order.js';

export const exportOrdersCsv = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'seller') {
      query = { 'items.seller': req.user._id };
    } else if (req.user.role === 'buyer') {
      query = { buyer: req.user._id };
    }
    // Admin gets all orders

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    // Generate CSV lines
    const headers = ['Order Number', 'Date', 'Customer Name', 'Status', 'Payment Method', 'Payment Status', 'Total Amount (INR)', 'Items'];
    const rows = orders.map(o => {
      const itemsSummary = o.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join('; ');
      return [
        o.orderNumber,
        o.createdAt.toISOString().slice(0, 10),
        `"${o.buyerName.replace(/"/g, '""')}"`,
        o.status,
        o.paymentMethod,
        o.paymentStatus,
        o.totalAmount,
        `"${itemsSummary.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=mandiplus-orders-report-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
