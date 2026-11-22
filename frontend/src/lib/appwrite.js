import { Client, Account } from 'appwrite'

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('6afbcbdd0025f10fae27')

export const account = new Account(client)
export default client
