[![GitHub Actions](https://github.com/mollie/commercetools/actions/workflows/ci.yaml/badge.svg)](https://github.com/mollie/commercetools/actions/workflows/ci.yaml/badge.svg)
[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

Initial development is in progress, there is not yet a stable public release. 
# commercetools-Mollie Integration
___
`commercetools` provides an [Hosted checkout](https://docs.mollie.com/payments/hosted-checkout) based integration between the commercetools and Mollie PSP.
- [Supported features](#supported-features)
- [Overview](#overview)
    - [Extension module](#extension-module)
    - [Notification module](#notification-module)
- [Other guides](#other-guides)

## Supported features
- [Mollie hosted checkout](https://docs.mollie.com/payments/hosted-checkout) based payment methods.
    - Note: since the integration relies on the usage of Mollie checkout environment it does not need to process sensitive credit card data and thus is fully PCI DSS **compliant**.
- Asynchronous notifications handling via [notification module](#notification-module).
- [Refunding](./docs/Refund.md) a payment back to the shopper.
- Authorisation [cancellation](./docs/CancelOrder.md) on a payment that has not yet been captured.

## Overview
This repository contains two standalone modules that interact with commercetools and Mollie.
Complete integration requires running both of the modules.

PAYMENT FLOW
TBD
## Extension module
The extension module is a publicly exposed service that acts as a middleware between the commercetools platform and Mollie.
Once [commercetools HTTP API Extensions](https://docs.commercetools.com/http-api-projects-api-extensions) is configured to call mollie extension module, for every payment create or update request an mollie extension will be remotely called by the commercetools platform.

- Follow [Integration Guide](./docs/Installing_CommerceTools_APIExtension.md) for information how to integrate your shop with this module.
- Follow [How to run](./docs/Deployment.md) the extension module.

The API extension is found in the [extension](./extension/README.md) folder.

## Notification module
### Notification module

Notification module is a publicly exposed service which receives asynchronous notifications sent by Mollie.
Through notifications, Mollie provides asynchronously payment status changes like authorization, charge, or refund of the payment.
The notification module will process the notification sent by Mollie and matches the commercetools payment for this notification, and modifies commercetools payment accordingly.

- Follow [Integration Guide](./docs/Installing_CommerceTools_APIExtension.md) for information how to integrate with notification module.
- Follow [How to run](./docs/Deployment.md) the notification module.

## Contribution Guidelines

Please see the [Contribution Guide](./docs/ContributionGuidelines.md).
