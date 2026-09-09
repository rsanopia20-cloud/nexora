/**
 * Shared bank-detail helpers for users and managers (Indian accounts).
 */

export const EMPTY_BANK_DETAILS = {
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
};

export function serializeBankDetails(bankDetails) {
  if (!bankDetails) {
    return { ...EMPTY_BANK_DETAILS, updatedAt: null };
  }
  return {
    bankName: bankDetails.bankName || '',
    accountHolderName: bankDetails.accountHolderName || '',
    accountNumber: bankDetails.accountNumber || '',
    ifscCode: bankDetails.ifscCode || '',
    updatedAt: bankDetails.updatedAt || null,
  };
}

export function hasCompleteBankDetails(bankDetails) {
  const data = serializeBankDetails(bankDetails);
  return Boolean(
    data.bankName &&
      data.accountHolderName &&
      data.accountNumber &&
      data.ifscCode
  );
}

/**
 * Validate and normalize bank payload.
 * Returns { ok, data } or { ok: false, errors: [{ field, message }] }.
 */
export function validateBankDetails(input = {}) {
  const errors = [];

  const bankName = String(input.bankName || '').trim().replace(/\s+/g, ' ');
  const accountHolderName = String(input.accountHolderName || '')
    .trim()
    .replace(/\s+/g, ' ');
  const accountNumber = String(input.accountNumber || '').replace(/\s+/g, '');
  const ifscCode = String(input.ifscCode || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (bankName.length < 2 || bankName.length > 100) {
    errors.push({
      field: 'bankName',
      message: 'Bank name must be between 2 and 100 characters',
    });
  } else if (!/^[A-Za-z0-9 .,&'()-]+$/.test(bankName)) {
    errors.push({
      field: 'bankName',
      message: 'Bank name contains invalid characters',
    });
  }

  if (accountHolderName.length < 2 || accountHolderName.length > 80) {
    errors.push({
      field: 'accountHolderName',
      message: 'Account holder name must be between 2 and 80 characters',
    });
  } else if (!/^[A-Za-z .']+$/.test(accountHolderName)) {
    errors.push({
      field: 'accountHolderName',
      message: 'Account holder name can only contain letters, spaces, dots, and apostrophes',
    });
  }

  if (!/^\d{9,18}$/.test(accountNumber)) {
    errors.push({
      field: 'accountNumber',
      message: 'Account number must be 9 to 18 digits',
    });
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
    errors.push({
      field: 'ifscCode',
      message: 'Enter a valid IFSC code (e.g. SBIN0001234)',
    });
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      updatedAt: new Date(),
    },
  };
}

/** Mongoose subdocument fields for User / Manager. */
export function bankDetailsSchemaFields(mongoose) {
  return {
    bankName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Bank name must be at most 100 characters'],
    },
    accountHolderName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Account holder name must be at most 80 characters'],
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: [18, 'Account number must be at most 18 digits'],
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: [11, 'IFSC code must be 11 characters'],
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  };
}
