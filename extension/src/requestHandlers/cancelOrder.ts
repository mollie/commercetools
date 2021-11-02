import { MollieClient } from '@mollie/api-client';

import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';

export default async function cancelOrder(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {

    console.log('Cancelled Triggered', ctObj)
    return {
      // actions: ctActions,
      actions: [],
      status: 201,
    };
  } catch (error: any) {
    console.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
