# Setup of Test Environment


These are the steps for a correct configuration of a test Environment.


## Create test Mollie account

Create a new account for Mollie in:

https://my.mollie.com/

After the creation of the account, don't forget to set test mode on, in the top right part of many pages in the Dashboard as the list of orders:

https://my.mollie.com/dashboard/<ORGANISATION_ID>/orders


## Create and configure test CommerceTools account

Create a new account for CommerceTools in:

https://mc.europe-west1.gcp.commercetools.com/


Create a new Project in CommerceTools, with a name that will be forward referred as <PROJECT_NAME>.



Create API Client in CommerceTools for the Project (and MUST save the credentials).

The API Client account MUST have at least the following scopes:
- view_orders
- view_payments
- manage_payments

https://mc.europe-west1.gcp.commercetools.com/<PROJECT_NAME>/settings/developer/api-clients/new




## Local Repository


Clone the mollie-commercetools git repository locally

https://github.com/mollie/commercetools



## PostMan tests collection

You can find a collection of PostMan calls in this GitHub repository:

https://github.com/commercetools/commercetools-postman-collection


Here is it explained how to locally import Postman collections:

https://github.com/commercetools/commercetools-postman-collection/blob/master/import/collection.json


