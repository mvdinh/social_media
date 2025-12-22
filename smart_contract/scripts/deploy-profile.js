const hre = require("hardhat");
const fs = require("fs");     
const path = require("path");  

async function main() {

    const UserProfile = await hre.ethers.getContractFactory("Profile");
    const userProfile = await UserProfile.deploy();

    await userProfile.waitForDeployment();
    const profileAddress = await userProfile.getAddress();
    
    console.log(`UserProfile deployed to: ${profileAddress}`);

    const configDir = path.join(__dirname, "..", "..", "client", "src", "config");
    
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    const addressFile = path.join(configDir, "contract-addresses.json");
    fs.writeFileSync(
        addressFile,
        JSON.stringify({ Profile: profileAddress }, null, 2)
    );
    console.log(`💾 Saved addresses to: ${addressFile}`);


    const artifact = await hre.artifacts.readArtifact("Profile"); 

    const abiFile = path.join(configDir, "Profile.json");
    fs.writeFileSync(abiFile, JSON.stringify(artifact, null, 2)); 
    
    console.log(`💾 Saved ABI to: ${abiFile}`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});