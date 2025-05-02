// rabbitmq/producer.js
import amqp from 'amqplib'
import { getLogger } from '../logger/logger.js'

if (process.env.NODE_ENV !== 'development') {
  process.loadEnvFile()
}

const rmqUser = process.env.RMQ_USER || 'guest'
const rmqPass = process.env.RMQ_PASS || 'guest'
const rmqPort = process.env.RMQ_PORT || 5672
const rmqHost = process.env.RMQ_HOST || '/'

const logger = getLogger()

class RabbitMQProducer {
  constructor() {
    this.connection = null
    this.channel = null
  }

  async connect() {
    if (this.connection && this.channel) return // Ya está conectado

    try {
      const url = `amqp://${rmqUser}:${rmqPass}@${rmqHost}:${rmqPort}`
      this.connection = await amqp.connect(url)
      this.channel = await this.connection.createChannel()
      logger.info('RabbitMQ connected and channel created.')
    } catch (err) {
      logger.error('Failed to connect to RabbitMQ', err)
      throw err
    }
  }

  async sendToQueue(queue, payload) {
    if (!this.channel) await this.connect()

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
    await this.channel.assertQueue(queue, { durable: true })
    this.channel.sendToQueue(queue, Buffer.from(message))
    logger.info(`Message sent to ${queue}: ${message}`)
  }

  async close() {
    if (this.channel) await this.channel.close()
    if (this.connection) await this.connection.close()
  }
}

export const rabbitMQProducer = new RabbitMQProducer()