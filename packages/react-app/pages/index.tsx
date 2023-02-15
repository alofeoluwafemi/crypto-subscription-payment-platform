import React, { useEffect, useState } from "react";
import PaymentCard from "../components/PaymentCard";
import {
  abi as psAbi,
  address as psAddress,
} from "@ebook-payment-subscription-platform/hardhat/deployments/alfajores/PaymentSubscription.json";
import { useCelo } from "@celo/react-celo";
import { parseEther } from "ethers/lib/utils.js";

const plans = {
  0: { name: "Basic", price: 2 },
  1: { name: "Premium", price: 5 },
  2: { name: "Enterprise", price: 12 },
};

export default function Home() {
  const subscriptionToken = "0xEb3345B25d59Ad1dD153DAf883b377258E8515F9";
  const [activePlan, setActivePlan] = useState(null);
  const { kit, address } = useCelo();
  const paymentSubscriptionContract = new kit.connection.web3.eth.Contract(
    psAbi,
    psAddress
  );
  const cUsdContract = new kit.connection.web3.eth.Contract(
    [
      {
        inputs: [
          {
            internalType: "address",
            name: "spender",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "approve",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    subscriptionToken
  );

  const subscribeToPlan = async (plan) => {
    try {
      const tx = await cUsdContract.methods
        .approve(
          psAddress,
          parseEther((plans[plan].price * 12).toString()).toHexString()
        )
        .send({ from: address });

      if (tx.status) {
        const tx = await paymentSubscriptionContract.methods
          .subscribe(plan, 12)
          .send({ from: address });

        if (tx.status) {
          setActivePlan(plan);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const getActivePlan = async () => {
      const plan = await paymentSubscriptionContract.methods
        .subscriptions(address)
        .call();

      if (plan.endDate !== "0") {
        setActivePlan(parseInt(plan.plan));
      }
    };

    getActivePlan();
  }, [address]);

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-10 lg:space-y-0">
      <div className="flex">
        <PaymentCard
          planName={"Basic"}
          active={activePlan == 0}
          price={2}
          onClick={() => subscribeToPlan(0)}
        />
      </div>
      <div className="flex">
        <PaymentCard
          planName={"Premium"}
          active={activePlan == 1}
          price={5}
          onClick={() => subscribeToPlan(1)}
        />
      </div>
      <div className="flex">
        <PaymentCard
          planName={"Enterprise"}
          active={activePlan == 2}
          price={12}
          onClick={() => subscribeToPlan(2)}
        />
      </div>
    </div>
  );
}
