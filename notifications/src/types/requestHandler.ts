import { CTError } from './ctError';
import { CTUpdateAction } from './ctUpdateActions';

export type WebhookHandlerResponse = {
  actions: CTUpdateAction[];
  version: number;
  orderId?: string;
};

export class HandleRequestInput {
  constructor(public httpPath: string, public httpMethod: string, public httpBody: any) {}
}

export class HandleRequestSuccess {
  constructor(public status: number, public actions: CTUpdateAction[] = []) {}
}

export class HandleRequestFailure {
  constructor(public status: number, public errors: CTError[] = []) {}
}

export type HandleRequestOutput = HandleRequestSuccess | HandleRequestFailure;
