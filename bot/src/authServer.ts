import { InstallProvider } from '@slack/oauth'
import express, { Express } from 'express'
import fs from 'fs'
import https, { Server as HttpsServer } from 'https'


interface AuthServerConfig {
  port: number
  slackProvider: InstallProvider
}

export class AuthServer {
  private _port: number
  private _httpsServer: HttpsServer
  private _slackProvider: InstallProvider

  constructor({ port, slackProvider }: AuthServerConfig) {
    this._port = port
    this._slackProvider = slackProvider

    const privateKey  = fs.readFileSync('localhost-key.pem', 'utf8')
    const certificate = fs.readFileSync('localhost.pem', 'utf8')
    const credentials = {key: privateKey, cert: certificate}
    const app = express()
    this._httpsServer = https.createServer(credentials, app)
    app.get('/slack/oauth_redirect', (req, res) => this._slackProvider.handleCallback(req, res))
    app.get('/slack/install', (req, res) => this._slackProvider.handleInstallPath(req, res))
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this._httpsServer.listen(this._port, () => {
        console.log(`[server]: Server is running at https://localhost:${3443}`);
        resolve()
      })
    })
  }
}