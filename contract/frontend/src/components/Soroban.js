import {
  Contract,
  TransactionBuilder,
  Transaction,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";

import { userSignTransaction } from "./Freighter";

const RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK = Networks.TESTNET;
const CONTRACT_ADDRESS = "CB6DGSQXSOJATMILCJQ377STZKGCU2RRTFR5E34XNQABHK44YTE2M75G";

const server = new StellarRpc.Server(RPC_URL);

const TX_PARAMS = {
  fee: BASE_FEE,
  networkPassphrase: NETWORK,
};

const stringToScVal = (v) => nativeToScVal(String(v));
const numberToU64 = (v) => nativeToScVal(Number(v), { type: "u64" });

async function contractInt(caller, fnName, values) {
  try {
    const sourceAccount = await server.getAccount(caller);
    const contract = new Contract(CONTRACT_ADDRESS);

    const builder = new TransactionBuilder(sourceAccount, TX_PARAMS);

    if (Array.isArray(values)) {
      builder.addOperation(contract.call(fnName, ...values));
    } else if (values !== undefined && values !== null) {
      builder.addOperation(contract.call(fnName, values));
    } else {
      builder.addOperation(contract.call(fnName));
    }

    const tx = builder.setTimeout(30).build();

    // STEP 1: SIMULATE
    const sim = await server.simulateTransaction(tx);
    if (sim.error) throw new Error(sim.error);

    // STEP 2: ASSEMBLE
    const preparedTx = StellarRpc.assembleTransaction(tx, sim);

    // STEP 3: EXTRACT XDR
    let xdr;
    if (typeof preparedTx === "string") {
      xdr = preparedTx;
    } else if (preparedTx.tx) {
      xdr = preparedTx.tx;
    } else if (preparedTx.transactionData) {
      xdr = preparedTx.transactionData;
    } else if (preparedTx.toXDR) {
      xdr = preparedTx.toXDR();
    } else if (preparedTx instanceof Transaction) {
      xdr = preparedTx.toXDR();
    } else {
      console.error("PreparedTx object:", preparedTx);
      throw new Error("Unable to extract XDR");
    }

    // STEP 4: SIGN
    const signed = await userSignTransaction(xdr, NETWORK);
    const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK);

    // STEP 5: SEND
    const send = await server.sendTransaction(signedTx);

    // STEP 6: POLL
    for (let i = 0; i < 10; i++) {
      const res = await server.getTransaction(send.hash);

      if (res.status === "SUCCESS") {
        return res.returnValue ? scValToNative(res.returnValue) : null;
      }

      if (res.status === "FAILED") {
        console.error(res);
        throw new Error("Transaction failed");
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error("Transaction timeout");
  } catch (err) {
    console.error("contractInt error:", err);
    throw err;
  }
}

export async function createAuction(caller, title, description, startingBid, endTime) {
  const values = [
    stringToScVal(title),                          // string
    stringToScVal(description),                    // string
    numberToU64(startingBid),                      // u64
    numberToU64(endTime),                          // u64
  ];

  const result = await contractInt(caller, "create_auction", values);
  console.log("Auction ID:", result);
  return Number(result);
}

export async function placeBid(caller, auctionId, bidder, amount) {
  const values = [
    numberToU64(auctionId),
    numberToU64(bidder),
    numberToU64(amount),
  ];
  return await contractInt(caller, "place_bid", values);
}

export async function endAuction(caller, auctionId) {
  return await contractInt(caller, "end_auction", numberToU64(auctionId));
}

export async function viewAuction(caller, auctionId) {
  const result = await contractInt(caller, "view_auction", numberToU64(auctionId));
  console.log("Auction:", result);
  return result;
}