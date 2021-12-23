export const noCartFoundForGivenPaymentId = {
  limit: 20,
  offset: 0,
  count: 0,
  total: 0,
  results: [],
};

export const cartWithLineItems = {
  limit: 20,
  offset: 0,
  count: 1,
  total: 1,
  results: [
    {
      type: 'Cart',
      id: '08f21547-92c8-4519-9fd8-84dc05827f0f',
      version: 3,
      lastMessageSequenceNumber: 1,
      createdAt: '2021-12-20T10:14:47.490Z',
      lastModifiedAt: '2021-12-20T10:14:58.741Z',
      lastModifiedBy: {
        clientId: 'WbXlHz8J2g8opneE93IICbU-',
        isPlatformClient: false,
      },
      createdBy: {
        clientId: 'WbXlHz8J2g8opneE93IICbU-',
        isPlatformClient: false,
      },
      lineItems: [
        {
          id: '23a9f668-68c8-4f86-bbeb-e81364232ba2',
          productId: 'd80ee13a-ab3e-404e-86d5-0b6848ee8299',
          name: {
            en: 'Sweater Pinko white',
            de: 'Pullover Pinko weiß',
          },
          productType: {
            typeId: 'product-type',
            id: '70b1d00a-60bf-4225-921a-9744b7efde5c',
            version: 1,
          },
          productSlug: {
            en: 'pinko-sweater-1G10XXY19KZ04-white',
            de: 'pinko-pullover-1G10XXY19KZ04-weiss',
          },
          variant: {
            id: 1,
            sku: 'M0E20000000DJR9',
            prices: [
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 21250,
                  fractionDigits: 2,
                },
                id: '6fc54b84-3db6-405a-ac7b-c4d35f3ebc35',
              },
            ],
          },
          price: {
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 21250,
              fractionDigits: 2,
            },
            id: '6fc54b84-3db6-405a-ac7b-c4d35f3ebc35',
          },
          quantity: 2,
          discountedPricePerQuantity: [],
          taxRate: {
            name: '21% incl.',
            amount: 0.21,
            includedInPrice: true,
            country: 'NL',
            id: '0gSSkVZl',
            subRates: [],
          },
          state: [
            {
              quantity: 2,
              state: {
                typeId: 'state',
                id: '839361ed-0cf0-4589-be12-f71bb0be96bd',
              },
            },
          ],
          priceMode: 'Platform',
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 42500,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 35124,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 42500,
              fractionDigits: 2,
            },
          },
          lineItemMode: 'Standard',
        },
        {
          id: '48932224-7b98-44fc-ae0c-8f05550f3d7c',
          productId: '00a97ad0-3b5b-4882-be4d-5025014e4e10',
          name: {
            en: 'Bag medium GUM black',
            de: 'Tasche medium GUM schwarz',
          },
          productType: {
            typeId: 'product-type',
            id: '70b1d00a-60bf-4225-921a-9744b7efde5c',
            version: 1,
          },
          productSlug: {
            en: 'gum-bag-medium-BS1900-black',
            de: 'gum-tasche-medium-BS1900-schwarz',
          },
          variant: {
            id: 1,
            sku: 'A0E2000000027DV',
            prices: [
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 11875,
                  fractionDigits: 2,
                },
                id: '1b7dd61e-cee0-4088-8a1f-458e33055d30',
              },
            ],
          },
          price: {
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 11875,
              fractionDigits: 2,
            },
            id: '1b7dd61e-cee0-4088-8a1f-458e33055d30',
          },
          quantity: 4,
          discountedPricePerQuantity: [],
          taxRate: {
            name: '21% incl.',
            amount: 0.21,
            includedInPrice: true,
            country: 'NL',
            id: '0gSSkVZl',
            subRates: [],
          },
          state: [
            {
              quantity: 4,
              state: {
                typeId: 'state',
                id: '839361ed-0cf0-4589-be12-f71bb0be96bd',
              },
            },
          ],
          priceMode: 'Platform',
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 47500,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 39256,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 47500,
              fractionDigits: 2,
            },
          },
          lineItemMode: 'Standard',
        },
      ],
      cartState: 'Active',
      totalPrice: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 90000,
        fractionDigits: 2,
      },
      taxedPrice: {
        totalNet: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 74380,
          fractionDigits: 2,
        },
        totalGross: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 90000,
          fractionDigits: 2,
        },
        taxPortions: [
          {
            rate: 0.21,
            amount: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 15620,
              fractionDigits: 2,
            },
            name: '21% incl.',
          },
        ],
      },
      customLineItems: [],
      discountCodes: [],
      paymentInfo: {
        payments: [
          {
            typeId: 'payment',
            id: 'd75d0b1d-64c5-4c8f-86f6-b9510332e743',
          },
        ],
      },
      inventoryMode: 'None',
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      deleteDaysAfterLastModification: 90,
      refusedGifts: [],
      origin: 'Customer',
      shippingAddress: {
        firstName: 'Diego',
        lastName: ' Ruiz y Picasso',
        streetName: 'Picassostraat',
        streetNumber: '4711',
        postalCode: '1111AB',
        city: 'Amsterdam',
        country: 'NL',
        email: 'picasso@mail.com',
      },
      billingAddress: {
        firstName: 'Pablo',
        lastName: 'Picasso',
        streetName: 'Picassostraat',
        streetNumber: '4711',
        postalCode: '1111AB',
        city: 'Amsterdam',
        country: 'NL',
        email: 'picasso@mail.com',
      },
      itemShippingAddresses: [],
    },
  ],
};

export const cartWithLineItemsAndCustomLineItem = {
  limit: 20,
  offset: 0,
  count: 1,
  total: 1,
  results: [
    {
      type: 'Cart',
      id: '84e5f274-c413-404e-b938-ffb45ce63f61',
      version: 3,
      lastMessageSequenceNumber: 1,
      createdAt: '2021-12-21T07:26:29.988Z',
      lastModifiedAt: '2021-12-21T07:27:15.241Z',
      lastModifiedBy: {
        clientId: 'WbXlHz8J2g8opneE93IICbU-',
        isPlatformClient: false,
      },
      createdBy: {
        clientId: 'WbXlHz8J2g8opneE93IICbU-',
        isPlatformClient: false,
      },
      lineItems: [
        {
          id: '3f7c61ab-27d8-4b52-b7e6-00524b88c01b',
          productId: 'd80ee13a-ab3e-404e-86d5-0b6848ee8299',
          name: {
            en: 'Sweater Pinko white',
            de: 'Pullover Pinko weiß',
          },
          productType: {
            typeId: 'product-type',
            id: '70b1d00a-60bf-4225-921a-9744b7efde5c',
            version: 1,
          },
          productSlug: {
            en: 'pinko-sweater-1G10XXY19KZ04-white',
            de: 'pinko-pullover-1G10XXY19KZ04-weiss',
          },
          variant: {
            id: 1,
            sku: 'M0E20000000DJR9',
            prices: [
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 21250,
                  fractionDigits: 2,
                },
                id: '6fc54b84-3db6-405a-ac7b-c4d35f3ebc35',
              },
            ],
          },
          price: {
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 21250,
              fractionDigits: 2,
            },
            id: '6fc54b84-3db6-405a-ac7b-c4d35f3ebc35',
          },
          quantity: 2,
          discountedPricePerQuantity: [],
          taxRate: {
            name: '21% incl.',
            amount: 0.21,
            includedInPrice: true,
            country: 'NL',
            id: '0gSSkVZl',
            subRates: [],
          },
          state: [
            {
              quantity: 2,
              state: {
                typeId: 'state',
                id: '839361ed-0cf0-4589-be12-f71bb0be96bd',
              },
            },
          ],
          priceMode: 'Platform',
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 42500,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 35124,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 42500,
              fractionDigits: 2,
            },
          },
          lineItemMode: 'Standard',
        },
        {
          id: 'a8f2d939-fedb-4164-ada0-e638252d0993',
          productId: '00a97ad0-3b5b-4882-be4d-5025014e4e10',
          name: {
            en: 'Bag medium GUM black',
            de: 'Tasche medium GUM schwarz',
          },
          productType: {
            typeId: 'product-type',
            id: '70b1d00a-60bf-4225-921a-9744b7efde5c',
            version: 1,
          },
          productSlug: {
            en: 'gum-bag-medium-BS1900-black',
            de: 'gum-tasche-medium-BS1900-schwarz',
          },
          variant: {
            id: 1,
            sku: 'A0E2000000027DV',
            prices: [
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 11875,
                  fractionDigits: 2,
                },
                id: '1b7dd61e-cee0-4088-8a1f-458e33055d30',
              },
            ],
          },
          price: {
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 11875,
              fractionDigits: 2,
            },
            id: '1b7dd61e-cee0-4088-8a1f-458e33055d30',
          },
          quantity: 4,
          discountedPricePerQuantity: [],
          taxRate: {
            name: '21% incl.',
            amount: 0.21,
            includedInPrice: true,
            country: 'NL',
            id: '0gSSkVZl',
            subRates: [],
          },
          addedAt: '2021-12-21T07:26:29.982Z',
          lastModifiedAt: '2021-12-21T07:26:29.982Z',
          state: [
            {
              quantity: 4,
              state: {
                typeId: 'state',
                id: '839361ed-0cf0-4589-be12-f71bb0be96bd',
              },
            },
          ],
          priceMode: 'Platform',
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 47500,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 39256,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 47500,
              fractionDigits: 2,
            },
          },
          lineItemMode: 'Standard',
        },
      ],
      cartState: 'Active',
      totalPrice: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 88500,
        fractionDigits: 2,
      },
      taxedPrice: {
        totalNet: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 72880,
          fractionDigits: 2,
        },
        totalGross: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 88500,
          fractionDigits: 2,
        },
        taxPortions: [
          {
            rate: 0.0,
            amount: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 0,
              fractionDigits: 2,
            },
            name: 'zero-nl-tax-category',
          },
          {
            rate: 0.21,
            amount: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 15620,
              fractionDigits: 2,
            },
            name: '21% incl.',
          },
        ],
      },
      customLineItems: [
        {
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: -1500,
            fractionDigits: 2,
          },
          id: 'a568f5eb-a788-497a-a93c-13050edaaf17',
          name: {
            en: 'Holiday Discount',
          },
          money: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: -1500,
            fractionDigits: 2,
          },
          slug: 'holiday-discount',
          quantity: 1,
          discountedPricePerQuantity: [],
          taxCategory: {
            typeId: 'tax-category',
            id: '4c6d2e9d-cbbd-4ca0-9e03-3ac9148a7c8c',
          },
          taxRate: {
            name: 'zero-nl-tax-category',
            amount: 0.0,
            includedInPrice: true,
            country: 'NL',
            id: 'AfweE5kQ',
            subRates: [],
          },
          state: [
            {
              quantity: 1,
              state: {
                typeId: 'state',
                id: '839361ed-0cf0-4589-be12-f71bb0be96bd',
              },
            },
          ],
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: -1500,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: -1500,
              fractionDigits: 2,
            },
          },
        },
      ],
      discountCodes: [],
      paymentInfo: {
        payments: [
          {
            typeId: 'payment',
            id: '990d9419-62c2-44e5-91d4-8cb9e5cc6518',
          },
        ],
      },
      inventoryMode: 'None',
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      deleteDaysAfterLastModification: 90,
      refusedGifts: [],
      origin: 'Customer',
      shippingAddress: {
        firstName: 'Diego',
        lastName: ' Ruiz y Picasso',
        streetName: 'Picassostraat',
        streetNumber: '4711',
        postalCode: '1111AB',
        city: 'Amsterdam',
        country: 'NL',
        email: 'picasso@mail.com',
      },
      billingAddress: {
        firstName: 'Pablo',
        lastName: 'Picasso',
        streetName: 'Picassostraat',
        streetNumber: '4711',
        postalCode: '1111AB',
        city: 'Amsterdam',
        country: 'NL',
        email: 'picasso@mail.com',
      },
      itemShippingAddresses: [],
    },
  ],
};
