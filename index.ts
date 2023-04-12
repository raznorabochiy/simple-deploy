import cli from "cli";
import fs from "fs/promises";
import fsCallback from "fs";
import random from "lodash/random";
import { ethers } from "ethers";

// Base Goerli RPC
const RPC_URL = "https://base-goerli.public.blastapi.io";

const KEYS_FILENAME = "keys.txt";
const RESULTS_FILENAME = "results.txt";

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Default Remix contract 1_Storage.sol
const abi = [
  "function retrieve() view returns (uint256)",
  "function store(uint256 num)",
];

const bytecode =
  "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea2646970667358221220322c78243e61b783558509c9cc22cb8493dde6925aa5e89a08cdf6e22f279ef164736f6c63430008120033";

async function deploy(key: string) {
  const wallet = new ethers.Wallet(key, provider);

  const message = `Deploy from address ${wallet.address}`;
  cli.spinner(message);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  cli.spinner(message, true);

  return contract.target;
}

const file = await fs.readFile(KEYS_FILENAME, { encoding: "utf8" });
const keys = file.split("\n").filter(Boolean).map((item) => item.trim());
const logger = fsCallback.createWriteStream(RESULTS_FILENAME);

for (const key of keys) {
  try {
    const deployAddress = await deploy(key);
    console.log("Deployed to:", deployAddress);
    logger.write(deployAddress + "\n");
  } catch (error) {
    console.log(`Error: ${error}`);
    logger.write("deploy error\n");
  }

  // Интервал задержки между каждым деплоем, случайное число от 60 до 120 секунд
  const delayTimeout = random(60, 120);
  cli.spinner(`Delay: ${delayTimeout} seconds`);
  await delay(delayTimeout * 1000);
  cli.spinner("=============", true);
}

logger.end();
