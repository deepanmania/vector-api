var express = require('express');
var router = express.Router();
const {
  Client
} = require("pg")
const moment = require("moment")
global.pgCon = undefined


const connect = () => {
  if (global.pgCon) {
    return global.pgCon
  }
  const client = new Client({
    user: 'vector',
    host: 'localhost',
    database: 'vector',
    password: 'vector',
    port: 5432,
  })
  client.connect()
  if (!global.pgCon) {
    global.pgCon = client
  }
  return client
}

router.get("/", function (req, res, next) {
  const con = connect()
  const id = req.query.id
  const query = `SELECT * from vectorentry WHERE id=${id}`
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

router.get("/lineList", function (req, res, next) {
  const con = connect()
  const query = `SELECT 
  "id",
  "dateOfInspection",
  "numberOfHouses",
  "positiveHouses",
  "houseIndex",
  "containers",
  "containerIndex",
  "breteauIndex"
   from vectorentry`
  con.query(query)
    .then(resp => {
      return res.send(resp.rows)
    })
    .catch(err => {
      console.error(err)
      return res.send([])
    })
})

router.post("/lineList", (req, res, next) => {
  const con = connect()
  const {
    district,
      hud,
      block,
      village,
      habitation,
      placeType,
      dateOfInspection
  } = req.body
  let query = `SELECT 
  "id",
  "dateOfInspection",
  "numberOfHouses",
  "positiveHouses",
  "houseIndex",
  "containers",
  "containerIndex",
  "breteauIndex"
   from vectorentry WHERE `
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
   console.log([moment(dateOfInspection, moment.ISO_8601).startOf("day").toDate(), moment(dateOfInspection, moment.ISO_8601).add(1, 
    'day').startOf('day').toDate()])
   con.query(query, [moment(dateOfInspection, moment.ISO_8601).startOf("day").toDate(), moment(dateOfInspection, moment.ISO_8601).add(1, 
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

router.get("/getDashBoardData", function (req, res, next) {
  const con = connect()
  let query = `SELECT * from vectorentry WHERE`
  query += `"dateOfInspection" >= $1 AND "dateOfInspection" < $2`
  const responseObj = {}
  con.query(query, [moment().startOf("day").toDate(), moment().add(1, 'day').startOf('day').toDate()])
    .then(resp => {
      responseObj.today = resp.rows
      con.query(query, [moment().startOf("month").toDate(), moment().endOf("month").endOf('day').toDate()])
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

router.post('/', function(req, res, next) {
  const {
    op,
    id
  } = req.query;
  const {
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
    infiltrationgalleryName,
    infiltrationwellName,
    openwellName,
    borewellName,
    collectionsumpName,
    pumpingstationName,
    overheadtankName,
    roplantName,
    tapfirstName,
    tapmiddleName,
    taplastName,
    dateOfWork,
    workersEngaged,
    otherWorkers,
    housesEngaged,
    housesCleared,
    containersDestroyed,
    dateOfFogging
  } = req.body
  const con = connect()
  let query;
  if (op === "update") {
    query = `UPDATE vectorentry
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
    "numberOfHouses" = ${numberOfHouses},
    "infiltrationgalleryName" = '${infiltrationgalleryName}',
    "infiltrationwellName" = '${infiltrationwellName}',
    "openwellName" = '${openwellName}',
    "borewellName" = '${borewellName}',
    "collectionsumpName" = '${collectionsumpName}',
    "pumpingstationName" = '${pumpingstationName}',
    "overheadtankName" = '${overheadtankName}',
    "roplantName" = '${roplantName}',
    "tapfirstName" = '${tapfirstName}',
    "tapmiddleName" = '${tapmiddleName}',
    "taplastName" = '${taplastName}',
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
    query = `INSERT INTO vectorentry (
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
        "numberOfHouses",
        "infiltrationgalleryName",
        "infiltrationwellName",
        "openwellName",
        "borewellName",
        "collectionsumpName",
        "pumpingstationName",
        "overheadtankName",
        "roplantName",
        "tapfirstName",
        "tapmiddleName",
        "taplastName",
        "dateOfWork",
        "workersEngaged",
        "otherWorkers",
        "housesEngaged",
        "housesCleared",
        "containersDestroyed",
        "dateOfFogging"
      )
    VALUES (
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
        ${numberOfHouses},
        '${infiltrationgalleryName}',
        '${infiltrationwellName}',
        '${openwellName}',
        '${borewellName}',
        '${collectionsumpName}',
        '${pumpingstationName}',
        '${overheadtankName}',
        '${roplantName}',
        '${tapfirstName}',
        '${tapmiddleName}',
        '${taplastName}',
        $2,
        ${workersEngaged},
        ${otherWorkers},
        ${housesEngaged},
        ${housesCleared},
        ${containersDestroyed},
        $3)`
  }
    console.log(query)
    con.query(query, [dateOfInspection, dateOfWork, dateOfFogging])
      .then(resp => {
        console.log(resp)
        return res.send()
      })
      .catch(err => {
        console.error(err)
        return res.send()
      })
});



module.exports = router;
