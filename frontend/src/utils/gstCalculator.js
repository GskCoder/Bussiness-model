/**
 * GST Calculator — handles CGST/SGST vs IGST based on state matching.
 */

export function calculateItemGST(unitPrice, quantity, discount, gstPercentage, isInterState) {
  const taxableValue = (unitPrice * quantity) - discount;
  const gstAmount = taxableValue * gstPercentage / 100;

  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: Math.round(gstAmount * 100) / 100,
      total: Math.round((taxableValue + gstAmount) * 100) / 100,
      taxableValue: Math.round(taxableValue * 100) / 100,
    };
  } else {
    const halfGST = Math.round(gstAmount / 2 * 100) / 100;
    return {
      cgst: halfGST,
      sgst: halfGST,
      igst: 0,
      total: Math.round((taxableValue + gstAmount) * 100) / 100,
      taxableValue: Math.round(taxableValue * 100) / 100,
    };
  }
}

export function calculateCartTotals(items, isInterState, overallDiscount = 0) {
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  items.forEach(item => {
    const gst = calculateItemGST(
      item.selling_price || item.unit_price,
      item.quantity,
      item.discount || 0,
      item.gst_percentage,
      isInterState
    );
    subtotal += gst.taxableValue;
    totalCGST += gst.cgst;
    totalSGST += gst.sgst;
    totalIGST += gst.igst;
  });

  const grandTotal = Math.round((subtotal + totalCGST + totalSGST + totalIGST - overallDiscount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: Math.round(totalCGST * 100) / 100,
    sgst: Math.round(totalSGST * 100) / 100,
    igst: Math.round(totalIGST * 100) / 100,
    discount: overallDiscount,
    grandTotal,
  };
}
