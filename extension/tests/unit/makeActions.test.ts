import { before } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { makeActions } from '../../src/makeActions';
import { ControllerAction } from '../../src/types';
import { createDateNowString } from '../../src/utils';

jest.mock('../../src/utils');

describe('makeActions', () => {
  beforeAll(() => {
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
        actionType: ControllerAction.GetPaymentMethods,
        createdAt: '2021-10-08T12:12:02.625Z',
        request: '{}',
        response: '"count": 5, "methods": [ "creditcard"]',
      },
    });
  });
});
