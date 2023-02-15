const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

/**
 * TestCases:
 * 1. Do we have 3 plans?
 * 2. Is the first plan what we expect?
 * 3. Is the second plan what we expect?
 * 4. Is the third plan what we expect?
 * 5. Can we subscribe to the right plan?
 * 6. Can we subscribe to the wrong plan?
 * 7. Can we subscribe to the same plan twice?
 * 8. Can a user subscribe to a plan without enough allowance?
 * 9. Can a user subscribe to a plan without enough balance for the first charge?
 * 10. Can a user be charged 11 more times after the first charge?
 * 11. After 12 charges, is the user unsubscribed?
 */

const oneHour = 60 * 60 * 1;

before(async function () {
  const [deployer, accountA, accountB, accountC] = await ethers.getSigners();
  const MockCUSD = await ethers.getContractFactory("MockCUSD");
  const cUSD = await MockCUSD.deploy();

  await cUSD.deployed();

  const PaymentSubscription = await ethers.getContractFactory(
    "PaymentSubscription"
  );
  const paymentSubscription = await PaymentSubscription.deploy(cUSD.address);

  await paymentSubscription.deployed();

  this.paymentSubscription = paymentSubscription;
  this.cUSD = cUSD;
  this.deployer = deployer;
  this.accountA = accountA;
  this.accountB = accountB;
  this.accountC = accountC;
});

describe("PaymentSubscription", function () {
  it("Should have Basic plan", async function () {
    const basicPlan = await this.paymentSubscription.plans(0);
    expect(basicPlan.price).to.equal(ethers.utils.parseEther("2"));
    expect(basicPlan.duration).to.equal(oneHour);
  });

  it("Should have Premium plan", async function () {
    const premiumPlan = await this.paymentSubscription.plans(1);
    expect(premiumPlan.price).to.equal(ethers.utils.parseEther("5"));
    expect(premiumPlan.duration).to.equal(oneHour);
  });

  it("Should have Enterprise plan", async function () {
    const enterprisePlan = await this.paymentSubscription.plans(2);
    expect(enterprisePlan.price).to.equal(ethers.utils.parseEther("12"));
    expect(enterprisePlan.duration).to.equal(oneHour);
  });

  it("Should allow user to subscribe to a 12 months plan", async function () {
    const basic = await this.paymentSubscription.plans(0);

    await this.cUSD.approve(
      this.paymentSubscription.address,
      basic.price.mul(ethers.BigNumber.from(12))
    );

    await this.paymentSubscription.subscribe(basic.plan, 12);

    const subscription = await this.paymentSubscription.subscriptions(
      this.deployer.address
    );
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

    expect(subscription.plan).to.equal(basic.plan);
    expect(subscription.startDate).to.equal(ethers.BigNumber.from(currentTime));
    expect(subscription.endDate).to.equal(
      ethers.BigNumber.from(currentTime + 12 * oneHour)
    );
    expect(subscription.nextCharge).to.equal(
      ethers.BigNumber.from(currentTime + oneHour)
    );
  });

  it("Should not allow user to subscribe to the wrong plan", async function () {
    await expect(this.paymentSubscription.subscribe(3, 12)).to.be.rejectedWith(
      Error
    );
  });

  it("Should not allow user to subscribe to the same plan twice", async function () {
    const basic = await this.paymentSubscription.plans(0);

    await this.cUSD.approve(
      this.paymentSubscription.address,
      basic.price.mul(ethers.BigNumber.from(12))
    );

    expect(
      this.paymentSubscription.subscribe(basic.plan, 12)
    ).to.be.revertedWith("Already subscribed");
  });

  it("Should not allow user to subscribe to a plan without enough allowance", async function () {
    const basic = await this.paymentSubscription.plans(0);

    await expect(
      this.paymentSubscription.connect(this.accountA).subscribe(basic.plan, 12)
    ).to.be.revertedWith("Insufficient allowance");
  });

  it("Should not allow user to subscribe to a plan without enough balance for the first charge", async function () {
    const basic = await this.paymentSubscription.plans(0);

    await this.cUSD
      .connect(this.accountA)
      .approve(
        this.paymentSubscription.address,
        basic.price.mul(ethers.BigNumber.from(12))
      );

    await expect(
      this.paymentSubscription.connect(this.accountA).subscribe(basic.plan, 12)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should allow user to be charged 11 more times after the first charge", async function () {
    await this.cUSD.mint(this.accountC.address, ethers.utils.parseEther("24"));

    const basic = await this.paymentSubscription.plans(0);

    await this.cUSD
      .connect(this.accountC)
      .approve(
        this.paymentSubscription.address,
        basic.price.mul(ethers.BigNumber.from(12))
      );

    await this.paymentSubscription
      .connect(this.accountC)
      .subscribe(basic.plan, 12);

    for (let monthsCharged = 2; monthsCharged <= 12; monthsCharged++) {
      const currentBal = await this.cUSD.balanceOf(this.accountC.address);
      const subscription = await this.paymentSubscription.subscriptions(
        this.accountC.address
      );

      await helpers.time.increase(oneHour);

      console.table({
        monthsCharged,
        currentBal: ethers.utils.formatEther(currentBal),
        nextCharge: ethers.utils.formatEther(subscription.nextCharge),
      });

      await this.paymentSubscription
        .connect(this.deployer)
        .charge(this.accountC.address);
    }

    expect(await this.cUSD.balanceOf(this.accountC.address)).to.equal(0);

    const subscription = await this.paymentSubscription.subscriptions(
      this.accountC.address
    );
    const active = await this.paymentSubscription.activeSubscriptions(
      this.accountC.address
    );

    expect(subscription.nextCharge).to.equal(0);
    expect(active).to.equal(false);
  });
});
