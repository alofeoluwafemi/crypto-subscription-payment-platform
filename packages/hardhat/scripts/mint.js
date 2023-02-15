// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    const [deployer] = await ethers.getSigners();

    // We get the contract to deploy
    const MockUSD = await hre.ethers.getContractFactory('MockCUSD');

    const cUSD = await MockUSD.attach(
        '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
    );

    await cUSD.connect(deployer).mint(
        '0x3472059945ee170660a9A97892a3cf77857Eba3A',
        ethers.utils.parseEther('24'),
    );

    const bal = await cUSD.balanceOf(
        '0x3472059945ee170660a9A97892a3cf77857Eba3A'
    );

    console.log('Balance:', Number(ethers.utils.formatEther(bal)).toFixed(2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
