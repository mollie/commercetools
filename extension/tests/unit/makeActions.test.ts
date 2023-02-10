import { v4 as uuid } from 'uuid';

import { makeActions } from '../../src/makeActions';
import { ControllerAction } from '../../src/types';
import { createDateNowString } from '../../src/utils';

jest.mock('uuid');
jest.mock('../../src/utils');

describe('makeActions', () => {
  const mockUuid = 'f2e6db50-7bd8-4036-8e1f-9971b6226c62';
  beforeAll(() => {
    jest.mocked(uuid).mockReturnValue(mockUuid);
    jest.mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
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

  it('should return addInterfaceInteraction with defaults set for id and timestamp, if not provided', () => {
    const params = {
      actionType: ControllerAction.GetPaymentMethods,
      requestValue: '{}',
      responseValue: '"count": 5, "methods": [ "creditcard"]',
    };
    const addInterfaceInteraction = makeActions.addInterfaceInteraction(params);
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

  it('should return addInterfaceInteraction using provided id and timestamp', () => {
    const params = {
      actionType: ControllerAction.GetPaymentMethods,
      requestValue: '{}',
      responseValue: '"count": 5, "methods": [ "creditcard"]',
      id: 'a4ac79f3-f623-4f00-8d43-d5b1b24caba1',
      timestamp: '2018-10-12T14:00:00.000Z',
    };
    const addInterfaceInteraction = makeActions.addInterfaceInteraction(params);
    expect(addInterfaceInteraction).toEqual({
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        id: 'a4ac79f3-f623-4f00-8d43-d5b1b24caba1',
        actionType: ControllerAction.GetPaymentMethods,
        createdAt: '2018-10-12T14:00:00.000Z',
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
