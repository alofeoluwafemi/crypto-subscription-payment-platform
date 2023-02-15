// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PaymentSubscription is Pausable, Ownable {
    //Available plans
    enum Plan {
        Basic,
        Premium,
        Enterprise
    }

    struct Subscription {
        Plan plan;
        uint256 price;
        uint256 startDate;
        uint256 endDate;
        uint256 nextCharge;
        bool active;
    }

    struct PlanDetail {
        Plan plan;
        uint256 price;
        uint256 duration;
    }

    //All plans
    mapping(Plan => PlanDetail) public plans;

    //All subscriptions
    mapping(address => Subscription) public subscriptions;

    //Active subscriptions
    mapping(address => bool) public activeSubscriptions;

    //Emits when a new plan is created
    event PlanCreated(Plan plan, uint256 price, uint256 duration);

    event SubscriptionCreated(address indexed subscriber, Plan plan);
    event SubscriptionCancelled(address indexed subscriber);
    event SubscriptionCharged(
        address indexed subscriber,
        Plan plan,
        uint256 nextCharge
    );

    //Token used for subscription payments
    address public subscriptionToken;

    constructor(address _subscriptionToken) {
        require(_subscriptionToken != address(0), "Invalid token address");
        subscriptionToken = _subscriptionToken;
        plans[Plan.Basic] = PlanDetail(Plan.Basic, 2e18, 1 hours);
        plans[Plan.Premium] = PlanDetail(Plan.Premium, 5e18, 1 hours);
        plans[Plan.Enterprise] = PlanDetail(Plan.Enterprise, 12e18, 1 hours);

        emit PlanCreated(Plan.Basic, 2e18, 1 hours);
        emit PlanCreated(Plan.Premium, 5e18, 1 hours);
        emit PlanCreated(Plan.Enterprise, 12e18, 1 hours);
    }

    function subscribe(Plan _plan, uint8 duration) public whenNotPaused {
        require(uint8(_plan) <= 2, "Invalid plan");
        require(duration > 0, "Invalid duration");
        require(duration <= 12, "Invalid duration");
        require(!activeSubscriptions[msg.sender], "Already subscribed");

        uint256 requiredAllowance = plans[_plan].price * duration;

        //Check if the user has approved the contract to spend the required amount, if not revert
        require(
            IERC20(subscriptionToken).allowance(msg.sender, address(this)) >=
                requiredAllowance,
            "Insufficient allowance"
        );

        //Check that we can charge for the first month
        require(
            IERC20(subscriptionToken).balanceOf(msg.sender) >=
                plans[_plan].price,
            "Insufficient balance"
        );

        subscriptions[msg.sender] = Subscription({
            plan: _plan,
            price: plans[_plan].price,
            startDate: block.timestamp,
            nextCharge: block.timestamp + plans[_plan].duration,
            endDate: block.timestamp + plans[_plan].duration * duration,
            active: true
        });

        _charge(msg.sender);

        activeSubscriptions[msg.sender] = true;

        emit SubscriptionCreated(msg.sender, _plan);
    }

    function _charge(address susbcriber) internal {
        require(
            IERC20(subscriptionToken).transferFrom(
                susbcriber,
                address(this),
                subscriptions[susbcriber].price
            ),
            "Transfer failed"
        );

        //Set the next charge date
        subscriptions[susbcriber].nextCharge =
            block.timestamp +
            plans[subscriptions[susbcriber].plan].duration;

        if (
            subscriptions[susbcriber].nextCharge >
            subscriptions[susbcriber].endDate
        ) {
            _cancel(susbcriber);
        }

        emit SubscriptionCharged(
            susbcriber,
            subscriptions[susbcriber].plan,
            subscriptions[susbcriber].nextCharge
        );
    }

    function _cancel(address subscriber) internal {
        activeSubscriptions[subscriber] = false;
        delete subscriptions[subscriber];

        emit SubscriptionCancelled(subscriber);
    }

    function charge(address subscriber) public onlyOwner whenNotPaused {
        require(activeSubscriptions[subscriber], "Not subscribed");
        require(
            subscriptions[subscriber].nextCharge <= block.timestamp,
            "Not time to charge yet"
        );

        require(
            IERC20(subscriptionToken).allowance(msg.sender, address(this)) >=
                subscriptions[subscriber].price,
            "Insufficient allowance"
        );
        _charge(subscriber);
    }

    function withdrawSubscriptionToken(
        address to,
        uint256 amount
    ) public onlyOwner {
        require(
            IERC20(subscriptionToken).transfer(to, amount),
            "Transfer failed"
        );
    }
}
