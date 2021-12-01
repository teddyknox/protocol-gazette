import { SlackConfig } from './config'
import { InstallProvider } from '@slack/oauth'
import { DatabaseClient } from './dbClient'

export function slackProviderFactory(slackConfig: SlackConfig, dbClient: DatabaseClient) {
  return new InstallProvider({
    clientId: slackConfig.clientId,
    clientSecret: slackConfig.clientSecret,
    stateSecret: slackConfig.stateSecret,
    installUrlOptions: {
      scopes: ['chat:write', 'groups:read', 'channels:read'],
      redirectUri: slackConfig.redirectUri,
    },
    directInstall: true,
    installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall) {
          // return myDB.set(installation.enterprise.id, installation);
          throw new Error('Enterprise install not supported')
        } else {
          return dbClient.addInstallation(installation);
        }
        throw new Error('Failed saving installation data to installationStore');
      },
      fetchInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
          // return await myDB.get(installQuery.enterpriseId);
          throw new Error('Enterprise install not supported')
        }
        if (installQuery.teamId !== undefined) {
          const installation = await dbClient.getInstallation(installQuery.teamId);
          if (installation === undefined) {
            throw new Error('Installation not found')
          }
          return installation
        }
        throw new Error('Failed fetching installation');
      },
      deleteInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
          // return await myDB.delete(installQuery.enterpriseId);
          throw new Error('Enterprise install not supported')
        }
        if (installQuery.teamId !== undefined) {
          return await dbClient.removeInstallation(installQuery.teamId);
        }
        throw new Error('Failed to delete installation');
      },
    },
  })
}