/**
 * Strip non-digits and compare the last 10 digits so +91 / spacing variants match.
 * e.g. "+91 8958535821" and "8958535821" both normalize to "8958535821".
 */
export function normalizeMobileLast10(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10) {
    return digits;
  }
  return digits.slice(-10);
}

export function mobilesMatch(rowMobile, userMobile) {
  const left = normalizeMobileLast10(rowMobile);
  const right = normalizeMobileLast10(userMobile);
  return left.length === 10 && right.length === 10 && left === right;
}

/**
 * Shared payable / self-account logic for auto-upload and manual admin matching.
 */
export function evaluateMatch(user, link, row, payableStatuses) {
  const appStatus = String(row?.appStatus || '').trim();
  const mobile = String(row?.mobile || '').trim();

  let isSelfAccount = false;
  let isPayable = false;
  let commissionAmount = 0;

  // Self-account: customer opened a broker account using their own referral link.
  // They must never earn commission on their own signup, even if App Status is payable.
  if (mobilesMatch(mobile, user.mobile)) {
    isSelfAccount = true;
  } else if (payableStatuses.includes(appStatus)) {
    isPayable = true;
    commissionAmount = link.commissionAmount;
  }

  return { isSelfAccount, isPayable, commissionAmount };
}
