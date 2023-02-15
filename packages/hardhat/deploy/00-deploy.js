module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const cUSD = await deploy('MockCUSD', {
        from: deployer,
        log: true
    });

    console.log('cUSD deployed to:', cUSD.address);

    await deploy('PaymentSubscription', {
        from: deployer,
        args: [cUSD.address],
        log: true
    });
};

//cUSD deployed to: 0xEb3345B25d59Ad1dD153DAf883b377258E8515F9
// PaymentSubscription deployed to: 0x95BD5b1B16C586025bF0750c21bd1de433de8D4c

module.exports.tags = ['MockCUSD'];
