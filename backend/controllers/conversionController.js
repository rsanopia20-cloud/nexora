import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Link, { LINK_SORT } from '../models/Link.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import UploadBatch from '../models/UploadBatch.js';
import ConversionRecord from '../models/ConversionRecord.js';
import {
  evaluateMatch,
  isPayableAppStatus,
  mobilesMatch,
  normalizeMobileLast10,
  splitCommission,
} from '../utils/matchEvaluation.js';
import Manager from '../models/Manager.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
              $cond: [{ $ne: ['$paidStatus', true] }, '$commissionAmount', 0],
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
      clientCode: String(record.clientCode || '').startsWith('MANUAL:')
        ? ''
        : record.clientCode || '',
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

    return uploadManualConversionExcel({ req, res, link, rows });
  } catch (error) {
    console.error('uploadConversionExcel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process conversion upload',
    });
  }
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
        mobileNormalized: normalizeMobileLast10(mobile),
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
      recordFilter.matchType = { $in: ['manual', 'auto', 'claimed'] };
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
        isPayable: Boolean(record.isPayable),
        commissionAmount: Number(record.commissionAmount || 0),
        claimedAt: record.claimedAt || null,
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
              $cond: [{ $ne: ['$paidStatus', true] }, '$commissionAmount', 0],
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
      paidStatus: { $ne: true },
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

export async function getManagerEarningsSummary(_req, res) {
  try {
    const summary = await ConversionRecord.aggregate([
      {
        $match: {
          matchedManagerId: { $ne: null },
          matchType: 'claimed',
          managerCommissionAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$matchedManagerId',
          totalAccounts: { $sum: 1 },
          totalEarned: { $sum: '$managerCommissionAmount' },
          totalPaid: {
            $sum: {
              $cond: [
                { $eq: ['$managerPaidStatus', true] },
                '$managerCommissionAmount',
                0,
              ],
            },
          },
          totalPending: {
            $sum: {
              $cond: [
                { $ne: ['$managerPaidStatus', true] },
                '$managerCommissionAmount',
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'managers',
          localField: '_id',
          foreignField: '_id',
          as: 'manager',
        },
      },
      {
        $project: {
          _id: 0,
          managerId: '$_id',
          totalAccounts: 1,
          totalEarned: 1,
          totalPaid: 1,
          totalPending: 1,
          name: {
            $ifNull: [{ $arrayElemAt: ['$manager.fullName', 0] }, 'Unknown manager'],
          },
          code: {
            $ifNull: [{ $arrayElemAt: ['$manager.managerId', 0] }, ''],
          },
          phone: {
            $ifNull: [{ $arrayElemAt: ['$manager.mobile', 0] }, ''],
          },
          active: {
            $ifNull: [{ $arrayElemAt: ['$manager.active', 0] }, false],
          },
        },
      },
      { $sort: { totalPending: -1, totalEarned: -1 } },
    ]);

    return res.json({
      success: true,
      managers: summary,
    });
  } catch (error) {
    console.error('getManagerEarningsSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch manager earnings summary',
    });
  }
}

export async function getManagerEarningsDetail(req, res) {
  try {
    const { managerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manager id',
      });
    }

    const manager = await Manager.findById(managerId)
      .select('managerId fullName email mobile active')
      .lean();

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    const managerObjectId = new mongoose.Types.ObjectId(managerId);
    const match = {
      matchedManagerId: managerObjectId,
      matchType: 'claimed',
      managerCommissionAmount: { $gt: 0 },
    };

    const [byLinkRaw, recordDocs] = await Promise.all([
      ConversionRecord.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$linkId',
            accountCount: { $sum: 1 },
            totalEarned: { $sum: '$managerCommissionAmount' },
            totalPaid: {
              $sum: {
                $cond: [
                  { $eq: ['$managerPaidStatus', true] },
                  '$managerCommissionAmount',
                  0,
                ],
              },
            },
            totalPending: {
              $sum: {
                $cond: [
                  { $ne: ['$managerPaidStatus', true] },
                  '$managerCommissionAmount',
                  0,
                ],
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
            linkName: {
              $ifNull: [{ $arrayElemAt: ['$link.name', 0] }, 'Unknown link'],
            },
            accountCount: 1,
            totalEarned: 1,
            totalPaid: 1,
            totalPending: 1,
          },
        },
        { $sort: { totalPending: -1, totalEarned: -1 } },
      ]),
      ConversionRecord.find(match)
        .populate('linkId', 'name')
        .populate('matchedUserId', 'fullName mobile')
        .select(
          'clientName clientCode appStatus commissionAmount managerCommissionAmount totalCommissionAmount managerPaidStatus managerPaidAt claimedAt createdAt linkId matchedUserId'
        )
        .sort({ claimedAt: -1, createdAt: -1 })
        .lean(),
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

    return res.json({
      success: true,
      manager: {
        id: manager._id,
        managerId: manager.managerId,
        name: manager.fullName,
        email: manager.email || '',
        phone: manager.mobile || '',
        active: Boolean(manager.active),
      },
      byLink: byLinkRaw,
      records: recordDocs.map((record) => ({
        id: record._id,
        clientName: record.clientName || 'Referred account',
        clientCode: String(record.clientCode || '').startsWith('MANUAL:')
          ? ''
          : record.clientCode || '',
        appStatus: record.appStatus || '',
        linkName: record.linkId?.name || 'Unknown link',
        linkId: record.linkId?._id || record.linkId || null,
        claimedByName: record.matchedUserId?.fullName || 'Unknown user',
        claimedByPhone: record.matchedUserId?.mobile || '',
        claimedByUserId: record.matchedUserId?._id || record.matchedUserId || null,
        userAmount: Number(record.commissionAmount || 0),
        managerAmount: Number(record.managerCommissionAmount || 0),
        totalAmount: Number(
          record.totalCommissionAmount ||
            Number(record.commissionAmount || 0) +
              Number(record.managerCommissionAmount || 0)
        ),
        paidStatus: Boolean(record.managerPaidStatus),
        paidAt: record.managerPaidAt || null,
        claimedAt: record.claimedAt || record.createdAt,
      })),
      totalEarned: totals.totalEarned,
      totalPaid: totals.totalPaid,
      totalPending: totals.totalPending,
    });
  } catch (error) {
    console.error('getManagerEarningsDetail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch manager earnings detail',
    });
  }
}

export async function markManagerAsPaid(req, res) {
  try {
    const { managerId } = req.params;
    const { recordIds } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manager id',
      });
    }

    const baseFilter = {
      matchedManagerId: managerId,
      matchType: 'claimed',
      managerCommissionAmount: { $gt: 0 },
      managerPaidStatus: { $ne: true },
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
      .select('_id managerCommissionAmount')
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
      (sum, row) => sum + Number(row.managerCommissionAmount || 0),
      0
    );

    const now = new Date();
    await ConversionRecord.updateMany(
      { _id: { $in: ids } },
      { $set: { managerPaidStatus: true, managerPaidAt: now } }
    );

    return res.json({
      success: true,
      updatedCount: ids.length,
      totalAmountMarkedPaid,
    });
  } catch (error) {
    console.error('markManagerAsPaid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to mark manager records as paid',
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

/**
 * Links a user can filter by when searching for accounts to claim.
 * Uses the active campaign link pool (accounts can exist under any link).
 */
export async function listClaimLinks(_req, res) {
  try {
    const links = await Link.find({ active: true })
      .sort(LINK_SORT)
      .select('name')
      .lean();

    return res.json({
      success: true,
      links: links.map((link) => ({ id: link._id, name: link.name })),
    });
  } catch (error) {
    console.error('listClaimLinks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load links',
    });
  }
}

/**
 * Exact-match search (by full mobile or client code) within one link so a user
 * can find the accounts they referred and claim the payable ones. Never returns
 * partial matches or full-sheet listings.
 */
export async function searchClaimableRecords(req, res) {
  try {
    const linkId = String(req.query.linkId || '').trim();
    const query = String(req.query.query || '').trim();

    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid link first',
      });
    }

    if (!query) {
      return res.json({ success: true, records: [] });
    }

    const link = await Link.findById(linkId).select('name commissionAmount');
    if (!link) {
      return res.status(400).json({
        success: false,
        message: 'Link not found',
      });
    }

    // Exact client-code match always; add exact mobile match only when a full
    // 10-digit number was entered (no partial-number leaks).
    const digits = query.replace(/\D/g, '');
    const orConditions = [
      { clientCode: { $regex: new RegExp(`^${escapeRegex(query)}$`, 'i') } },
    ];
    if (digits.length >= 10) {
      orConditions.push({ mobileNormalized: digits.slice(-10) });
    }

    const records = await ConversionRecord.find({
      linkId: link._id,
      uploadMode: 'manual',
      $or: orConditions,
    })
      .populate('matchedUserId', '_id')
      .limit(20)
      .lean();

    const payableStatuses = await Settings.getPayableStatuses();
    const currentUserId = String(req.user._id);
    const userSharePreview = splitCommission(link.commissionAmount).userAmount;

    const mapped = records.map((record) => {
      const appStatus = String(record.appStatus || '').trim();
      const isReady = isPayableAppStatus(appStatus, payableStatuses);
      const isSelf = mobilesMatch(record.mobile, req.user.mobile);
      const claimedById = record.matchedUserId
        ? String(record.matchedUserId._id || record.matchedUserId)
        : '';
      const claimedByMe = claimedById && claimedById === currentUserId;
      const isTaken = record.matchType !== 'unmatched';

      let status = 'claimable';
      let claimable = false;

      if (isSelf) {
        status = 'self';
      } else if (claimedByMe) {
        status = 'claimed_by_you';
      } else if (isTaken) {
        status = 'unavailable';
      } else if (!isReady) {
        status = 'not_ready';
      } else {
        claimable = true;
      }

      return {
        id: record._id,
        linkName: link.name,
        clientName: record.clientName || '',
        clientCode: String(record.clientCode || '').startsWith('MANUAL:')
          ? ''
          : record.clientCode || '',
        mobile: record.mobile || '',
        appStatus,
        status,
        claimable,
        // User-facing amount is always their share only (never the manager cut).
        amount: claimable
          ? userSharePreview
          : claimedByMe
            ? Number(record.commissionAmount || 0)
            : 0,
      };
    });

    return res.json({ success: true, records: mapped });
  } catch (error) {
    console.error('searchClaimableRecords error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to search accounts',
    });
  }
}

/**
 * Claim a single account. Requires a valid active Manager ID. Commission is split
 * 70% user / 30% manager; the user response only includes their share.
 * Atomic on matchType so the same record can never be claimed twice.
 */
export async function claimRecord(req, res) {
  try {
    const recordId = String(req.body?.recordId || '').trim();
    const managerCode = String(req.body?.managerId || '')
      .trim()
      .toUpperCase();

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid recordId is required',
      });
    }

    if (!managerCode) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required to claim this earning',
      });
    }

    const manager = await Manager.findOne({ managerId: managerCode }).select(
      '_id managerId active'
    );

    if (!manager || !manager.active) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Manager ID. Ask your manager for the correct ID.',
      });
    }

    const record = await ConversionRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (record.matchType !== 'unmatched') {
      return res.status(409).json({
        success: false,
        message: 'This account has already been claimed.',
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
    const evaluation = evaluateMatch(
      req.user,
      link,
      { mobile: record.mobile, appStatus: record.appStatus },
      payableStatuses
    );

    if (evaluation.isSelfAccount) {
      return res.status(400).json({
        success: false,
        message: 'This is your own account, so it is not eligible for a commission.',
      });
    }

    if (!evaluation.isPayable) {
      return res.status(400).json({
        success: false,
        message: 'This account is not Ready To Trade yet, so it cannot be claimed.',
      });
    }

    const split = splitCommission(evaluation.commissionAmount);

    // Atomic guard: only the first claim wins.
    const updated = await ConversionRecord.findOneAndUpdate(
      { _id: record._id, matchType: 'unmatched' },
      {
        $set: {
          matchedUserId: req.user._id,
          matchedManagerId: manager._id,
          matchType: 'claimed',
          isSelfAccount: false,
          isPayable: true,
          totalCommissionAmount: split.totalAmount,
          commissionAmount: split.userAmount,
          managerCommissionAmount: split.managerAmount,
          paidStatus: false,
          paidAt: null,
          managerPaidStatus: false,
          managerPaidAt: null,
          claimedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'This account has already been claimed.',
      });
    }

    if (updated.uploadBatchId) {
      await UploadBatch.updateOne(
        { _id: updated.uploadBatchId, unmatchedCount: { $gt: 0 } },
        { $inc: { unmatchedCount: -1 } }
      );
    }

    return res.json({
      success: true,
      recordId: updated._id,
      amount: Number(updated.commissionAmount || 0),
    });
  } catch (error) {
    console.error('claimRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to claim this account',
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

/**
 * Manager view of their 30% share from user claims that used their Manager ID.
 */
export async function getMyManagerEarnings(req, res) {
  try {
    const managerObjectId = req.manager?._id;
    if (!managerObjectId) {
      return res.status(401).json({
        success: false,
        message: 'Manager authentication required',
      });
    }

    const match = {
      matchedManagerId: managerObjectId,
      matchType: 'claimed',
      managerCommissionAmount: { $gt: 0 },
    };

    const [byLinkRaw, recordDocs, totalsAgg] = await Promise.all([
      ConversionRecord.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$linkId',
            accountCount: { $sum: 1 },
            totalEarned: { $sum: '$managerCommissionAmount' },
            totalPaid: {
              $sum: {
                $cond: [
                  { $eq: ['$managerPaidStatus', true] },
                  '$managerCommissionAmount',
                  0,
                ],
              },
            },
            totalPending: {
              $sum: {
                $cond: [
                  { $ne: ['$managerPaidStatus', true] },
                  '$managerCommissionAmount',
                  0,
                ],
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
            linkName: {
              $ifNull: [{ $arrayElemAt: ['$link.name', 0] }, 'Unknown link'],
            },
            accountCount: 1,
            totalEarned: 1,
            totalPaid: 1,
            totalPending: 1,
          },
        },
        { $sort: { totalPending: -1, totalEarned: -1 } },
      ]),
      ConversionRecord.find(match)
        .populate('linkId', 'name')
        .populate('matchedUserId', 'fullName mobile')
        .select(
          'clientName clientCode appStatus managerCommissionAmount managerPaidStatus managerPaidAt claimedAt createdAt linkId matchedUserId'
        )
        .sort({ claimedAt: -1, createdAt: -1 })
        .limit(200)
        .lean(),
      ConversionRecord.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalEarned: { $sum: '$managerCommissionAmount' },
            totalPaid: {
              $sum: {
                $cond: [
                  { $eq: ['$managerPaidStatus', true] },
                  '$managerCommissionAmount',
                  0,
                ],
              },
            },
            totalPending: {
              $sum: {
                $cond: [
                  { $ne: ['$managerPaidStatus', true] },
                  '$managerCommissionAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const totals = totalsAgg[0] || {
      totalEarned: 0,
      totalPaid: 0,
      totalPending: 0,
    };

    return res.json({
      success: true,
      byLink: byLinkRaw,
      records: recordDocs.map((record) => ({
        id: record._id,
        clientName: record.clientName || 'Referred account',
        clientCode: String(record.clientCode || '').startsWith('MANUAL:')
          ? ''
          : record.clientCode || '',
        appStatus: record.appStatus || '',
        amount: Number(record.managerCommissionAmount || 0),
        paidStatus: Boolean(record.managerPaidStatus),
        paidAt: record.managerPaidAt || null,
        claimedAt: record.claimedAt || record.createdAt,
        linkName: record.linkId?.name || 'Unknown link',
        claimedByName: record.matchedUserId?.fullName || 'Unknown user',
        claimedByPhone: record.matchedUserId?.mobile || '',
      })),
      totalEarned: Number(totals.totalEarned || 0),
      totalPaid: Number(totals.totalPaid || 0),
      totalPending: Number(totals.totalPending || 0),
    });
  } catch (error) {
    console.error('getMyManagerEarnings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch manager earnings',
    });
  }
}
