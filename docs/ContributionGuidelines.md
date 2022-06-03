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

## Release procedure
At the moment there is no automated release scripts, which means we do releases manually. We use [gitflow workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) for releases. Please **squash commits when finishing the feature branch**, this way we can keep relatively clean history on develop and main. 

Release following these steps:

1. Create and check out release branch off develop once new features are ready to be released (`release/<tag>`).
2. Bump [version](https://semver.org/) on npm packages (both extension and notifications). Commit changes on release branch.
3. Create PR and merge release branch to main. Do not squash commits at this stage.
4. Create a new tag on main and create release on [GitHub](https://github.com/mollie/commercetools/releases).
5. Create PR and merge main branch back to develop. Do not squash commits at this stage.