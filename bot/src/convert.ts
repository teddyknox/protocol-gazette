import { capitalize } from "lodash";
import { DiscordMessage, DiscourseMessage, Message, Notification, TestMessage } from "./types";

const URL_REGEX = /https?:\/\/[^\s]*/g;


export function convert(m: Message): Notification {
  switch (m.data.type) {
    case "discord":
      return toDiscordNotification(m)
    case "discourse":
      return toDiscourseNotification(m)
    case "test":
      return toTestNotification(m)
    default:
      throw new Error(`Unrecognized message type ${m.data.type}`)
  }
}

function toDiscordNotification(m: Message): Notification {
  const discordMessage = m.data.value as DiscordMessage
  return {
    topic: m.topic,
    title: `*${capitalize(discordMessage.stream)}* discord message on channel id ${discordMessage.channelId}: ${slackEscape(discordMessage.content)}>`,
    body: `*${capitalize(discordMessage.stream)}* <${discordMessage.url}|*discord message*> on channel id *${discordMessage.channelId}*:\n\n${slackEscape(discordMessage.content)}`,
    unfurl_links: false
  } as Notification;
}

function toDiscourseNotification(m: Message): Notification {
  const discourseMessage = m.data.value as DiscourseMessage
  return {
    topic: m.topic,
    title: `*${capitalize(discourseMessage.post.stream)}* *discourse post* *${discourseMessage.type}* in topic *${discourseMessage.topic.title}*`,
    body: `*${capitalize(discourseMessage.post.stream)}* <${discourseMessage.post.url}|*discourse post*> *${discourseMessage.type}* in topic *${discourseMessage.topic.title}*`,
    image: {
      image_url: discourseMessage.post.avatar_template.replace('{size}', '90'),
      alt_text: discourseMessage.post.username,
    },
  }
}

function toTestNotification(m: Message): Notification {
  const testMessage = m.data.value as TestMessage
  return {
    topic: m.topic,
    title: testMessage.message,
    body: testMessage.message,
  }
}
  
function slackEscape(message: string) {
  let result = message
  result = result.replace('&', '&amp')
  result = result.replace('<', '&lt')
  result = result.replace('>', '&gt')
  result = result.replace(URL_REGEX, '<$&|$&>')
  return result
}