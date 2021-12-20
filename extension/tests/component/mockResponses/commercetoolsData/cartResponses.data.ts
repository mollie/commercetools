export const noCartFoundForGivenPaymentId = {
  limit: 20,
  offset: 0,
  count: 0,
  total: 0,
  results: [],
};

export const cartFoundWith2LineItemsForGivenPaymentId = {
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
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 13934,
                  fractionDigits: 2,
                },
                id: 'c7409415-8651-40f4-88fa-920843b33c40',
                customerGroup: {
                  typeId: 'customer-group',
                  id: '4d6bb701-e230-4a6b-9f8b-e7ae1a09654c',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 21250,
                  fractionDigits: 2,
                },
                id: '5252dd2b-5497-4aa4-9491-e8018f88aa21',
                country: 'US',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 13934,
                  fractionDigits: 2,
                },
                id: 'f7ced896-f9d8-444e-8ae0-dfbcdd98d81c',
                customerGroup: {
                  typeId: 'customer-group',
                  id: '4d6bb701-e230-4a6b-9f8b-e7ae1a09654c',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 17000,
                  fractionDigits: 2,
                },
                id: '4198e866-4b1f-4452-a146-5fd4f1c556c9',
                country: 'DE',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 17000,
                  fractionDigits: 2,
                },
                id: '396b5e1f-b94b-4fbb-8384-ee282b8a4a5a',
                country: 'IT',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 17000,
                  fractionDigits: 2,
                },
                id: 'ff2ad6fc-6cda-4636-a53b-6699f382e9c3',
                country: 'GB',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 18700,
                  fractionDigits: 2,
                },
                id: '337681b3-f3a0-4b9d-9e2e-ed816a3360f0',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: 'b96759a8-b8d4-42b2-b097-eff5e2fd5e47',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 22312,
                  fractionDigits: 2,
                },
                id: '4014dfd7-ead8-451f-9f54-4df542e7d9ec',
                channel: {
                  typeId: 'channel',
                  id: '33b2ee20-4f7e-4a7c-9534-0b4b82d7fcd4',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 17510,
                  fractionDigits: 2,
                },
                id: '2fd65dcc-4d0f-45d8-a3ce-c6fd8d7e9a46',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: '2bceda8b-eadd-4ed7-833e-184cc54304ec',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 17850,
                  fractionDigits: 2,
                },
                id: '15d12091-4a21-4c26-b47b-1b0b6e5d4772',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: '03df92b3-fcf5-4929-9a90-1251c91b1f23',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 16150,
                  fractionDigits: 2,
                },
                id: 'b7b56b0d-9492-44af-93f4-21f28ab00cc7',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: '15aaa628-20da-4d2a-8a18-13e0cfb019c9',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 18700,
                  fractionDigits: 2,
                },
                id: 'ab7bb0d7-a585-4fb1-832e-a39d4ebf50ef',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: '53794e3e-7c7f-4c62-9dff-d12341797dea',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 22312,
                  fractionDigits: 2,
                },
                id: 'e2314300-d130-4515-af9f-a2a0393b16b8',
                channel: {
                  typeId: 'channel',
                  id: 'eed002d6-8194-48a8-85c0-d247e92c972c',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 17510,
                  fractionDigits: 2,
                },
                id: 'cd6afa51-6e2f-4985-bd20-b1cd43411522',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: '6df5b292-29d2-4772-9db7-9484246abdc3',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 17850,
                  fractionDigits: 2,
                },
                id: '82a949ac-ddff-449b-93a5-fed4637aa888',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: 'f3770bf0-b5ad-4bf1-8d4c-6b1914bd69ce',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 16150,
                  fractionDigits: 2,
                },
                id: 'b45f4b08-587d-4a9a-97e7-598c58f13b6c',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: '69069086-122b-42e3-a55f-91b2f9c997da',
                },
              },
            ],
            images: [
              {
                url: 'https://s3-eu-west-1.amazonaws.com/commercetools-maximilian/products/072601_1_large.jpg',
                dimensions: {
                  w: 0,
                  h: 0,
                },
              },
            ],
            attributes: [
              {
                name: 'articleNumberManufacturer',
                value: '1G10XX Y19K Z04',
              },
              {
                name: 'articleNumberMax',
                value: '72601',
              },
              {
                name: 'matrixId',
                value: 'M0E20000000DJR9',
              },
              {
                name: 'baseId',
                value: '72601',
              },
              {
                name: 'designer',
                value: {
                  key: 'pinko',
                  label: 'Pinko',
                },
              },
              {
                name: 'madeInItaly',
                value: {
                  key: 'no',
                  label: 'no',
                },
              },
              {
                name: 'commonSize',
                value: {
                  key: 'xxs',
                  label: 'XXS',
                },
              },
              {
                name: 'size',
                value: 'XXS',
              },
              {
                name: 'color',
                value: {
                  key: 'white',
                  label: {
                    it: 'blanco',
                    de: 'weiss',
                    en: 'white',
                  },
                },
              },
              {
                name: 'colorFreeDefinition',
                value: {
                  en: 'white',
                  de: 'weiß',
                },
              },
              {
                name: 'style',
                value: {
                  key: 'sporty',
                  label: 'sporty',
                },
              },
              {
                name: 'gender',
                value: {
                  key: 'women',
                  label: 'Damen',
                },
              },
              {
                name: 'season',
                value: 's15',
              },
            ],
            assets: [],
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
          addedAt: '2021-12-20T10:14:47.485Z',
          lastModifiedAt: '2021-12-20T10:14:47.485Z',
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
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 7787,
                  fractionDigits: 2,
                },
                id: '962b23a4-5a91-4356-8d33-d1a0720c5823',
                customerGroup: {
                  typeId: 'customer-group',
                  id: '4d6bb701-e230-4a6b-9f8b-e7ae1a09654c',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 11875,
                  fractionDigits: 2,
                },
                id: 'a30b8880-3d1c-4f8e-9343-b52a26608e39',
                country: 'US',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 7787,
                  fractionDigits: 2,
                },
                id: '3a078477-a242-44e2-9a88-a177a7cda480',
                customerGroup: {
                  typeId: 'customer-group',
                  id: '4d6bb701-e230-4a6b-9f8b-e7ae1a09654c',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 9500,
                  fractionDigits: 2,
                },
                id: '78028a7a-f798-48f8-87d5-e1cb81363245',
                country: 'DE',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 9500,
                  fractionDigits: 2,
                },
                id: '92d1a5e9-b955-460a-b64d-c02bcebdffa7',
                country: 'IT',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 9500,
                  fractionDigits: 2,
                },
                id: 'e2b283ae-3093-45cb-8f25-6b52a9b52d0a',
                country: 'GB',
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 9880,
                  fractionDigits: 2,
                },
                id: '3865cacd-727a-4f9c-a4cf-648b4616ad35',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: 'b96759a8-b8d4-42b2-b097-eff5e2fd5e47',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 12112,
                  fractionDigits: 2,
                },
                id: '6a993395-35d0-4748-a0ac-5fdb4f5a8998',
                channel: {
                  typeId: 'channel',
                  id: '33b2ee20-4f7e-4a7c-9534-0b4b82d7fcd4',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 10260,
                  fractionDigits: 2,
                },
                id: '4dbf2c32-1ed7-4f62-9dbc-4a417b534e23',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: '2bceda8b-eadd-4ed7-833e-184cc54304ec',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 9405,
                  fractionDigits: 2,
                },
                id: '49bf0e9a-b5b1-44a0-847f-15156eee3813',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: '03df92b3-fcf5-4929-9a90-1251c91b1f23',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'EUR',
                  centAmount: 8740,
                  fractionDigits: 2,
                },
                id: 'eacb353e-0235-46b1-b650-7189120b823f',
                country: 'DE',
                channel: {
                  typeId: 'channel',
                  id: '15aaa628-20da-4d2a-8a18-13e0cfb019c9',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 9880,
                  fractionDigits: 2,
                },
                id: '43a53fb8-7f5e-441c-8452-2259dca3eb5c',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: '53794e3e-7c7f-4c62-9dff-d12341797dea',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 12112,
                  fractionDigits: 2,
                },
                id: 'd6caa39d-58c7-4f4b-80c9-e9f6fb54c405',
                channel: {
                  typeId: 'channel',
                  id: 'eed002d6-8194-48a8-85c0-d247e92c972c',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 10260,
                  fractionDigits: 2,
                },
                id: '150b1eda-6b5b-4f5f-b562-29fe32f1b1aa',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: '6df5b292-29d2-4772-9db7-9484246abdc3',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 9405,
                  fractionDigits: 2,
                },
                id: '831c5bb9-ceb1-48b2-86b0-ac769e2908bb',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: 'f3770bf0-b5ad-4bf1-8d4c-6b1914bd69ce',
                },
              },
              {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'USD',
                  centAmount: 8740,
                  fractionDigits: 2,
                },
                id: 'af099a6d-76b3-4944-acdc-4928f6161c70',
                country: 'US',
                channel: {
                  typeId: 'channel',
                  id: '69069086-122b-42e3-a55f-91b2f9c997da',
                },
              },
            ],
            images: [
              {
                url: 'https://s3-eu-west-1.amazonaws.com/commercetools-maximilian/products/082612_1_medium.jpg',
                dimensions: {
                  w: 0,
                  h: 0,
                },
              },
            ],
            attributes: [
              {
                name: 'articleNumberManufacturer',
                value: 'BS1900 GOLD NERO',
              },
              {
                name: 'articleNumberMax',
                value: '82612',
              },
              {
                name: 'matrixId',
                value: 'A0E2000000027DV',
              },
              {
                name: 'baseId',
                value: '82612',
              },
              {
                name: 'designer',
                value: {
                  key: 'gum',
                  label: 'Gum by Gianni Chiarini',
                },
              },
              {
                name: 'madeInItaly',
                value: {
                  key: 'yes',
                  label: 'yes',
                },
              },
              {
                name: 'commonSize',
                value: {
                  key: 'oneSize',
                  label: 'one Size',
                },
              },
              {
                name: 'size',
                value: 'one size',
              },
              {
                name: 'color',
                value: {
                  key: 'black',
                  label: {
                    en: 'black',
                    it: 'nero',
                    de: 'schwarz',
                  },
                },
              },
              {
                name: 'colorFreeDefinition',
                value: {
                  en: 'black',
                  de: 'schwarz',
                },
              },
              {
                name: 'style',
                value: {
                  key: 'sporty',
                  label: 'sporty',
                },
              },
              {
                name: 'gender',
                value: {
                  key: 'women',
                  label: 'Damen',
                },
              },
              {
                name: 'season',
                value: 's15',
              },
              {
                name: 'isOnStock',
                value: true,
              },
            ],
            assets: [],
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
          addedAt: '2021-12-20T10:14:47.485Z',
          lastModifiedAt: '2021-12-20T10:14:47.485Z',
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
