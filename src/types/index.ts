export type CTActionResponse = {
  actions: Action[]
}

export type Action = {
  action: string,
  type?: {
    key: string
  },
  fields?:
  {
    actionType: string,
    request?: string,
    response?: string,
    createdAt?: string,
  },
  name?: string,
  value?: string
}