import _ from 'lodash'
import config from './config'
import { DatabaseClient } from './dbClient'
import { AuthServer } from './authServer'
import { botFactory } from './bot'
import { slackProviderFactory } from './slack'
import { RouteStore } from './routeStore'

async function main() {
  const dbClient = new DatabaseClient(config.db)
  await dbClient.start()

  const slackProvider = slackProviderFactory(config.slack, dbClient)
  const server = new AuthServer({ port: config.server.port, slackProvider })
  await server.start()

  const routeStore = new RouteStore({ dbClient })
  await routeStore.start()

  const bot = await botFactory({
    backendEndpoint: config.backendEndpoint,
    slackConfig: config.slack,
    slackProvider,
    routeStore,
  })
  await bot.start()
}

main()