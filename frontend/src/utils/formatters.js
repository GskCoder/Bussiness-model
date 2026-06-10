/**
 * Formatting utilities for currency, dates, and numbers.
 */

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertBelowThousand(n % 100) : '');
  }

  if (num === 0) return 'Zero Rupees Only';
  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const parts = [];

  if (rupees >= 10000000) { parts.push(convertBelowThousand(Math.floor(rupees / 10000000)) + ' Crore'); rupees %= 10000000; }
  if (rupees >= 100000) { parts.push(convertBelowThousand(Math.floor(rupees / 100000)) + ' Lakh'); rupees %= 100000; }
  if (rupees >= 1000) { parts.push(convertBelowThousand(Math.floor(rupees / 1000)) + ' Thousand'); rupees %= 1000; }
  if (rupees > 0) parts.push(convertBelowThousand(rupees));

  let result = parts.join(' ') + ' Rupees';
  if (paise > 0) result += ' and ' + convertBelowThousand(paise) + ' Paise';
  return result + ' Only';
}
