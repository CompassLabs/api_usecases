import { BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
console.log("PRIVATE_KEY", PRIVATE_KEY);
const account = privateKeyToAccount(PRIVATE_KEY);

const recipient = "0xd92710ffFF5c6449ADc1b0B86283eb7dbF37567d";
const amount = BigInt(100000000000000);
// const nativeTransferAction = BundlerAction.nativeTransfer(
//   arbitrum.id,
//   account.address,
//   recipient,
//   amount
// );

// console.log("nativeTransferAction", nativeTransferAction);

const tokenAddress = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const erc20TransferAction = BundlerAction.erc20Transfer(
  tokenAddress,
  recipient,
  BigInt(1000),
  "0x9954aFB60BB5A222714c478ac86990F221788B88"
);

console.log("erc20TransferAction", erc20TransferAction);

const paraswapBuy = BundlerAction.paraswapBuy(
  arbitrum.id,
  "0x6A000F20005980200259B80c5102003040001068",
  "0x1234",
  tokenAddress,
  tokenAddress,
  {
    exactAmount: BigInt(1000),
    limitAmount: BigInt(1000),
    quotedAmount: BigInt(1000),
  },
  account.address
);

console.log("paraswapBuy", paraswapBuy);
