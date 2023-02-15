import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  Paused,
  PlanCreated,
  SubscriptionCancelled,
  SubscriptionCharged,
  SubscriptionCreated,
  Unpaused
} from "../generated/PaymentSubscription/PaymentSubscription"

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createPlanCreatedEvent(
  plan: i32,
  price: BigInt,
  duration: BigInt
): PlanCreated {
  let planCreatedEvent = changetype<PlanCreated>(newMockEvent())

  planCreatedEvent.parameters = new Array()

  planCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "plan",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(plan))
    )
  )
  planCreatedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  planCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "duration",
      ethereum.Value.fromUnsignedBigInt(duration)
    )
  )

  return planCreatedEvent
}

export function createSubscriptionCancelledEvent(
  subscriber: Address
): SubscriptionCancelled {
  let subscriptionCancelledEvent = changetype<SubscriptionCancelled>(
    newMockEvent()
  )

  subscriptionCancelledEvent.parameters = new Array()

  subscriptionCancelledEvent.parameters.push(
    new ethereum.EventParam(
      "subscriber",
      ethereum.Value.fromAddress(subscriber)
    )
  )

  return subscriptionCancelledEvent
}

export function createSubscriptionChargedEvent(
  subscriber: Address,
  plan: i32,
  nextCharge: BigInt
): SubscriptionCharged {
  let subscriptionChargedEvent = changetype<SubscriptionCharged>(newMockEvent())

  subscriptionChargedEvent.parameters = new Array()

  subscriptionChargedEvent.parameters.push(
    new ethereum.EventParam(
      "subscriber",
      ethereum.Value.fromAddress(subscriber)
    )
  )
  subscriptionChargedEvent.parameters.push(
    new ethereum.EventParam(
      "plan",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(plan))
    )
  )
  subscriptionChargedEvent.parameters.push(
    new ethereum.EventParam(
      "nextCharge",
      ethereum.Value.fromUnsignedBigInt(nextCharge)
    )
  )

  return subscriptionChargedEvent
}

export function createSubscriptionCreatedEvent(
  subscriber: Address,
  plan: i32
): SubscriptionCreated {
  let subscriptionCreatedEvent = changetype<SubscriptionCreated>(newMockEvent())

  subscriptionCreatedEvent.parameters = new Array()

  subscriptionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "subscriber",
      ethereum.Value.fromAddress(subscriber)
    )
  )
  subscriptionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "plan",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(plan))
    )
  )

  return subscriptionCreatedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
