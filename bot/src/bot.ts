import { map, Observable } from "rxjs"
import { webSocket } from "rxjs/webSocket"
import { log } from "./logger"
import _ from "lodash"
import { Notification, NotificationImage, Route } from "./types"
import { convert } from "./convert"
import WebSocket from 'ws'
import { InstallProvider } from '@slack/oauth'
import { WebClient } from "@slack/web-api"
import { SocketModeClient } from '@slack/socket-mode'
import { SlackConfig } from "./config"
import { RouteStore } from "./routeStore"

(global as any).WebSocket = WebSocket


interface BotConfig {
  slackProvider: InstallProvider
  slackApi: WebClient
  slackSocket: SocketModeClient
  backendEndpoint: string
  routeStore: RouteStore
}

export class Bot {
  private _slackProvider: InstallProvider
  private _slackApi: WebClient
  private _slackSocket: SocketModeClient
  private _backendEndpoint: string
  private _stream: Observable<any>
  private _routeStore: RouteStore

  constructor({ backendEndpoint, slackApi, slackProvider, slackSocket, routeStore }: BotConfig) {
    this._slackApi = slackApi
    this._slackProvider = slackProvider
    this._slackSocket = slackSocket
    this._backendEndpoint = backendEndpoint
    this._routeStore = routeStore
  }

  async start() {
    this._stream = webSocket({ url: this._backendEndpoint })
    this._stream
      .pipe(map(convert))
      .subscribe(message => this._onMessage(message))
    this._slackSocket.on('member_joined_channel', async (event) => this._onChannelJoined(event))
    this._slackSocket.on('slash_commands', async (event) => this._onSlashCommand(event));
    await this._slackSocket.start();
  }

  private async _onSlashCommand({ body, ack }: any) {
    switch (body.command) {
      case "/pg-list-topics":
        return this._listTopics(body, ack)
      case "/pg-subscribe":
        return this._subscribe(body, ack)
      case "/pg-unsubscribe":
        return this._unsubscribe(body, ack)
      case "/pg-list-subscriptions":
        return this._listSubscriptions(body, ack)
      default:
        throw new Error('Unrecognized command')
    }
  }

  private async _onChannelJoined({ body, ack }: any) {
    // TODO
    await ack()
  }

  private async _listTopics(body: any, ack: (params?: any) => Promise<void>) {
    // TODO
    await ack()
  }

  private async _listSubscriptions(body: any, ack: (params?: any) => Promise<void>) {
    // TODO
    await ack()
  }

  private async _unsubscribe(body: any, ack: (params?: any) => Promise<void>) {
    const topics = body.text.split(' ').filter((x: string) => x)
    if (topics.length > 1) {
      await ack({ text: "Too many arguments. Try `/pg-unsubscribe cosmos`, for example."})
      return
    }
    if (topics.length > 1) {
      await ack({ text: "You should provide a topic argument. Try `/pg-unsubscribe cosmos`. To see what topics this channel is subscribed to, try `/pg-list-subscriptions`. Or you can use the command `/pg-unsubscribe all` to unsubscribe this channel from all topics."})
      return
    }
    await this._routeStore.removeRoute({
      team_id: body.team_id,
      channel_id: body.channel_id,
      topic_id: topics[0]
    })
    await ack({ text: `Unsubscribed from topic ${topics[0]}!` })
  }

  private async _subscribe(body: any, ack: (params?: any) => Promise<void>) {
    const topics = body.text.split(' ').filter((x: string) => x)
    if (topics.length > 1) {
      await ack({ text: "Too many arguments. Try `/pg-subscribe cosmos`, for example."})
      return
    }
    if (topics.length > 1) {
      await ack({ text: "You should provide a topic argument. Try `/pg-subscribe cosmos`. To see what topics are available for subscription, try `/pg-list-topics`."})
      return
    }
    await this._routeStore.addRoute({
      team_id: body.team_id,
      channel_id: body.channel_id,
      topic_id: topics[0]
    })
    await ack({ text: `Subscribed to topic ${topics[0]}!` })
  }

  private async _onMessage(n: Notification): Promise<void> {
    log.info(`New notification on topic ${n.topic}: ${n.title}`)
    try {
      const routes = this._routeStore.getRoutes(n.topic)
      await Promise.all(routes.map(async r => {
        const authorization = await this._slackProvider.authorize({
          teamId: r.team_id,
          enterpriseId: undefined,
          isEnterpriseInstall: false
        })
        await this._slackApi.chat.postMessage({
          token: authorization.botToken,
          channel: r.channel_id,
          text: n.title,
          blocks: [
            Bot.buildBlock(n)
          ],
          unfurl_links: n.unfurl_links !== undefined ? n.unfurl_links : true
        })
        log.info(`Successfully notified team ${r.team_id} on channel ${r.channel_id} of topic ${r.topic_id} notification`)
      }))
    } catch (err) {
      log.error('Error notifying slack: ', err)
    }
  }

  private static buildBlock({ body, image }: { body: string, image?: NotificationImage }) {
    const result: any = {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": body,
        "verbatim": true
      },
    }
    if (image) {
      result.accessory = {
        type: 'image',
        image_url: image.image_url,
        alt_text: image.alt_text
      }
    }
    return result
  }
}

export interface BotFactoryConfig {
  backendEndpoint: string
  slackConfig: SlackConfig
  slackProvider: InstallProvider
  routeStore: RouteStore
}

export async function botFactory({ backendEndpoint, slackConfig, slackProvider, routeStore }: BotFactoryConfig) {
  const slackSocket = new SocketModeClient({ appToken: slackConfig.appToken })
  const slackApi = new WebClient()
  return new Bot({ backendEndpoint, slackApi, slackProvider, slackSocket, routeStore })
}