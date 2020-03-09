const {
  Client
} = require('pg')
global.pgCon = undefined

const connect = () => {
  if (global.pgCon) {
    return global.pgCon
  }
  const client = new Client({
    user: 'avnuesisnisuao',
    host: 'ec2-3-230-106-126.compute-1.amazonaws.com',
    database: 'd61c16ioaiipiv',
    password: '029e86ebef715e2c14cd085b75162790d9dcd927175bc8da2f7f5813cdd49f95',
    port: 5432
  })
  client.connect()
  if (!global.pgCon) {
    global.pgCon = client
  }
  return client
}

module.exports = {
  connect
}
