import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  PlanCreated as PlanCreatedEvent,
  SubscriptionCancelled as SubscriptionCancelledEvent,
  SubscriptionCharged as SubscriptionChargedEvent,
  SubscriptionCreated as SubscriptionCreatedEvent,
  PaymentSubscription as PaymentSubscriptionContract,
  PaymentSubscription__subscriptionsResult
} from "../generated/PaymentSubscription/PaymentSubscription";
import { Plan, SubscriptionP as Subscription } from "../generated/schema";

export function handlePlanCreated(event: PlanCreatedEvent): void {
  let entity = new Plan(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  entity.plan = event.params.plan;
  entity.price = event.params.price;
  entity.duration = event.params.duration;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleSubscriptionCancelled(
  event: SubscriptionCancelledEvent
): void {
  let entity = Subscription.load(event.params.subscriber);

  if (entity == null) {
    return;
  }

  entity.nextCharge = BigInt.fromI32(0);
  entity.endDate = BigInt.fromI32(0);

  entity.save();
}

export function handleSubscriptionCharged(
  event: SubscriptionChargedEvent
): void {
  let entity = Subscription.load(event.params.subscriber);

  if (entity == null) {
    entity = new Subscription(event.params.subscriber);

    let paymentSubscriptionContract = PaymentSubscriptionContract.bind(
      event.address
    );
    let subscription = paymentSubscriptionContract.subscriptions(
      event.params.subscriber
    );

    entity.plan = Bytes.fromI32(subscription.getPlan());
    entity.subscriber = event.params.subscriber;
    entity.endDate = subscription.getEndDate();
  }

  entity.nextCharge = event.params.nextCharge;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleSubscriptionCreated(
  event: SubscriptionCreatedEvent
): void {
  let entity = new Subscription(event.params.subscriber);

  entity.subscriber = event.params.subscriber;

  let paymentSubscriptionContract = PaymentSubscriptionContract.bind(
    event.address
  );
  let subscription = paymentSubscriptionContract.subscriptions(
    event.params.subscriber
  );

  entity.plan = Bytes.fromI32(subscription.getPlan());
  entity.endDate = subscription.getEndDate();
  entity.nextCharge = subscription.getNextCharge();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
