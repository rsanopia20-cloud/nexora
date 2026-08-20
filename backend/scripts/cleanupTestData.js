/**
 * Cleanup script for E2E test data created by scripts/runEndToEndTest.js.
 *
 * Dry run (default):
 *   node scripts/cleanupTestData.js
 *
 * Confirm delete:
 *   node scripts/cleanupTestData.js --confirm
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Link from '../models/Link.js';
import ClickEvent from '../models/ClickEvent.js';
import LinkUsage from '../models/LinkUsage.js';
import TrackingCode from '../models/TrackingCode.js';
import ConversionRecord from '../models/ConversionRecord.js';
import UploadBatch from '../models/UploadBatch.js';

dotenv.config();

const CONFIRM = process.argv.includes('--confirm');

function matchesTestUser(user) {
  const email = String(user.email || '').toLowerCase();
  const name = String(user.fullName || '').toLowerCase();
  return (
    email.startsWith('test-alpha-') ||
    email.startsWith('test-beta-') ||
    name === 'test user alpha' ||
    name === 'test user beta'
  );
}

function matchesTestLink(link) {
  return String(link.name || '').startsWith('TEST - E2E Demo Link');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const users = await User.find({}).select('_id fullName email mobile referralCode').lean();
  const testUsers = users.filter(matchesTestUser);
  const testUserIds = testUsers.map((u) => u._id);

  const links = await Link.find({}).select('_id name destination').lean();
  const testLinks = links.filter(matchesTestLink);
  const testLinkIds = testLinks.map((l) => l._id);

  const conversionRecords = await ConversionRecord.find({
    $or: [
      { linkId: { $in: testLinkIds } },
      { matchedUserId: { $in: testUserIds } },
      { clientCode: { $regex: /^TESTCODE00[1-4]-/ } },
    ],
  })
    .select('_id clientCode linkId matchedUserId uploadBatchId')
    .lean();

  const uploadBatchIds = [
    ...new Set(
      conversionRecords
        .map((r) => String(r.uploadBatchId || ''))
        .filter(Boolean)
    ),
  ];

  const uploadBatches = await UploadBatch.find({
    $or: [
      { _id: { $in: uploadBatchIds } },
      { linkId: { $in: testLinkIds } },
      { fileName: { $regex: /^e2e-upload-/i } },
    ],
  })
    .select('_id fileName linkId')
    .lean();

  const clickEvents = await ClickEvent.countDocuments({
    $or: [{ linkId: { $in: testLinkIds } }, { userId: { $in: testUserIds } }],
  });
  const linkUsages = await LinkUsage.countDocuments({
    $or: [{ linkId: { $in: testLinkIds } }, { userId: { $in: testUserIds } }],
  });
  const trackingCodes = await TrackingCode.countDocuments({
    $or: [{ linkId: { $in: testLinkIds } }, { userId: { $in: testUserIds } }],
  });

  console.log('=== E2E test data found ===');
  console.log(`Users (${testUsers.length}):`);
  for (const u of testUsers) {
    console.log(`  - ${u.fullName} | ${u.email} | ${u.mobile}`);
  }
  console.log(`Links (${testLinks.length}):`);
  for (const l of testLinks) {
    console.log(`  - ${l.name} (${l._id})`);
  }
  console.log(`ConversionRecords: ${conversionRecords.length}`);
  console.log(`UploadBatches: ${uploadBatches.length}`);
  console.log(`ClickEvents: ${clickEvents}`);
  console.log(`LinkUsages: ${linkUsages}`);
  console.log(`TrackingCodes: ${trackingCodes}`);

  if (!CONFIRM) {
    console.log('\nDry run only. Nothing was deleted.');
    console.log('To delete this data, run: node scripts/cleanupTestData.js --confirm');
    await mongoose.disconnect();
    return;
  }

  console.log('\nDeleting...');

  const deleted = {
    conversionRecords: (
      await ConversionRecord.deleteMany({
        $or: [
          { linkId: { $in: testLinkIds } },
          { matchedUserId: { $in: testUserIds } },
          { clientCode: { $regex: /^TESTCODE00[1-4]-/ } },
        ],
      })
    ).deletedCount,
    uploadBatches: (
      await UploadBatch.deleteMany({
        $or: [
          { _id: { $in: uploadBatches.map((b) => b._id) } },
          { linkId: { $in: testLinkIds } },
          { fileName: { $regex: /^e2e-upload-/i } },
        ],
      })
    ).deletedCount,
    clickEvents: (
      await ClickEvent.deleteMany({
        $or: [{ linkId: { $in: testLinkIds } }, { userId: { $in: testUserIds } }],
      })
    ).deletedCount,
    linkUsages: (
      await LinkUsage.deleteMany({
        $or: [{ linkId: { $in: testLinkIds } }, { userId: { $in: testUserIds } }],
      })
    ).deletedCount,
    trackingCodes: (
      await TrackingCode.deleteMany({
        $or: [{ linkId: { $in: testLinkIds } }, { userId: { $in: testUserIds } }],
      })
    ).deletedCount,
    links: (await Link.deleteMany({ _id: { $in: testLinkIds } })).deletedCount,
    users: (await User.deleteMany({ _id: { $in: testUserIds } })).deletedCount,
  };

  console.log('=== Deleted counts ===');
  console.log(JSON.stringify(deleted, null, 2));
  console.log('\n✓ Test data cleanup complete.');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Cleanup failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
