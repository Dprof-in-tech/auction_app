import { Account, CallData, Contract, RpcProvider, stark } from "starknet";
import * as dotenv from "dotenv";
import { getCompiledCode } from "./utils";
dotenv.config();

async function main() {
    const provider = new RpcProvider({
        nodeUrl: process.env.RPC_ENDPOINT,
    });

    // initialize existing predeployed account 0
    console.log("ACCOUNT_ADDRESS=", process.env.DEPLOYER_ADDRESS);
    const privateKey0 = process.env.DEPLOYER_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.DEPLOYER_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account connected.\n");

    // Declare & deploy contract
    let sierraCode, casmCode;

    try {
        ({ sierraCode, casmCode } = await getCompiledCode(
            "auction_app_AuctionApp"
        ));
    } catch (error: any) {
        console.log("Failed to read contract files");
        console.log(error);
        process.exit(1);
    }

    const myCallData = new CallData(sierraCode.abi);
    
    // Updated constructor parameters to match your Cairo contract
    const constructor = myCallData.compile("constructor", {
        _nft_contract: process.env.NFT_CONTRACT_ADDRESS ?? "", // Add this to your .env
        _token_id: "1",  // Replace with your desired token ID
        duration: "86400" // Duration in seconds (24 hours in this example)
    });

    const deployResponse = await account0.declareAndDeploy({
        contract: sierraCode,
        casm: casmCode,
        constructorCalldata: constructor,
        salt: stark.randomAddress(),
    });

    // Connect the new contract instance
    const auctionappContract = new Contract(
        sierraCode.abi,
        deployResponse.deploy.contract_address,
        provider
    );
    console.log(
        `✅ Contract has been deployed with the address: ${auctionappContract.address}`
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });