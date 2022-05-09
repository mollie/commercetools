# Contribution Guide

* [Prerequisites](#prerequisites)
* [Development](#development)

## Prerequisites

To merge your changes, your commits must be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

Minimum requirements are:
- **Node.js** version 14
- **Npm** version 8.1.0
- **Bash** shell
- **Signed** git commits

You can install all dependencies using `npm` with following command:

```
npm install
```

## Development
While developing project you can use some predefined commands for running tests, running linter or generating coverage.

- Execute `npm run test` to run all tests.
- Execute `npm run test:coverage` to run all tests and print the code coverage report.
- Execute `npm run test:unit` to run Unit tests.
- Execute `npm run test:component` to run Component tests.
- Execute `npm run lint` to show lint errors in the code.