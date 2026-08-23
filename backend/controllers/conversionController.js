import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Link from '../models/Link.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import UploadBatch from '../models/UploadBatch.js';
import ConversionRecord from '../models/ConversionRecord.js';
import { evaluateMatch } from '../utils/matchEvaluation.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive referral match against UTM Medium or UTM Campaign.
 */
async function findUserByUtm(utmMedium, utmCampaign) {
  const candidates = [utmMedium, utmCampaign]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const user = await User.findOne({
      referralCode: { $regex: new RegExp(`^${escapeRegex(candidate)}$`, 'i') },
    }).select('_id mobile referralCode');

    if (user) {
      return user;
    }
  }

  return null;
}

function cell(row, key) {
  const value = row[key];
  if (value === undefined || value === null) {
    return '';
  }
  return value;
}

function normalizeHeaderKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Soft-read a field from any Excel column name (manual uploads have no fixed headers).
 */
function pickFlexibleField(row, aliases) {
  const wanted = aliases.map(normalizeHeaderKey);
  for (const [key, value] of Object.entries(row || {})) {
    if (wanted.includes(normalizeHeaderKey(key))) {
      return String(value ?? '').trim();
    }
  }
  return '';
}

function collectExcelColumns(rows) {
  const seen = new Set();
  const columns = [];
  for (const row of rows) {
    for (const key of Object.keys(row || {})) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
}

function serializeRawRow(row) {
  const raw = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (value === undefined || value === null) {
      raw[key] = '';
    } else if (value instanceof Date) {
      raw[key] = value.toISOString();
    } else {
      raw[key] = value;
    }
  }
  return raw;
}

async function buildEarningsDetail(
  userId,
  { includeUser = true, payableRecordsOnly = true } = {}
) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const match = { matchedUserId: userObjectId, isPayable: true };
  const recordsMatch = payableRecordsOnly
    ? match
    : { matchedUserId: userObjectId };

  const [byLinkRaw, recordDocs, userDoc] = await Promise.all([
    ConversionRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$linkId',
          accountCount: { $sum: 1 },
          totalEarned: { $sum: '$commissionAmount' },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$paidStatus', true] }, '$commissionAmount', 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ['$paidStatus', false] }, '$commissionAmount', 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'links',
          localField: '_id',
          foreignField: '_id',
          as: 'link',
        },
      },
      {
        $project: {
          _id: 0,
          linkId: '$_id',
          linkName: { $ifNull: [{ $arrayElemAt: ['$link.name', 0] }, 'Unknown link'] },
          accountCount: 1,
          totalEarned: 1,
          totalPaid: 1,
          totalPending: 1,
        },
      },
      { $sort: { totalPending: -1, totalEarned: -1 } },
    ]),
    ConversionRecord.find(recordsMatch)
      .populate('linkId', 'name')
      .populate('matchedUserId', 'fullName mobile')
      .populate('editHistory.editedBy', 'fullName')
      .select(
        'clientName clientCode appStatus commissionAmount paidStatus paidAt createdAt linkId matchedUserId isPayable editHistory'
      )
      .sort({ createdAt: -1 })
      .lean(),
    includeUser ? User.findById(userObjectId).select('fullName mobile referralCode').lean() : null,
  ]);

  const totals = byLinkRaw.reduce(
    (acc, row) => {
      acc.totalEarned += Number(row.totalEarned || 0);
      acc.totalPaid += Number(row.totalPaid || 0);
      acc.totalPending += Number(row.totalPending || 0);
      return acc;
    },
    { totalEarned: 0, totalPaid: 0, totalPending: 0 }
  );

  return {
    user: userDoc
      ? {
          id: userDoc._id,
          name: userDoc.fullName,
          phone: userDoc.mobile,
          referralCode: userDoc.referralCode || '',
        }
      : null,
    byLink: byLinkRaw,
    records: recordDocs.map((record) => ({
      id: record._id,
      clientName: record.clientName,
      clientCode: record.clientCode,
      appStatus: record.appStatus,
      commissionAmount: record.commissionAmount,
      paidStatus: Boolean(record.paidStatus),
      isPayable: Boolean(record.isPayable),
      paidAt: record.paidAt || null,
      createdAt: record.createdAt,
      linkName: record.linkId?.name || 'Unknown link',
      linkId: record.linkId?._id || record.linkId || null,
      matchedUserId: record.matchedUserId?._id || record.matchedUserId || null,
      matchedUserName: record.matchedUserId?.fullName || '',
      matchedUserPhone: record.matchedUserId?.mobile || '',
      editHistory: (record.editHistory || []).map((entry) => ({
        editedAt: entry.editedAt,
        changes: entry.changes,
        editorName:
          entry.editedBy?.fullName || entry.editorLabel || 'Admin',
      })),
    })),
    totalEarned: totals.totalEarned,
    totalPaid: totals.totalPaid,
    totalPending: totals.totalPending,
  };
}

export async function uploadConversionExcel(req, res) {
  try {
    const { linkId } = req.body;
    const mode =
      String(req.body.mode || 'auto').trim().toLowerCase() === 'manual'
        ? 'manual'
        : 'auto';

    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required (field name: file)',
      });
    }

    if (!linkId || !mongoose.Types.ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid linkId is required',
      });
    }

    const link = await Link.findById(linkId);

    if (!link) {
      return res.status(400).json({
        success: false,
        message: 'Link not found for the provided linkId',
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        success: false,
        message: 'The Excel file contains no sheets',
      });
    }

    // TODO: Multi-sheet support could be added later if needed (e.g. let admin pick a sheet).
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (mode === 'manual') {
      return uploadManualConversionExcel({ req, res, link, rows });
    }

    return uploadAutoConversionExcel({ req, res, link, rows });
  } catch (error) {
    console.error('uploadConversionExcel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process conversion upload',
    });
  }
}

async function uploadAutoConversionExcel({ req, res, link, rows }) {
  const payableStatuses = await Settings.getPayableStatuses();

  const batch = await UploadBatch.create({
    linkId: link._id,
    fileName: req.file.originalname || 'upload.xlsx',
    mode: 'auto',
    uploadedBy: req.user?._id || null,
    totalRows: rows.length,
  });

  let autoMatchedCount = 0;
  let unmatchedCount = 0;
  let selfAccountCount = 0;
  let duplicateSkippedCount = 0;

  for (const row of rows) {
    try {
      const clientCode = String(cell(row, 'Client Code')).trim();

      if (!clientCode) {
        console.warn('Skipping row with empty Client Code');
        continue;
      }

      const existing = await ConversionRecord.findOne({
        linkId: link._id,
        clientCode,
      }).select('_id');

      if (existing) {
        duplicateSkippedCount += 1;
        continue;
      }

      const clientName = String(cell(row, 'Client Name')).trim();
      const mobile = String(cell(row, 'Mobile') || '').trim();
      const appStatus = String(cell(row, 'App Status')).trim();
      const utmMedium = String(cell(row, 'UTM Medium')).trim();
      const utmCampaign = String(cell(row, 'UTM Campaign')).trim();

      const matchedUser = await findUserByUtm(utmMedium, utmCampaign);

      let matchType = 'unmatched';
      let matchedUserId = null;
      let isSelfAccount = false;
      let isPayable = false;
      let commissionAmount = 0;

      if (matchedUser) {
        matchType = 'auto';
        matchedUserId = matchedUser._id;
        autoMatchedCount += 1;

        const evaluation = evaluateMatch(
          matchedUser,
          link,
          { mobile, appStatus },
          payableStatuses
        );
        isSelfAccount = evaluation.isSelfAccount;
        isPayable = evaluation.isPayable;
        commissionAmount = evaluation.commissionAmount;

        if (isSelfAccount) {
          selfAccountCount += 1;
        }
      } else {
        unmatchedCount += 1;
      }

      await ConversionRecord.create({
        uploadBatchId: batch._id,
        linkId: link._id,
        uploadMode: 'auto',
        clientCode,
        clientName,
        mobile,
        appStatus,
        utmMedium,
        utmCampaign,
        matchedUserId,
        matchType,
        isSelfAccount,
        isPayable,
        commissionAmount,
      });
    } catch (rowError) {
      console.error('Conversion row processing failed:', rowError);
    }
  }

  batch.autoMatchedCount = autoMatchedCount;
  batch.unmatchedCount = unmatchedCount;
  batch.selfAccountCount = selfAccountCount;
  batch.duplicateSkippedCount = duplicateSkippedCount;
  await batch.save();

  return res.status(201).json({
    success: true,
    mode: 'auto',
    uploadBatchId: batch._id,
    totalRows: batch.totalRows,
    autoMatchedCount,
    unmatchedCount,
    selfAccountCount,
    duplicateSkippedCount,
  });
}

async function uploadManualConversionExcel({ req, res, link, rows }) {
  const columns = collectExcelColumns(rows);

  const batch = await UploadBatch.create({
    linkId: link._id,
    fileName: req.file.originalname || 'upload.xlsx',
    mode: 'manual',
    columns,
    uploadedBy: req.user?._id || null,
    totalRows: rows.length,
  });

  let unmatchedCount = 0;
  let duplicateSkippedCount = 0;
  let importedCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    try {
      const rawData = serializeRawRow(row);
      const detectedClientCode = pickFlexibleField(rawData, [
        'Client Code',
        'ClientCode',
        'Client ID',
        'ClientId',
        'Client No',
        'Account Code',
        'AccountCode',
      ]);
      const clientName = pickFlexibleField(rawData, [
        'Client Name',
        'ClientName',
        'Name',
        'Customer Name',
        'CustomerName',
      ]);
      const mobile = pickFlexibleField(rawData, [
        'Mobile',
        'Mobile No',
        'Mobile Number',
        'Phone',
        'Phone Number',
        'Contact',
      ]);
      const appStatus = pickFlexibleField(rawData, [
        'App Status',
        'AppStatus',
        'Status',
        'Application Status',
      ]);
      const utmMedium = pickFlexibleField(rawData, [
        'UTM Medium',
        'Utm Medium',
        'utm_medium',
      ]);
      const utmCampaign = pickFlexibleField(rawData, [
        'UTM Campaign',
        'Utm Campaign',
        'utm_campaign',
      ]);

      const hasRealClientCode = Boolean(detectedClientCode);
      const clientCode = hasRealClientCode
        ? detectedClientCode
        : `MANUAL:${batch._id}:${index + 1}`;

      if (hasRealClientCode) {
        const existing = await ConversionRecord.findOne({
          linkId: link._id,
          clientCode,
        }).select('_id');

        if (existing) {
          duplicateSkippedCount += 1;
          continue;
        }
      }

      await ConversionRecord.create({
        uploadBatchId: batch._id,
        linkId: link._id,
        uploadMode: 'manual',
        rawData,
        rowIndex: index + 1,
        clientCode,
        clientName,
        mobile,
        appStatus,
        utmMedium,
        utmCampaign,
        matchedUserId: null,
        matchType: 'unmatched',
        isSelfAccount: false,
        isPayable: false,
        commissionAmount: 0,
      });

      unmatchedCount += 1;
      importedCount += 1;
    } catch (rowError) {
      console.error('Manual conversion row processing failed:', rowError);
    }
  }

  batch.unmatchedCount = unmatchedCount;
  batch.duplicateSkippedCount = duplicateSkippedCount;
  batch.autoMatchedCount = 0;
  batch.selfAccountCount = 0;
  await batch.save();

  return res.status(201).json({
    success: true,
    mode: 'manual',
    uploadBatchId: batch._id,
    totalRows: batch.totalRows,
    importedCount,
    unmatchedCount,
    duplicateSkippedCount,
    autoMatchedCount: 0,
    selfAccountCount: 0,
    columns,
  });
}

export async function listManualBatches(req, res) {
  try {
    const batches = await UploadBatch.find({ mode: 'manual' })
      .populate('linkId', 'name')
      .sort({ uploadedAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: batches.length,
      batches: batches.map((batch) => ({
        id: batch._id,
        fileName: batch.fileName,
        linkId: batch.linkId?._id || batch.linkId,
        linkName: batch.linkId?.name || '—',
        totalRows: batch.totalRows,
        unmatchedCount: batch.unmatchedCount,
        duplicateSkippedCount: batch.duplicateSkippedCount,
        columns: batch.columns || [],
        uploadedAt: batch.uploadedAt,
      })),
    });
  } catch (error) {
    console.error('listManualBatches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to list manual upload batches',
    });
  }
}

export async function getManualBatchDetail(req, res) {
  try {
    const { batchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch id',
      });
    }

    const batch = await UploadBatch.findById(batchId).populate('linkId', 'name').lean();

    if (!batch || batch.mode !== 'manual') {
      return res.status(404).json({
        success: false,
        message: 'Manual upload batch not found',
      });
    }

    const statusFilter = String(req.query.status || 'pending').toLowerCase();
    const recordFilter = {
      uploadBatchId: batch._id,
      uploadMode: 'manual',
    };

    if (statusFilter === 'pending') {
      recordFilter.matchType = 'unmatched';
    } else if (statusFilter === 'assigned') {
      recordFilter.matchType = { $in: ['manual', 'auto'] };
    } else if (statusFilter === 'ignored') {
      recordFilter.matchType = 'ignored';
    }

    const records = await ConversionRecord.find(recordFilter)
      .populate('matchedUserId', 'fullName mobile referralCode')
      .sort({ rowIndex: 1, createdAt: 1 })
      .lean();

    const columns =
      Array.isArray(batch.columns) && batch.columns.length
        ? batch.columns
        : collectExcelColumns(records.map((row) => row.rawData || {}));

    return res.json({
      success: true,
      batch: {
        id: batch._id,
        fileName: batch.fileName,
        linkId: batch.linkId?._id || batch.linkId,
        linkName: batch.linkId?.name || '—',
        totalRows: batch.totalRows,
        unmatchedCount: batch.unmatchedCount,
        duplicateSkippedCount: batch.duplicateSkippedCount,
        columns,
        uploadedAt: batch.uploadedAt,
      },
      count: records.length,
      records: records.map((record) => ({
        id: record._id,
        rowIndex: record.rowIndex,
        matchType: record.matchType,
        clientCode: record.clientCode,
        clientName: record.clientName,
        mobile: record.mobile,
        appStatus: record.appStatus,
        rawData: record.rawData || {},
        matchedUser: record.matchedUserId
          ? {
              id: record.matchedUserId._id,
              name: record.matchedUserId.fullName,
              phone: record.matchedUserId.mobile,
              referralCode: record.matchedUserId.referralCode,
            }
          : null,
        createdAt: record.createdAt,
      })),
    });
  } catch (error) {
    console.error('getManualBatchDetail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch manual upload batch',
    });
  }
}

export async function getUnmatchedRecords(req, res) {
  try {
    // Auto-upload leftovers only — manual sheets are reviewed on the Manual Review page.
    const filter = {
      matchType: 'unmatched',
      uploadMode: { $ne: 'manual' },
    };

    if (req.query.linkId && mongoose.Types.ObjectId.isValid(req.query.linkId)) {
      filter.linkId = req.query.linkId;
    }

    if (
      req.query.uploadBatchId &&
      mongoose.Types.ObjectId.isValid(req.query.uploadBatchId)
    ) {
      filter.uploadBatchId = req.query.uploadBatchId;
    }

    const records = await ConversionRecord.find(filter)
      .populate('linkId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('getUnmatchedRecords error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch unmatched records',
    });
  }
}

export async function searchUsers(req, res) {
  try {
    const query = String(req.query.query || '').trim();

    if (!query) {
      return res.json({ success: true, users: [] });
    }

    const pattern = new RegExp(escapeRegex(query), 'i');
    const users = await User.find({
      $or: [{ fullName: pattern }, { mobile: pattern }, { referralCode: pattern }],
    })
      .select('_id fullName mobile referralCode')
      .limit(10)
      .lean();

    return res.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        name: user.fullName,
        phone: user.mobile,
        referralCode: user.referralCode,
      })),
    });
  } catch (error) {
    console.error('searchUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to search users',
    });
  }
}

export async function updateUserReferralCode(req, res) {
  try {
    const { userId } = req.params;
    const referralCode = String(req.body?.referralCode || '').trim();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
      });
    }

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'referralCode is required',
      });
    }

    const taken = await User.findOne({
      _id: { $ne: userId },
      referralCode: { $regex: new RegExp(`^${escapeRegex(referralCode)}$`, 'i') },
    }).select('_id');

    if (taken) {
      return res.status(400).json({
        success: false,
        message: 'This referral code is already in use by another user.',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { referralCode },
      { new: true, runValidators: true }
    ).select('_id fullName email mobile referralCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        phone: user.mobile,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This referral code is already in use by another user.',
      });
    }
    console.error('updateUserReferralCode error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update referral code',
    });
  }
}

export async function manuallyMatchRecord(req, res) {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid userId is required',
      });
    }

    const record = await ConversionRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Conversion record not found',
      });
    }

    if (record.matchType !== 'unmatched') {
      return res.status(400).json({
        success: false,
        message: 'Only unmatched records can be manually assigned',
      });
    }

    const user = await User.findById(userId).select('_id fullName mobile referralCode');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found for the provided userId',
      });
    }

    const link = await Link.findById(record.linkId);

    if (!link) {
      return res.status(400).json({
        success: false,
        message: 'Associated link not found',
      });
    }

    const payableStatuses = await Settings.getPayableStatuses();
    const mobile =
      record.mobile ||
      pickFlexibleField(record.rawData || {}, [
        'Mobile',
        'Mobile No',
        'Mobile Number',
        'Phone',
        'Phone Number',
        'Contact',
      ]);
    const appStatus =
      record.appStatus ||
      pickFlexibleField(record.rawData || {}, [
        'App Status',
        'AppStatus',
        'Status',
        'Application Status',
      ]);

    const { isSelfAccount, isPayable, commissionAmount } = evaluateMatch(
      user,
      link,
      { mobile, appStatus },
      payableStatuses
    );

    if (!record.mobile && mobile) record.mobile = mobile;
    if (!record.appStatus && appStatus) record.appStatus = appStatus;

    record.matchedUserId = user._id;
    record.matchType = 'manual';
    record.isSelfAccount = isSelfAccount;
    record.isPayable = isPayable;
    record.commissionAmount = commissionAmount;
    await record.save();

    if (record.uploadMode === 'manual' && record.uploadBatchId) {
      await UploadBatch.updateOne(
        { _id: record.uploadBatchId, unmatchedCount: { $gt: 0 } },
        { $inc: { unmatchedCount: -1 } }
      );
    }

    return res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('manuallyMatchRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to assign conversion record',
    });
  }
}

export async function ignoreRecord(req, res) {
  try {
    const record = await ConversionRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Conversion record not found',
      });
    }

    if (record.matchType !== 'unmatched') {
      return res.status(400).json({
        success: false,
        message: 'Only unmatched records can be ignored',
      });
    }

    record.matchType = 'ignored';
    record.matchedUserId = null;
    record.isSelfAccount = false;
    record.isPayable = false;
    record.commissionAmount = 0;
    await record.save();

    if (record.uploadMode === 'manual' && record.uploadBatchId) {
      await UploadBatch.updateOne(
        { _id: record.uploadBatchId, unmatchedCount: { $gt: 0 } },
        { $inc: { unmatchedCount: -1 } }
      );
    }

    return res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('ignoreRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to ignore conversion record',
    });
  }
}

export async function getCustomerEarningsSummary(_req, res) {
  try {
    const summary = await ConversionRecord.aggregate([
      {
        $match: {
          isPayable: true,
          matchedUserId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$matchedUserId',
          totalAccounts: { $sum: 1 },
          totalEarned: { $sum: '$commissionAmount' },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$paidStatus', true] }, '$commissionAmount', 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ['$paidStatus', false] }, '$commissionAmount', 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalAccounts: 1,
          totalEarned: 1,
          totalPaid: 1,
          totalPending: 1,
          name: { $ifNull: [{ $arrayElemAt: ['$user.fullName', 0] }, 'Unknown user'] },
          phone: { $ifNull: [{ $arrayElemAt: ['$user.mobile', 0] }, '' ] },
          referralCode: { $ifNull: [{ $arrayElemAt: ['$user.referralCode', 0] }, '' ] },
        },
      },
      { $sort: { totalPending: -1, totalEarned: -1 } },
    ]);

    return res.json({
      success: true,
      customers: summary,
    });
  } catch (error) {
    console.error('getCustomerEarningsSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch customer earnings summary',
    });
  }
}

export async function getCustomerEarningsDetail(req, res) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
      });
    }

    const detail = await buildEarningsDetail(userId, {
      includeUser: true,
      payableRecordsOnly: false,
    });
    if (!detail.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      ...detail,
    });
  } catch (error) {
    console.error('getCustomerEarningsDetail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch customer earnings detail',
    });
  }
}

export async function markCustomerAsPaid(req, res) {
  try {
    const { userId } = req.params;
    const { recordIds } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
      });
    }

    const baseFilter = {
      matchedUserId: userId,
      isPayable: true,
      paidStatus: false,
    };

    if (Array.isArray(recordIds) && recordIds.length) {
      const validIds = recordIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== recordIds.length) {
        return res.status(400).json({
          success: false,
          message: 'recordIds must all be valid record ids',
        });
      }
      baseFilter._id = { $in: validIds };
    }

    const targetRecords = await ConversionRecord.find(baseFilter)
      .select('_id commissionAmount')
      .lean();

    if (!targetRecords.length) {
      return res.json({
        success: true,
        updatedCount: 0,
        totalAmountMarkedPaid: 0,
      });
    }

    const ids = targetRecords.map((row) => row._id);
    const totalAmountMarkedPaid = targetRecords.reduce(
      (sum, row) => sum + Number(row.commissionAmount || 0),
      0
    );

    const now = new Date();
    await ConversionRecord.updateMany(
      { _id: { $in: ids } },
      { $set: { paidStatus: true, paidAt: now } }
    );

    return res.json({
      success: true,
      updatedCount: ids.length,
      totalAmountMarkedPaid,
    });
  } catch (error) {
    console.error('markCustomerAsPaid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to mark customer records as paid',
    });
  }
}

export async function editConversionRecord(req, res) {
  try {
    const record = await ConversionRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Conversion record not found',
      });
    }

    const body = req.body || {};
    const changeParts = [];

    if (Object.prototype.hasOwnProperty.call(body, 'matchedUserId')) {
      const nextUserId = body.matchedUserId || null;

      if (nextUserId && !mongoose.Types.ObjectId.isValid(nextUserId)) {
        return res.status(400).json({
          success: false,
          message: 'A valid matchedUserId is required',
        });
      }

      const currentId = record.matchedUserId ? String(record.matchedUserId) : '';
      const nextId = nextUserId ? String(nextUserId) : '';

      if (currentId !== nextId) {
        const [oldUser, newUser] = await Promise.all([
          currentId
            ? User.findById(currentId).select('fullName').lean()
            : null,
          nextId ? User.findById(nextId).select('fullName').lean() : null,
        ]);

        if (nextId && !newUser) {
          return res.status(400).json({
            success: false,
            message: 'User not found for the provided matchedUserId',
          });
        }

        const oldName = oldUser?.fullName || currentId || 'unassigned';
        const newName = newUser?.fullName || 'unassigned';
        changeParts.push(`matchedUserId reassigned from ${oldName} to ${newName}`);
        record.matchedUserId = nextUserId || null;
        record.matchType = 'manual';
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isPayable')) {
      const nextPayable = Boolean(body.isPayable);
      if (Boolean(record.isPayable) !== nextPayable) {
        changeParts.push(`isPayable changed from ${Boolean(record.isPayable)} to ${nextPayable}`);
        record.isPayable = nextPayable;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'commissionAmount')) {
      const nextAmount = Number(body.commissionAmount);
      if (!Number.isFinite(nextAmount) || nextAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'commissionAmount must be a number of 0 or more',
        });
      }
      const currentAmount = Number(record.commissionAmount || 0);
      if (currentAmount !== nextAmount) {
        changeParts.push(`commissionAmount changed from ${currentAmount} to ${nextAmount}`);
        record.commissionAmount = nextAmount;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'paidStatus')) {
      const nextPaid = Boolean(body.paidStatus);
      if (Boolean(record.paidStatus) !== nextPaid) {
        changeParts.push(`paidStatus changed from ${Boolean(record.paidStatus)} to ${nextPaid}`);
        record.paidStatus = nextPaid;
        if (nextPaid && !record.paidAt) {
          record.paidAt = new Date();
        }
        if (!nextPaid) {
          record.paidAt = null;
        }
      }
    }

    if (!changeParts.length) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided',
      });
    }

    record.editHistory.push({
      editedBy: req.user?._id || null,
      editorLabel: req.user?.fullName || 'Admin',
      editedAt: new Date(),
      changes: changeParts.join('; '),
    });

    await record.save();

    const populated = await ConversionRecord.findById(record._id)
      .populate('matchedUserId', 'fullName mobile')
      .populate('linkId', 'name')
      .populate('editHistory.editedBy', 'fullName');

    return res.json({
      success: true,
      record: populated,
    });
  } catch (error) {
    console.error('editConversionRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to edit conversion record',
    });
  }
}

export async function getMyEarnings(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const detail = await buildEarningsDetail(userId, { includeUser: false });
    return res.json({
      success: true,
      byLink: detail.byLink,
      records: detail.records,
      totalEarned: detail.totalEarned,
      totalPaid: detail.totalPaid,
      totalPending: detail.totalPending,
    });
  } catch (error) {
    console.error('getMyEarnings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch your earnings',
    });
  }
}
