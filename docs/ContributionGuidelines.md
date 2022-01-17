<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Contribution Guide](#contribution-guide)
    - [Contents](#contents)
    - [Prerequisites](#prerequisites)
    - [Development](#development)
        - [E2E tests (Extension module only)](#e2e-tests-extension-module-only)
            - [Debugging](#debugging)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Contribution Guide

## Contents
- [Prerequisites](#prerequisites)
- [Development](#development)

## Prerequisites

Minimum requirements are:
- **Node.js** version 14.
- **Npm** version 8.1.0

You can install all dependencies using `npm` with following command:

```
npm install
```

## Development
While developing project you can use some predefined commands for running tests, running linter or generating coverage.

- Execute `npm run test` to run all tests.
- Execute `npm run test:unit` to run Unit tests.
- Execute `npm run test:component` to run Component tests.
- Execute `npm run lint` to show lint errors in the code.