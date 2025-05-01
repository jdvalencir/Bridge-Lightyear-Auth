// app.js
import express from 'express'
import { rabbitMQProducer } from './rabbitmq/producer.js'

const app = express()
const port = 3000

app.use(express.json()) 

app.get('/v1/users/home', (req, res) => {
  res.send('Hello World!')
})

app.post('/v1/users/register', async (req, res) => {
  const user = req.body

  try {
    await rabbitMQProducer.sendToQueue('registration-queue', {
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      firstName: user.firstName,
      secondName: user.secondName,
      lastName: user.lastName,
      secondLastName: user.secondLastName,      
      email: user.email,
      confirmEmail: user.confirmEmail,
      phone: user.phone,
      country: user.country,
      department: user.department,
      city: user.city,
      address: user.address,
    })

    res.status(200).send('User registered and notification sent!')
  } catch (err) {
    console.error('Error sending message to queue:', err)
    res.status(500).send('Error processing registration')
  }
})

app.listen(port, async () => {
  await rabbitMQProducer.connect()
  console.log(`Example app listening on port ${port}`)
})
