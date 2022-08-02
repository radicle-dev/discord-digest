// tmp configs until we have a configurable system

export interface ServerConfig {
  textOutputChannelId: string;
  whitelistedRoles: string[]; // roles that can use the command
}

export const SERVER_CONFIGS: { [serverId: string]: ServerConfig } = {
  // radicle server
  "841318878125490186": {
    textOutputChannelId: "1001894607166128218", // #digest channel
    whitelistedRoles: [
      "841325714669699123",
      "939200885299503164",
      "963399948446089226",
      "939202256748830740",
      "1003988875133325352",
    ], // some core contributer roles for now while we test
  },
  // matt's server
  "880717349580328970": {
    textOutputChannelId: "1003789002085773413",
    whitelistedRoles: ["1003998915076554813"],
  },
};
