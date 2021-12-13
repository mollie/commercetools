# Component Tests

To test full journeys, we use component tests.

These simulate a commercetools Payment object coming into our app and assert that the correct response, update actions (or errors) have been returned.

![Diagram showing component vs acceptance tests](./component_testing.png)

This does not call the commercetools nor mollie API directly. The requests are intercepted and mock responses returned, using [nock](https://github.com/nock/nock).

These tests show us that our individual functions are working as expected together & act as Regression Tests once journeys are completed.

## Running the tests

To run the tests, make sure you have installed node modules, then:

```
# Run all component tests
npm run test:component

# Run in watch mode
npm run test:component -- --watch
```

These also run as a step in our CI pipeline. As each journey is updated / completed, it must have a corresponding component test, which should run in the pipeline.

## Maintaining the tests

The tests should cover full journeys, e.g. an incoming request to the API extension which should create an order in mollie and return update actions for commercetools.

As each journey is updated / completed, it must have a corresponding component test, which should run in the pipeline.

The mock responses for the APIs should be saved in `/mockResponses` folder.
