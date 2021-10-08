export type CTUpdatesRequestedResponse = {
  status: number;
  actions?: Action[];
  errors?: Error[];
};

export type Action = {
  action: string;
  type?: {
    key: string;
  };
  fields?: {
    actionType: string;
    request?: string;
    response?: string;
    createdAt?: string;
  };
  name?: string;
  value?: string;
};

export type Error = {
  code: string;
  message: string;
  extensionExtraInfo?: JSON;
};
