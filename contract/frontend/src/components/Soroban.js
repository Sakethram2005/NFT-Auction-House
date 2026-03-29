import {
  Contract,
  TransactionBuilder,
  Networks,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";
import { userSignTransaction } from "./Freighter";

/* ================= Config ================= */
const RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK = Networks.TESTNET;
const CONTRACT_ADDRESS =
  "CB6DGSQXSOJATMILCJQ377STZKGCU2RRTFR5E34XNQABHK44YTE2M75G";
const server = new StellarRpc.Server(RPC_URL);

/* ================= Helpers ================= */
function toScvString(str) {
  return StellarSdk.nativeToScVal(str, { type: "string" });
}
function toScvU64(num) {
  return StellarSdk.nativeToScVal(BigInt(num), { type: "u64" });
}

/* ================= Try ALL XDR fields for return value ================= */
function tryParseScVal(base64, label) {
  if (!base64) return null;
  try {
    const scVal = StellarSdk.xdr.ScVal.fromXDR(base64, "base64");
    const native = StellarSdk.scValToNative(scVal);
    console.log(`${label} parsed as ScVal:`, native, typeof native);
    return native;
  } catch (e) {
    console.log(`${label} ScVal failed:`, e.message);
  }
  return null;
}

function tryParseU64Bytes(base64, label) {
  if (!base64) return null;
  try {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    console.log(`${label} bytes (hex):`, Array.from(bytes.slice(0, 32)).map(b => b.toString(16).padStart(2,'0')).join(' '));

    // Scan for scvU64 (type=6, 0x00000006) followed by reasonable number
    for (let i = 0; i <= bytes.length - 12; i++) {
      if (bytes[i]===0 && bytes[i+1]===0 && bytes[i+2]===0 && bytes[i+3]===6) {
        const hi = (bytes[i+4]<<24)|(bytes[i+5]<<16)|(bytes[i+6]<<8)|bytes[i+7];
        const lo = (bytes[i+8]<<24)|(bytes[i+9]<<16)|(bytes[i+10]<<8)|bytes[i+11];
        if (hi === 0 && lo >= 1 && lo < 10000) {
          console.log(`${label} found u64 at offset ${i}: ${lo}`);
          return lo;
        }
      }
    }
    // Also scan for scvI128/scvU128
    for (let i = 0; i <= bytes.length - 8; i++) {
      if (bytes[i]===0 && bytes[i+1]===0 && bytes[i+2]===0 && bytes[i+3]===9) {
        const lo = (bytes[i+4]<<24)|(bytes[i+5]<<16)|(bytes[i+6]<<8)|bytes[i+7];
        if (lo >= 1 && lo < 10000) {
          console.log(`${label} found i64/other at offset ${i}: ${lo}`);
          return lo;
        }
      }
    }
    console.log(`${label} no u64 found in ${bytes.length} bytes`);
  } catch (e) {
    console.log(`${label} bytes parse failed:`, e.message);
  }
  return null;
}

/* ================= Raw RPC poll ================= */
async function pollTransaction(hash) {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const response = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: { hash },
        }),
      });
      const json = await response.json();
      const res = json.result;
      console.log("poll", i, "status:", res?.status);

      if (!res) continue;

      if (res.status === "SUCCESS") {
        // Log ALL fields available
        console.log("SUCCESS fields:", Object.keys(res));
        console.log("returnValue:", res.returnValue);
        console.log("resultXdr length:", res.resultXdr?.length);
        console.log("resultMetaXdr length:", res.resultMetaXdr?.length);

        // Try 1: returnValue as ScVal
        const v1 = tryParseScVal(res.returnValue, "returnValue");
        if (v1 !== null && v1 !== undefined) return v1;

        // Try 2: resultXdr bytes scan
        const v2 = tryParseU64Bytes(res.resultXdr, "resultXdr");
        if (v2 !== null) return v2;

        // Try 3: resultMetaXdr bytes scan
        const v3 = tryParseU64Bytes(res.resultMetaXdr, "resultMetaXdr");
        if (v3 !== null) return v3;

        console.log("All parse attempts failed, returning null");
        return null;
      }

      if (res.status === "FAILED") throw new Error("Transaction FAILED");
    } catch (e) {
      if (e.message === "Transaction FAILED") throw e;
      console.log("poll error:", e.message);
    }
  }
  throw new Error("Transaction timeout");
}

/* ================= Simulate for view_auction (read-only) ================= */
async function simulateContract(caller, fnName, args) {
  const pubKey = caller || "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
  const account = await server.getAccount(pubKey);
  const contract = new Contract(CONTRACT_ADDRESS);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(30)
    .build();

  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "simulateTransaction",
      params: { transaction: tx.toXDR() },
    }),
  });
  const json = await response.json();
  console.log("simulate keys:", Object.keys(json.result || {}));
  console.log("simulate results:", JSON.stringify(json.result?.results));

  const retXdr = json.result?.results?.[0]?.xdr;
  console.log("simulate retXdr:", retXdr);

  if (retXdr) {
    const v = tryParseScVal(retXdr, "simulate-retXdr");
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

/* ================= Core (write functions) ================= */
async function contractInt(caller, fnName, args) {
  const sourceAccount = await server.getAccount(caller);
  const contract = new Contract(CONTRACT_ADDRESS);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const xdrStr = preparedTx.toXDR();

  const signResult = await userSignTransaction(xdrStr, caller);
  const signedXdr =
    typeof signResult === "string"
      ? signResult
      : signResult?.signedTxXdr ?? signResult;

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK);
  const send = await server.sendTransaction(signedTx);
  console.log("sendTransaction:", send.status, send.hash);

  if (send.status === "ERROR") throw new Error("Send failed");
  return await pollTransaction(send.hash);
}

/* ================= Contract Functions ================= */
async function createAuction(caller, title, description) {
  try {
    const result = await contractInt(caller, "create_auction", [
      toScvString(title),
      toScvString(description),
    ]);
    console.log("createAuction result:", result);
    return Number(result);
  } catch (err) {
    console.error("createAuction failed:", err);
    throw err;
  }
}

async function placeBid(caller, auctionId, bidder, amount) {
  try {
    await contractInt(caller, "place_bid", [
      toScvU64(auctionId),
      toScvU64(bidder),
      toScvU64(amount),
    ]);
  } catch (err) {
    console.error("placeBid failed:", err);
    throw err;
  }
}

async function endAuction(caller, auctionId) {
  try {
    await contractInt(caller, "end_auction", [toScvU64(auctionId)]);
  } catch (err) {
    console.error("endAuction failed:", err);
    throw err;
  }
}

async function viewAuction(caller, auctionId) {
  try {
    const result = await simulateContract(caller, "view_auction", [
      toScvU64(auctionId),
    ]);
    console.log("viewAuction result:", result);
    return result;
  } catch (err) {
    console.error("viewAuction failed:", err);
    throw err;
  }
}

export { createAuction, placeBid, endAuction, viewAuction };