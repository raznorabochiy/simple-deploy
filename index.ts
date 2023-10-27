import cli from "cli";
import fs from "fs/promises";
import fsCallback from "fs";
import random from "lodash/random";
import { ethers } from "ethers";
import { contractsBytecode } from "./contracts";

const RPC_URL = "https://rpc.scroll.io";

const KEYS_FILENAME = "keys.txt";
const RESULTS_FILENAME = "results.txt";

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function deploy(key: string) {
  const wallet = new ethers.Wallet(key, provider);

  const contractIndex = random(contractsBytecode.length - 1);
  const contract = contractsBytecode[contractIndex];
  const { abi, bytecode, getConstructorArgs } = contract;
  const constructorArgs = getConstructorArgs();

  const message = `Deploy from address ${wallet.address}`;
  cli.spinner(message);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const result = await factory.deploy(...constructorArgs);
  await result.waitForDeployment();
  cli.spinner(message, true);

  return result.target;
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
