type RemoteMcpConfig = {
  type: "remote"
  url: string
  enabled: boolean
  headers?: Record<string, string>
  oauth?: false
}

export function createBuiltinMcps() {
  return {} satisfies Record<string, RemoteMcpConfig>
}
