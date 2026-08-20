import axios from 'axios';
import * as XLSX from 'xlsx';
import FormData from 'form-data';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const checks = [];
const context = {
  adminToken: null,
  userA: null,
  userB: null,
  link: null,
  uploadSummary: null,
  rowCodes: {},
  unmatchedRecordId: null,
};

function addCheck(name, pass, details = '') {
  checks.push({ name, pass, details });
  console.log(`${pass ? '✓' : '✗'} ${name}${details ? ` — ${details}` : ''}`);
}

function formatAxiosError(error) {
  if (error?.response) {
    const status = error.response.status;
    const payload = typeof error.response.data === 'string'
      ? error.response.data
      : JSON.stringify(error.response.data);
    return `HTTP ${status}: ${payload}`;
  }
  return error?.message || String(error);
}

async function runStep(stepNumber, title, handler, { fatal = false } = {}) {
  console.log(`\nSTEP ${stepNumber}: ${title}...`);
  try {
    await handler();
    console.log(`✓ STEP ${stepNumber} complete`);
    return true;
  } catch (error) {
    console.log(`✗ FAILED STEP ${stepNumber}: ${formatAxiosError(error)}`);
    if (fatal) {
      throw error;
    }
    return false;
  }
}

function makeHttpClient(token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return axios.create({
    baseURL: BASE_URL,
    timeout: 45000,
    headers,
    validateStatus: () => true,
  });
}

async function requestOrThrow(client, config) {
  const response = await client.request(config);
  if (response.status < 200 || response.status >= 300) {
    const error = new Error('Request failed');
    error.response = response;
    throw error;
  }
  return response.data;
}

function generateTimestamp() {
  return Date.now().toString();
}

/**
 * Signup validation requires: /^[6-9]\d{9}$/
 * Exactly 10 digits, first digit 6/7/8/9.
 */
function generateValidIndianMobile(exclude = new Set()) {
  const starts = [6, 7, 8, 9];
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const first = starts[Math.floor(Math.random() * starts.length)];
    let rest = '';
    for (let i = 0; i < 9; i += 1) {
      rest += Math.floor(Math.random() * 10).toString();
    }
    const phone = `${first}${rest}`;
    if (phone.length === 10 && /^[6-9]\d{9}$/.test(phone) && !exclude.has(phone)) {
      return phone;
    }
  }
  throw new Error('Unable to generate a valid unique Indian mobile number');
}

function extractLinkId(linkPayload) {
  if (!linkPayload) return null;
  return (
    linkPayload._id ||
    linkPayload.id ||
    linkPayload.linkId ||
    null
  );
}

function extractUserId(userPayload) {
  if (!userPayload) return null;
  return userPayload.id || userPayload._id || null;
}

function findReferralCodeFromSearchResults(users, queryText) {
  if (!Array.isArray(users)) return null;
  const q = String(queryText || '').trim();
  const direct = users.find((u) => String(u.phone || '') === q);
  return direct?.referralCode || users[0]?.referralCode || null;
}

function makeExcelBuffer({ userAReferralCode, userAPhone, timestamp }) {
  const headers = [
    'Lead Registration Date',
    'Client Code Generation Date',
    'Ready to Trade Date',
    'App Number',
    'Client Code',
    'Client Name',
    'Mobile',
    'App Status',
    'Plan Name',
    'Referred By',
    'Referral Type',
    'UCC Approved Date',
    'Latest Updated TimeStamp',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'Selfie Updated Time',
    'LOGIN&TRADE',
  ];

  const rowCodes = {
    row1: `TESTCODE001-${timestamp}`,
    row2: `TESTCODE002-${timestamp}`,
    row3: `TESTCODE003-${timestamp}`,
    row4: `TESTCODE004-${timestamp}`,
  };

  const base = {
    'Lead Registration Date': '2026-08-20',
    'Client Code Generation Date': '2026-08-20',
    'Ready to Trade Date': '2026-08-20',
    'App Number': 'APP-TEST',
    'Plan Name': 'STANDARD',
    'Referred By': 'NEXORA',
    'Referral Type': 'REFERRAL',
    'UCC Approved Date': '2026-08-20',
    'Latest Updated TimeStamp': '2026-08-20T12:00:00',
    'UTM Source': 'nexora',
    'Selfie Updated Time': '2026-08-20T12:00:00',
    'LOGIN&TRADE': 1,
  };

  const rows = [
    {
      ...base,
      'Client Code': rowCodes.row1,
      'Client Name': 'Fake Referred Person 1',
      Mobile: '9111111111',
      'App Status': 'Ready To Trade',
      'UTM Medium': userAReferralCode,
      'UTM Campaign': userAReferralCode,
    },
    {
      ...base,
      'Client Code': rowCodes.row2,
      'Client Name': 'Test User Alpha',
      Mobile: userAPhone,
      'App Status': 'Ready To Trade',
      'UTM Medium': userAReferralCode,
      'UTM Campaign': '',
    },
    {
      ...base,
      'Client Code': rowCodes.row3,
      'Client Name': 'Fake Referred Person 3',
      Mobile: '9222222222',
      'App Status': 'Application Rejected',
      'UTM Medium': userAReferralCode,
      'UTM Campaign': '',
    },
    {
      ...base,
      'Client Code': rowCodes.row4,
      'Client Name': 'Fake Referred Person 4',
      Mobile: '9333333333',
      'App Status': 'Ready To Trade',
      'UTM Medium': 'nonexistent_referral_code_xyz',
      'UTM Campaign': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return { buffer, rowCodes };
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to an existing admin account, e.g.: ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=yourpass node scripts/runEndToEndTest.js'
    );
    process.exit(1);
  }

  console.log(`Running E2E flow against: ${BASE_URL}`);
  const seed = generateTimestamp();
  const publicClient = makeHttpClient();

  let blocked = false;

  try {
    const step1Ok = await runStep(1, 'Logging in as admin', async () => {
      const data = await requestOrThrow(publicClient, {
        method: 'POST',
        url: '/api/admin/login',
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      context.adminToken = data.token;
      if (!context.adminToken) {
        throw new Error('Admin login response did not include token');
      }
      console.log('✓ Admin login successful');
    }, { fatal: true });

    if (!step1Ok) {
      blocked = true;
    }
  } catch {
    blocked = true;
  }

  const adminClient = makeHttpClient(context.adminToken);

  const alphaPhone = buildPhoneFromTimestamp(seed, '0');
  const betaPhone = buildPhoneFromTimestamp(seed, '1');
  const alphaEmail = `test-alpha-${seed}@example.com`;
  const betaEmail = `test-beta-${seed}@example.com`;

  if (!blocked) {
    await runStep(2, 'Creating test users via signup', async () => {
      const alpha = await requestOrThrow(publicClient, {
        method: 'POST',
        url: '/api/auth/signup',
        data: {
          fullName: 'Test User Alpha',
          mobile: alphaPhone,
          email: alphaEmail,
          password: 'TestPass@123',
          confirmPassword: 'TestPass@123',
        },
      });
      const beta = await requestOrThrow(publicClient, {
        method: 'POST',
        url: '/api/auth/signup',
        data: {
          fullName: 'Test User Beta',
          mobile: betaPhone,
          email: betaEmail,
          password: 'TestPass@123',
          confirmPassword: 'TestPass@123',
        },
      });

      context.userA = {
        id: extractUserId(alpha.user),
        token: alpha.token,
        email: alphaEmail,
        phone: alphaPhone,
        fullName: 'Test User Alpha',
      };
      context.userB = {
        id: extractUserId(beta.user),
        token: beta.token,
        email: betaEmail,
        phone: betaPhone,
        fullName: 'Test User Beta',
      };

      const [alphaSearch, betaSearch] = await Promise.all([
        requestOrThrow(adminClient, {
          method: 'GET',
          url: '/api/admin/users/search',
          params: { query: alphaPhone },
        }),
        requestOrThrow(adminClient, {
          method: 'GET',
          url: '/api/admin/users/search',
          params: { query: betaPhone },
        }),
      ]);

      context.userA.referralCode = findReferralCodeFromSearchResults(alphaSearch.users, alphaPhone);
      context.userB.referralCode = findReferralCodeFromSearchResults(betaSearch.users, betaPhone);

      if (!context.userA.id || !context.userB.id) {
        throw new Error('Failed to resolve created user ids');
      }
      if (!context.userA.referralCode || !context.userB.referralCode) {
        throw new Error('Failed to resolve referralCode(s) from admin search endpoint');
      }

      console.log(`✓ User A created: ${context.userA.email} (${context.userA.phone})`);
      console.log(`✓ User B created: ${context.userB.email} (${context.userB.phone})`);
      console.log(`✓ User A referralCode: ${context.userA.referralCode}`);
      console.log(`✓ User B referralCode: ${context.userB.referralCode}`);
    });
  }

  if (!blocked) {
    await runStep(3, 'Creating test link', async () => {
      const name = `TEST - E2E Demo Link ${seed}`;
      const data = await requestOrThrow(adminClient, {
        method: 'POST',
        url: '/api/admin/links',
        data: {
          name,
          destination: 'https://example.com/test-destination',
          commissionAmount: 500,
        },
      });

      const link = data.link || null;
      const linkId = extractLinkId(link);
      if (!linkId) {
        throw new Error('Create link response missing link id');
      }

      context.link = {
        id: linkId,
        name,
        destination: 'https://example.com/test-destination',
      };

      console.log(`✓ Test link created: ${context.link.name} (${context.link.id})`);
    });
  }

  if (!blocked) {
    await runStep(4, 'Testing /api/links and one-time click enforcement for User A', async () => {
      const userAClient = makeHttpClient(context.userA.token);
      const linksData = await requestOrThrow(userAClient, {
        method: 'GET',
        url: '/api/links',
      });
      const userLinks = linksData.links || [];
      const found = userLinks.find((item) => String(item._id || item.linkId) === String(context.link.id));
      if (!found) {
        throw new Error('Test link not visible in /api/links for User A');
      }
      console.log('✓ /api/links shows test link for User A');

      const firstClick = await requestOrThrow(userAClient, {
        method: 'POST',
        url: '/api/links/click',
        data: { linkId: context.link.id },
      });
      if (firstClick.alreadyUsed !== false) {
        throw new Error(`Expected first click alreadyUsed=false, got ${JSON.stringify(firstClick)}`);
      }
      if (!String(firstClick.destination || '').includes('https://example.com/test-destination')) {
        throw new Error(`Unexpected first click destination: ${firstClick.destination}`);
      }
      console.log('✓ First click accepted (alreadyUsed: false)');

      const secondClick = await requestOrThrow(userAClient, {
        method: 'POST',
        url: '/api/links/click',
        data: { linkId: context.link.id },
      });
      if (secondClick.alreadyUsed !== true) {
        throw new Error(`Expected second click alreadyUsed=true, got ${JSON.stringify(secondClick)}`);
      }
      console.log('✓ Second click blocked (alreadyUsed: true)');
    });
  }

  if (!blocked) {
    await runStep(5, 'Building in-memory Excel workbook', async () => {
      const { buffer, rowCodes } = makeExcelBuffer({
        userAReferralCode: context.userA.referralCode,
        userAPhone: context.userA.phone,
        timestamp: seed,
      });
      context.excelBuffer = buffer;
      context.rowCodes = rowCodes;
      console.log('✓ Excel buffer prepared in memory');
    });
  }

  if (!blocked) {
    await runStep(6, 'Uploading conversion Excel and verifying summary counts', async () => {
      const form = new FormData();
      form.append('file', context.excelBuffer, {
        filename: `e2e-upload-${seed}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      form.append('linkId', context.link.id);

      const uploadResponse = await adminClient.post('/api/admin/conversions/upload', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${context.adminToken}`,
        },
        maxBodyLength: Infinity,
        validateStatus: () => true,
      });
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        const err = new Error('Upload failed');
        err.response = uploadResponse;
        throw err;
      }

      context.uploadSummary = uploadResponse.data;
      console.log('Upload summary:', JSON.stringify(context.uploadSummary, null, 2));

      addCheck(
        'Step 6: autoMatchedCount should be 2',
        Number(context.uploadSummary.autoMatchedCount) === 2,
        `expected=2 actual=${context.uploadSummary.autoMatchedCount}`
      );
      addCheck(
        'Step 6: unmatchedCount should be 1',
        Number(context.uploadSummary.unmatchedCount) === 1,
        `expected=1 actual=${context.uploadSummary.unmatchedCount}`
      );
      addCheck(
        'Step 6: selfAccountCount should be 1',
        Number(context.uploadSummary.selfAccountCount) === 1,
        `expected=1 actual=${context.uploadSummary.selfAccountCount}`
      );
    });
  }

  if (!blocked) {
    await runStep(7, 'Manually matching unmatched row to User B', async () => {
      const unmatched = await requestOrThrow(adminClient, {
        method: 'GET',
        url: '/api/admin/conversions/unmatched',
      });
      const rows = unmatched.records || [];
      const row4 = rows.find((item) => item.clientCode === context.rowCodes.row4);
      if (!row4) {
        throw new Error(`Unmatched row not found for client code ${context.rowCodes.row4}`);
      }
      context.unmatchedRecordId = row4._id;

      const matchResponse = await requestOrThrow(adminClient, {
        method: 'PUT',
        url: `/api/admin/conversions/${context.unmatchedRecordId}/match`,
        data: { userId: context.userB.id },
      });
      const matchType = matchResponse?.record?.matchType;
      addCheck(
        'Step 7: manual match response matchType should be "manual"',
        matchType === 'manual',
        `actual=${matchType}`
      );
    });
  }

  if (!blocked) {
    await runStep(8, 'Validating customer earnings summary values', async () => {
      const summary = await requestOrThrow(adminClient, {
        method: 'GET',
        url: '/api/admin/conversions/customers-summary',
      });
      const rows = summary.customers || [];

      const rowA = rows.find((item) => String(item.userId) === String(context.userA.id));
      const rowB = rows.find((item) => String(item.userId) === String(context.userB.id));

      addCheck(
        'Step 8: User A totalEarned should be 500',
        Number(rowA?.totalEarned || 0) === 500,
        `actual=${rowA?.totalEarned ?? 'missing'}`
      );
      addCheck(
        'Step 8: User A totalPending should be 500',
        Number(rowA?.totalPending || 0) === 500,
        `actual=${rowA?.totalPending ?? 'missing'}`
      );
      addCheck(
        'Step 8: User B totalEarned should be 500',
        Number(rowB?.totalEarned || 0) === 500,
        `actual=${rowB?.totalEarned ?? 'missing'}`
      );
    });
  }

  if (!blocked) {
    await runStep(9, 'Checking User A /api/conversions/me before payout', async () => {
      const userAClient = makeHttpClient(context.userA.token);
      const me = await requestOrThrow(userAClient, {
        method: 'GET',
        url: '/api/conversions/me',
      });

      const records = me.records || [];
      addCheck(
        'Step 9: User A totalEarned should be 500',
        Number(me.totalEarned || 0) === 500,
        `actual=${me.totalEarned}`
      );
      addCheck(
        'Step 9: User A totalPending should be 500',
        Number(me.totalPending || 0) === 500,
        `actual=${me.totalPending}`
      );
      addCheck(
        'Step 9: User A payable records should be exactly 1',
        records.length === 1,
        `actual=${records.length}`
      );
    });
  }

  if (!blocked) {
    await runStep(10, 'Marking User A as paid and re-checking /api/conversions/me', async () => {
      await requestOrThrow(adminClient, {
        method: 'PUT',
        url: `/api/admin/conversions/customers/${context.userA.id}/mark-paid`,
        data: {},
      });

      const userAClient = makeHttpClient(context.userA.token);
      const meAfter = await requestOrThrow(userAClient, {
        method: 'GET',
        url: '/api/conversions/me',
      });

      addCheck(
        'Step 10: User A totalPaid should be 500 after mark-paid',
        Number(meAfter.totalPaid || 0) === 500,
        `actual=${meAfter.totalPaid}`
      );
      addCheck(
        'Step 10: User A totalPending should be 0 after mark-paid',
        Number(meAfter.totalPending || 0) === 0,
        `actual=${meAfter.totalPending}`
      );
    });
  }

  console.log('\n================ FINAL SUMMARY ================');
  console.log('Check Results');
  console.log('-----------------------------------------------');
  checks.forEach((check, index) => {
    const mark = check.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${String(index + 1).padStart(2, '0')}. ${mark} - ${check.name}${check.details ? ` (${check.details})` : ''}`);
  });

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.length - passed;
  console.log('-----------------------------------------------');
  console.log(`Total checks: ${checks.length}, Passed: ${passed}, Failed: ${failed}`);
  console.log('\nCreated Test Data');
  console.log(`- User A: ${context.userA?.email || 'n/a'} | ${context.userA?.phone || 'n/a'}`);
  console.log(`- User B: ${context.userB?.email || 'n/a'} | ${context.userB?.phone || 'n/a'}`);
  console.log(`- Test Link: ${context.link?.name || 'n/a'}`);
  console.log('\nReview the results above. If everything looks correct, run: node scripts/cleanupTestData.js (dry run first, then --confirm) to remove this test data.');
}

main().catch((error) => {
  console.error('\nFatal error while running E2E test:', formatAxiosError(error));
  process.exit(1);
});
