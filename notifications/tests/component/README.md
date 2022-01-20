# Component Tests

To test full webhook flows, we use component tests.

These simulate a mollie calling our notifications module with either an order or payment id, then asserts that the correct update actions are called against the commercetools API.

![Diagram showing component vs acceptance tests](./component_testing.png)

This does not call the commercetools nor mollie API directly. The requests are intercepted and mock responses returned, using [nock](https://github.com/nock/nock).

These tests show us that our individual functions are working as expected together & act as Regression Tests once flows are completed.

## Running the tests

To run the tests, make sure you have installed node modules, then:

```
# Run all component tests
npm run test:component

# Run in watch mode
npm run test:component -- --watch
```

These also run as a step in our CI pipeline.

## Maintaining the tests

The tests should cover full webhook flows, e.g. mollie triggering the notifications module, who will call mollie and commmercetools to get the relevant data, then create update actions as required to be sent to commercetools.

The mock responses for the APIs should be saved in `/mockResponses` folder.
