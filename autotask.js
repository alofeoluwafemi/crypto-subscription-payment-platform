const graphql = require('graphql-request');
const { ethers } = require('ethers');
const {
    DefenderRelaySigner,
    DefenderRelayProvider
} = require('defender-relay-client/lib/ethers');

const { request, gql } = graphql;

const ABI = [
    {
        inputs: [],
        name: 'subscriptionToken',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { internalType: 'address', name: 'subscriber', type: 'address' }
        ],
        name: 'charge',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
];

exports.main = async function(signer, recipient, contractAddress) {
    const QueryUrl =
        'https://api.thegraph.com/subgraphs/name/alofeoluwafemi/payment-subscription-v4';

    const currentTime = (await ethers.getDefaultProvider().getBlock())
        .timestamp;

    const query = gql` {
            subscriptionPs(where: {nextCharge_lte: ${currentTime} }) {
              id
              subscriber
              nextCharge
            }
    }
    `;

    const result = await request(QueryUrl, query);
    const { subscriptionPs } = result;

    console.log(subscriptionPs);

    const provider = new ethers.providers.JsonRpcProvider(
        'https://alfajores-forno.celo-testnet.org'
    );
    const paymentSubscription = new ethers.Contract(
        contractAddress,
        ABI,
        signer,
        provider
    );

    subscriptionPs.forEach(async element => {
        try {
            const gasLimit = await paymentSubscription.estimateGas.charge(
                element.subscriber
            );
            const res = await paymentSubscription.charge(element.subscriber, {
                gasLimit: gasLimit
            });
        } catch (error) {
            console.log(error.reason != undefined ? error.reason : error);
        }
    });
};

// Entrypoint for the Autotask
exports.handler = async function(credentials) {
    // Initialize defender relayer provider and signer
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
        speed: 'fast'
    });
    const contractAddress = '0x95BD5b1B16C586025bF0750c21bd1de433de8D4c'; // PaymentSubscription contract address
    return exports.main(signer, await signer.getAddress(), contractAddress); // Charge due subscriptions
};

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
    exports
        .handler({
            apiKey: '',
            apiSecret:
                ''
        })
        // .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}