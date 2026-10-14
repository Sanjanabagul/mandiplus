import { Order } from '../models/Order.js';

/**
 * Escapes a cell value for CSV output following RFC 4180 and prevents CSV formula injection.
 */
const escapeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // Prevent spreadsheet formula injection (=, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const exportOrdersCsv = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'seller' || req.user.role === 'farmer') {
      query = { 'items.seller': req.user._id };
    } else if (req.user.role === 'buyer') {
      query = { buyer: req.user._id };
    } else if (req.user.role === 'delivery') {
      query = { deliveryPartner: req.user._id };
    }
    // Admin role has empty query filter, querying all genuine database orders

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    // Headers
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Status',
      'Payment Method',
      'Payment Status',
      'Total Amount (INR)',
      'Items Summary'
    ];

    const rows = orders.map((o) => {
      const itemsList = Array.isArray(o.items) ? o.items : [];
      const itemsSummary = itemsList
        .map(i => `${i.name || 'Item'} (${i.quantity || 0} ${i.unit || 'unit'})`)
        .join('; ');

      const dateStr = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '';

      return [
        escapeCsvCell(o.orderNumber || ''),
        escapeCsvCell(dateStr),
        escapeCsvCell(o.buyerName || 'Walk-in Buyer'),
        escapeCsvCell(o.buyerEmail || ''),
        escapeCsvCell(o.status || 'pending'),
        escapeCsvCell(o.paymentMethod || 'cod'),
        escapeCsvCell(o.paymentStatus || 'pending'),
        escapeCsvCell(typeof o.totalAmount === 'number' ? o.totalAmount : 0),
        escapeCsvCell(itemsSummary)
      ].join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mandiplus-orders-report-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
