#!/usr/bin/env node

const baseUrl =
  process.env.LOOPP_LOADTEST_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3005';
const path =
  process.env.LOOPP_LOADTEST_PATH || process.env.PATHNAME || '/items';
const method = (
  process.env.LOOPP_LOADTEST_METHOD ||
  process.env.METHOD ||
  'GET'
).toUpperCase();
const concurrency = Number(
  process.env.LOOPP_LOADTEST_CONCURRENCY || process.env.CONCURRENCY || '2',
);
const requestsPerWorker = Number(
  process.env.LOOPP_LOADTEST_REQUESTS || process.env.REQUESTS || '10',
);
const delayMs = Number(
  process.env.LOOPP_LOADTEST_DELAY_MS || process.env.DELAY_MS || '150',
);
const token = process.env.LOOPP_LOADTEST_TOKEN || process.env.TOKEN || '';
const loginEmail =
  process.env.LOOPP_LOADTEST_LOGIN_EMAIL || process.env.LOGIN_EMAIL || '';
const loginPassword =
  process.env.LOOPP_LOADTEST_LOGIN_PASSWORD || process.env.LOGIN_PASSWORD || '';
const requestBody = process.env.LOOPP_LOADTEST_BODY || process.env.BODY || '';

const targetUrl = new URL(path, baseUrl).toString();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveAuthToken() {
  if (token) return token;
  if (!loginEmail || !loginPassword) return '';

  const response = await fetch(new URL('/auth/login', baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: loginEmail, password: loginPassword }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token || '';
}

async function runWorker(workerId, authToken) {
  const durations = [];
  let success = 0;
  let failed = 0;
  const statusCounts = new Map();

  for (let index = 0; index < requestsPerWorker; index += 1) {
    const startedAt = performance.now();

    try {
      const headers = {
        Accept: 'application/json',
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      if (requestBody) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(targetUrl, {
        method,
        headers,
        body: requestBody && method !== 'GET' ? requestBody : undefined,
      });

      const duration = performance.now() - startedAt;
      durations.push(duration);
      statusCounts.set(
        response.status,
        (statusCounts.get(response.status) || 0) + 1,
      );

      if (response.ok) {
        success += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
      statusCounts.set(
        'NETWORK_ERROR',
        (statusCounts.get('NETWORK_ERROR') || 0) + 1,
      );
    }

    if (delayMs > 0 && index < requestsPerWorker - 1) {
      await sleep(delayMs);
    }
  }

  return { workerId, success, failed, durations, statusCounts };
}

function percentile(sortedDurations, percentileValue) {
  if (!sortedDurations.length) return 0;
  const index = Math.min(
    sortedDurations.length - 1,
    Math.ceil((percentileValue / 100) * sortedDurations.length) - 1,
  );
  return sortedDurations[index];
}

async function main() {
  console.log(`Load test target: ${targetUrl}`);
  console.log(
    `Method: ${method}, concurrency: ${concurrency}, requests/worker: ${requestsPerWorker}, delay: ${delayMs} ms`,
  );

  const authToken = await resolveAuthToken();

  const startedAt = performance.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, index) =>
      runWorker(index + 1, authToken),
    ),
  );
  const totalDuration = performance.now() - startedAt;

  const allDurations = results
    .flatMap((result) => result.durations)
    .sort((a, b) => a - b);
  const totalSuccess = results.reduce((sum, result) => sum + result.success, 0);
  const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
  const totalRequests = totalSuccess + totalFailed;
  const statusBreakdown = new Map();

  for (const result of results) {
    for (const [status, count] of result.statusCounts.entries()) {
      statusBreakdown.set(status, (statusBreakdown.get(status) || 0) + count);
    }
  }

  const average =
    allDurations.reduce((sum, duration) => sum + duration, 0) /
    (allDurations.length || 1);

  console.log('--- Summary ---');
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Success: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total duration: ${totalDuration.toFixed(2)} ms`);
  console.log(`Avg latency: ${average.toFixed(2)} ms`);
  console.log(`P50 latency: ${percentile(allDurations, 50).toFixed(2)} ms`);
  console.log(`P95 latency: ${percentile(allDurations, 95).toFixed(2)} ms`);
  console.log(`P99 latency: ${percentile(allDurations, 99).toFixed(2)} ms`);
  console.log(
    `Throughput: ${(totalRequests / (totalDuration / 1000 || 1)).toFixed(2)} req/s`,
  );
  console.log('Status breakdown:', Object.fromEntries(statusBreakdown));

  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

await main();
