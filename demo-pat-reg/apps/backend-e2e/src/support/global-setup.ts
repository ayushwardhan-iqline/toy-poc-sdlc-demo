import { waitForPortOpen } from '@nx/node/utils';

/* eslint-disable */
declare global {
  var __TEARDOWN_MESSAGE__: string;
}

export default async function setup() {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
}

export async function teardown() {
  const { killPort } = await import('@nx/node/utils');
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await killPort(port);
  console.log(globalThis.__TEARDOWN_MESSAGE__);
}
