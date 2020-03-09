var express = require('express')
var router = express.Router()
const {
  pg
} = require('../lib')
/* GET home page. */
router.post('/', function (req, res, next) {
  const {
    userName,
    password
  } = req.body
  const con = pg.connect()
  const query = `SELECT * from users WHERE "username"='${userName}'`
  con.query(query)
    .then(resp => {
      const credObj = resp.rows[0]
      if (!credObj || credObj.password !== password) {
        return res.send({
          ok: false,
          errorMsg: 'Username or password combination is incorrect'
        })
      }
      const session = +new Date()
      global.sessions[session] = resp
      res.cookie('session', session)
      delete credObj.password
      return res.send(Object.assign({
        ok: true
      }, credObj))
    })
})

module.exports = router
