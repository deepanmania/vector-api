const express = require('express')
const router = express.Router()
const pg = require('../lib/pg')
const moment = require('moment')
global.pgCon = undefined

router.get('/', function (req, res, next) {
  const con = pg.connect()
  const id = req.query.id
  const recordType = req.query.recordType
  const userId = req.query.userId
  const query = `SELECT * from ${(recordType === 'survey') ? 'vectorsurvey' : 'vectoraction'} WHERE id=${id} AND "userId"=${userId}`
  con.query(query)
    .then(resp => {
      return res.send(resp.rows[0])
    })
    .catch(err => {
      console.error(err)
      return res.send({})
    })
})

/* GET entries listing. */

router.get('/lineList', function (req, res, next) {
  const con = pg.connect()
  const query = `SELECT *
   from vectorsurvey`
  con.query(query)
    .then(resp => {
      return res.send(resp.rows)
    })
    .catch(err => {
      console.error(err)
      return res.send([])
    })
})

router.post('/lineList', (req, res, next) => {
  const con = pg.connect()
  const {
    type,
    body: {
      district,
      hud,
      block,
      village,
      habitation,
      placeType,
      dateOfInspection
    }
  } = req.body
  const tableName = type === 'survey' ? 'vectorsurvey' : 'vectoraction'
  let query = `SELECT *
   from ${tableName} WHERE `
  if (district) {
    query += `"district"=${district} AND`
  }
  if (hud) {
    query += `"hud"=${hud} AND `
  }
  if (block) {
    query += `"block"=${block} AND `
  }
  if (village) {
    query += `"village"=${village} AND `
  }
  if (habitation) {
    query += `"habitation"=${habitation} AND`
  }
  if (placeType) {
    query += `"placeType"='${placeType}' AND `
  }
  if (dateOfInspection) {
    query += '"dateOfInspection" >= $1 AND "dateOfInspection" < $2'
  }
  console.log(query)
  console.log([moment(dateOfInspection, moment.ISO_8601).startOf('day').toDate(), moment(dateOfInspection, moment.ISO_8601).add(1,
    'day').startOf('day').toDate()])
  con.query(query, [moment(dateOfInspection, moment.ISO_8601).startOf('day').toDate(), moment(dateOfInspection, moment.ISO_8601).add(1,
    'day').startOf('day').toDate()])
    .then(resp => {
      console.log(resp.rows)
      return res.send(resp.rows)
    })
    .catch(err => {
      console.error(err)
      return res.send([])
    })
})

router.get('/getDashBoardData', function (req, res, next) {
  const con = pg.connect()
  let query = 'SELECT * from vectorsurvey WHERE'
  query += '"dateOfInspection" >= $1 AND "dateOfInspection" < $2'
  const responseObj = {}
  con.query(query, [moment().startOf('day').toDate(), moment().add(1, 'day').startOf('day').toDate()])
    .then(resp => {
      responseObj.today = resp.rows
      con.query(query, [moment().startOf('month').toDate(), moment().endOf('month').endOf('day').toDate()])
        .then(resp => {
          responseObj.thisMonth = resp.rows
          return res.send(responseObj)
        })
        .catch(err => {
          console.error(err)
          return res.send({})
        })
    }).catch(err => {
      console.error(err)
      return res.send({})
    })
})

router.post('/', function (req, res, next) {
  const {
    op,
    id
  } = req.query
  const {
    formType,
    userId,
    body: {
      district,
      hud,
      block,
      village,
      habitation,
      placeType,
      dateOfInspection,
      defaultImage,
      positiveHouses,
      houseIndex,
      containers,
      containerIndex,
      breteauIndex,
      numberOfHouses,
      dateOfWork,
      workersEngaged,
      otherWorkers,
      housesEngaged,
      housesCleared,
      containersDestroyed,
      dateOfFogging
    }
  } = req.body
  const con = pg.connect()
  let query
  if (formType === 'survey') {
    if (op === 'update') {
      query = `UPDATE vectorsurvey
      SET
      "district" = ${district},
      "hud" = ${hud},
      "block" = ${block},
      "village" = ${village},
      "habitation" = ${habitation},
      "placeType" = '${placeType}',
      "dateOfInspection" = $1,
      "defaultImage" = '${defaultImage}',
      "positiveHouses" = ${positiveHouses},
      "houseIndex" = ${houseIndex},
      "containers" = ${containers},
      "containerIndex" = ${containerIndex},
      "breteauIndex" = ${breteauIndex},
      "numberOfHouses" = ${numberOfHouses}
      WHERE id=${id}
      `
    } else {
      query = `INSERT INTO vectorsurvey (
        "userId",
        "district",
          "hud",
          "block",
          "village",
          "habitation",
          "placeType",
          "dateOfInspection",
          "defaultImage",
          "positiveHouses",
          "houseIndex",
          "containers",
          "containerIndex",
          "breteauIndex",
          "numberOfHouses"
        )
      VALUES (
        ${userId},
        ${district},
          ${hud},
          ${block},
          ${village},
          ${habitation},
          '${placeType}',
          $1,
          '${defaultImage}',
          ${positiveHouses},
          ${houseIndex},
          ${containers},
          ${containerIndex},
          ${breteauIndex},
          ${numberOfHouses})`
    }
  } else {
    if (op === 'update') {
      query = `UPDATE vectoraction
      SET 
      "district" = ${district},
    "hud" = ${hud},
    "block" = ${block},
    "village" = ${village},
    "habitation" = ${habitation},
    "placeType" = '${placeType}',
    "dateOfInspection" = $1,
    "defaultImage" = '${defaultImage}',
    "dateOfWork" = $2,
    "workersEngaged" = ${workersEngaged},
    "otherWorkers" = ${otherWorkers},
    "housesEngaged" = ${housesEngaged},
    "housesCleared" = ${housesCleared},
    "containersDestroyed" = ${containersDestroyed},
    "dateOfFogging" = $3
    WHERE id=${id}
    `
    } else {
      query = `INSERT INTO vectoraction (
        "userId",
        "district",
          "hud",
          "block",
          "village",
          "habitation",
          "placeType",
          "dateOfInspection",
          "defaultImage",
          "dateOfWork",
          "workersEngaged",
          "otherWorkers",
          "housesEngaged",
          "housesCleared",
          "containersDestroyed",
          "dateOfFogging"
        )
      VALUES (
        ${userId},
        ${district},
          ${hud},
          ${block},
          ${village},
          ${habitation},
          '${placeType}',
          $1,
          '${defaultImage}',
          $2,
          ${workersEngaged},
          ${otherWorkers},
          ${housesEngaged},
          ${housesCleared},
          ${containersDestroyed},
          $3)`
    }
  }
  console.log(query)
  con.query(query, (formType === 'survey') ? [dateOfInspection] : [dateOfInspection, dateOfWork, dateOfFogging])
    .then(resp => {
      console.log(resp)
      return res.send({ ok: true })
    })
    .catch(err => {
      console.error(err)
      return res.send({ ok: false })
    })
})
module.exports = router
