import _ from "lodash"
import getPaymentMethods from "../src/requestHandlers/getPaymentMethods"
import { Request } from "express"

describe("getPaymentMethods unit tests", () => {
  beforeAll(() => {
    console.warn = jest.fn
  })
  afterAll(() => {
    jest.clearAllMocks()
  })

  it("Should call mollie mollieClient.methods.all", async () => {
    const mockedRequest = {
      body: { custom: { fields: { paymentMethodsRequest: {} } } }
    } as Request
    const mollieClient = { methods: { all: jest.fn().mockResolvedValueOnce([]) } } as any
    await getPaymentMethods(mockedRequest, mollieClient)
    expect(mollieClient.methods.all).toBeCalled()
  })

  it("Should return correctly formated response with saved request and response", async () => {
    const mockedPaymentMethodsRequest = {
      locale: "en_US",
      resource: "orders",
      billingCountry: "NL",
      includeWallets: "applepay",
      orderLineCategories: "eco,meal",
    }
    const mockedRequest = {
      body: { custom: { fields: { paymentMethodsRequest: mockedPaymentMethodsRequest } } }
    } as Request
    const mockedResponse = [{
      resource: 'method',
      id: 'ideal',
      description: 'iDEAL',
      minimumAmount: { value: '0.01', currency: 'EUR' },
      maximumAmount: { value: '50000.00', currency: 'EUR' },
      image: {
        size1x: 'https://www.mollie.com/external/icons/payment-methods/ideal.png',
        size2x: 'https://www.mollie.com/external/icons/payment-methods/ideal%402x.png',
        svg: 'https://www.mollie.com/external/icons/payment-methods/ideal.svg'
      },
      status: 'pending-boarding',
      _links: {}
    }]

    const mollieClient = { methods: { all: jest.fn().mockResolvedValueOnce(mockedResponse) } } as any
    const mockedMollieResponse = await getPaymentMethods(mockedRequest, mollieClient)

    const addInterfaceInteractionObject = _.find(mockedMollieResponse.actions, ["action", "addInterfaceInteraction"])
    const setCustomFieldObject = _.find(mockedMollieResponse.actions, ["action", "setCustomField"])

    expect(mockedMollieResponse).toHaveProperty('actions');
    expect(mockedMollieResponse.actions).toBeInstanceOf(Array);
    expect(mockedMollieResponse.actions).toHaveLength(2);

    expect(JSON.parse(addInterfaceInteractionObject.fields.request)).toMatchObject(mockedPaymentMethodsRequest);
    expect(JSON.parse(setCustomFieldObject.value)).toMatchObject(mockedResponse);
  })

  it("Should not fail without request body", async () => {
    const mockedRequest = {} as Request
    const mollieClient = { methods: { all: jest.fn().mockResolvedValueOnce([]) } } as any
    const mockedMollieResponse = await getPaymentMethods(mockedRequest, mollieClient)

    expect(mockedMollieResponse).toHaveProperty('actions');
    expect(mockedMollieResponse.actions).toBeInstanceOf(Array);
    expect(mockedMollieResponse.actions).toHaveLength(2);
  })

  it("Should return error if mollieClient call fails", async () => {
    const mockedError = new Error('Test error')
    const mockedRequest = {} as Request
    const mollieClient = { methods: { all: jest.fn().mockRejectedValue(mockedError) } } as any
    const mockedMollieResponse = await getPaymentMethods(mockedRequest, mollieClient)

    expect(mockedMollieResponse).toBeInstanceOf(Error)
  })
})