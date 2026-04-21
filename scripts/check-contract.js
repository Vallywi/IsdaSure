#!/usr/bin/env node
/*
  probes a Soroban contract on an RPC to check whether specific methods exist

  Usage:
    node scripts/check-contract.js --rpc <RPC_URL> --contract <CONTRACT_ID> --wallet <FUNDED_WALLET_ADDRESS>

  Or via env vars:
    RPC_URL, CONTRACT_ID, WALLET_ADDRESS

  Example:
    node scripts/check-contract.js --rpc https://rpc.testnet.soroban.stellar.org \
      --contract CDNZVMTK3RNWWEQTG4JYC55O5P47YYTC2C2ACJVPI5MDJP63TH3KKKKS \
      --wallet G...FUNDED

  This script requires @stellar/stellar-sdk to be installed in the project.
*/

const { rpc, Contract, TransactionBuilder, Networks } = require('@stellar/stellar-sdk');
const args = require('minimist')(process.argv.slice(2));

const rpcUrl = args.rpc || process.env.RPC_URL || process.env.SOROBAN_RPC_URL;
const contractId = args.contract || process.env.CONTRACT_ID || process.env.SOROBAN_CONTRACT_ID;
const wallet = args.wallet || process.env.WALLET_ADDRESS || process.env.WALLET;
const passphrase = process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

if (!rpcUrl || !contractId || !wallet) {
  console.error('Missing required argument. Provide --rpc, --contract and --wallet (or env vars).');
  console.error('Example: node scripts/check-contract.js --rpc https://rpc.testnet.soroban.stellar.org --contract <ID> --wallet G...');
  process.exit(2);
}

const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });

async function probeMethod(method, args = []) {
  try {
    const sourceAccount = await server.getAccount(wallet);
    const contract = new Contract(contractId);
    const operation = contract.call(method, ...args.map((a) => a));
    let tx = new TransactionBuilder(sourceAccount, { fee: '100000', networkPassphrase: passphrase })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    await server.prepareTransaction(tx);
    return { exists: true };
  } catch (err) {
    const msg = String(err?.message || err || '');
    if (/non-existent contract function|MissingValue|was not found/i.test(msg)) {
      return { exists: false, message: msg };
    }
    return { exists: false, message: msg };
  }
}

async function main() {
  console.log(`RPC: ${rpcUrl}`);
  console.log(`Contract: ${contractId}`);
  console.log(`Wallet: ${wallet}`);
  console.log('Probing methods: contribute, trigger_storm, increment, reset');

  const methods = [
    { name: 'contribute', args: ['ProbeUser', contractId, 1] },
    { name: 'trigger_storm', args: [contractId] },
    { name: 'increment', args: [1] },
    { name: 'reset', args: [] },
  ];

  for (const m of methods) {
    process.stdout.write(`- Checking ${m.name} ... `);
    const res = await probeMethod(m.name, m.args);
    if (res.exists) {
      console.log('FOUND');
    } else {
      console.log('MISSING', res.message ? `(${res.message.slice(0, 200)})` : '');
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Error running probe:', err && err.message ? err.message : err);
  process.exit(1);
});
