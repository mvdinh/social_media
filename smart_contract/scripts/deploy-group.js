import fs from "fs";
import path from "path";
import hre from "hardhat";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const GroupRegistry = await hre.ethers.getContractFactory("GroupRegistry");
  const group = await GroupRegistry.deploy();
  await group.waitForDeployment();

  const address = await group.getAddress();
  console.log("GroupRegistry deployed at:", address);

  // 👉 Ghi ra backend/.env
  const envPath = path.join(process.cwd(), "../backend/.env");
  let env = "";
  if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, "utf8");
    if (/GROUP_CONTRACT_ADDRESS=.*/.test(env)) {
      env = env.replace(/GROUP_CONTRACT_ADDRESS=.*/g, `GROUP_CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nGROUP_CONTRACT_ADDRESS=${address}`;
    }
  } else {
    env = `GROUP_CONTRACT_ADDRESS=${address}`;
  }
  fs.writeFileSync(envPath, env);

  // 👉 Ghi ra frontend contracts/groupsContract.json
  const frontendConfPath = path.join(__dirname, "../../client/src/contracts/groupsContract.json");
  const abiString = group.interface.format("json");
  const abi = typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address,
    abi
  };

  fs.mkdirSync(path.dirname(frontendConfPath), { recursive: true });
  fs.writeFileSync(frontendConfPath, JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
