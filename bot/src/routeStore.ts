import _ from "lodash";
import { DatabaseClient } from "./dbClient";
import { Route } from "./types";

export interface RouteStoreParams {
  dbClient: DatabaseClient
}

export class RouteStore {
  private _dbClient: DatabaseClient
  private _routes: Map<string, Route[]>

  constructor({ dbClient }: RouteStoreParams) {
    this._dbClient = dbClient
  }

  async start() {
    const routes = await this._dbClient.getAllRoutes()
    const grouped = _.groupBy(routes, r => r.topic_id)
    this._routes = new Map(Object.entries(grouped))
  }

  async addRoute(r: Route) {
    await this._dbClient.addRoute(r)
    const routes = this._routes.get(r.topic_id) || []
    const amendedRoutes = routes.concat([r])
    this._routes.set(r.topic_id, amendedRoutes)
  }

  getRoutes(topicId: string) {
    return this._routes.get(topicId) || []
  }

  async removeRoute(r: Route) {
    await this._dbClient.removeRoute(r)
    const routes = this._routes.get(r.topic_id) || []
    const amendedRoutes = routes.filter(e => e.topic_id !== r.topic_id && e.channel_id !== r.channel_id)
    this._routes.set(r.topic_id, amendedRoutes)
  }
}