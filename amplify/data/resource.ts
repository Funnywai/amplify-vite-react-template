import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Score: a
    .model({
      roundNumber: a.integer().required(),
      tsim: a.integer(),
      jason: a.integer(),
      wai: a.integer(),
      mumSoup: a.integer(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
    
  PlayerStat: a
    .model({
      playerName: a.string().required(),
      winByOthers: a.integer(),      // 食胡
      selfDrawn: a.integer(),        // 自摸
      paidOut: a.integer(),          // 出統
      specialBonus: a.integer(),     // 特別賞罰
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});