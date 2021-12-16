import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import { makeActions } from '../../src/makeActions';
import { ControllerAction } from '../../src/types';
import { createDateNowString } from '../../src/utils';

jest.mock('uuid');
jest.mock('../../src/utils');

describe('makeActions', () => {
  const mockUuid = 'f2e6db50-7bd8-4036-8e1f-9971b6226c62';
  beforeAll(() => {
    mocked(uuid).mockReturnValue(mockUuid);
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
  it('should return setCustomField action with correct values', () => {
    const setCustomField = makeActions.setCustomField('mollieOrderStatus', 'created');
    expect(setCustomField).toEqual({
      action: 'setCustomField',
      name: 'mollieOrderStatus',
      value: 'created',
    });
  });

  it('should return addInterfaceInteraction with correct values', () => {
    const addInterfaceInteraction = makeActions.addInterfaceInteraction(ControllerAction.GetPaymentMethods, '{}', '"count": 5, "methods": [ "creditcard"]');
    expect(addInterfaceInteraction).toEqual({
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        id: mockUuid,
        actionType: ControllerAction.GetPaymentMethods,
        createdAt: '2021-10-08T12:12:02.625Z',
        request: '{}',
        response: '"count": 5, "methods": [ "creditcard"]',
      },
    });
  });

  it('should return changeTransactionTimestamp with correct timestamp and id', () => {
    const changeTransactionTimestampAction = makeActions.changeTransactionTimestamp('5a9868a0-7703-4bf2-95b8-bd7fa2e889e6', '2018-10-12T14:00:00.000Z');
    expect(changeTransactionTimestampAction).toEqual({
      action: 'changeTransactionTimestamp',
      transactionId: '5a9868a0-7703-4bf2-95b8-bd7fa2e889e6',
      timestamp: '2018-10-12T14:00:00.000Z',
    });
  });
});
