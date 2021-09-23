const express = require("express");
const router = express.Router();
const pg = require("../lib/pg");
const moment = require("moment");
global.pgCon = undefined;

router.get("/", function (req, res, next) {
  const con = pg.connect();
  const id = req.query.id;
  const recordType = req.query.recordType;
  const userId = req.query.userId;
  const query = `SELECT * from ${
    recordType === "survey" ? "vectorsurvey" : "vectoraction"
  } WHERE id=${id} AND "userId"=${userId}`;
  con
    .query(query)
    .then((resp) => {
      return res.send(resp.rows[0]);
    })
    .catch((err) => {
      console.error(err);
      return res.send({});
    });
});

/* GET entries listing. */

router.get("/lineList", function (req, res, next) {
  const con = pg.connect();
  const query = `SELECT *
   from vectorsurvey`;
  con
    .query(query)
    .then((resp) => {
      return res.send(resp.rows);
    })
    .catch((err) => {
      console.error(err);
      return res.send([]);
    });
});

router.post("/lineList", (req, res, next) => {
  const con = pg.connect();
  const {
    type,
    body: {
      district,
      hud,
      block,
      village,
      habitation,
      placeType,
      dateOfInspection,
    },
  } = req.body.body;
  const tableName = type === "survey" ? "vectorsurvey" : "vectoraction";
  let query = `SELECT *
   from ${tableName}`;
  let params = "";
  if (district && district !== "0") {
    params += `(entry->>'district')='${district}' AND`;
  }
  if (hud && hud !== "0") {
    params += `(entry->>'hud')='${hud}' AND `;
  }
  if (block && block !== "0") {
    params += `(entry->>'block')='${block}' AND `;
  }
  if (village && village !== "0") {
    params += `(entry->>'village')"='${village}' AND `;
  }
  if (habitation && habitation !== "0") {
    params += `(entry->>'habitation')='${habitation}' AND`;
  }
  if (placeType && placeType !== "0") {
    params += `(entry->>'placeType')='${placeType}' AND `;
  }
  if (dateOfInspection && dateOfInspection !== "0") {
    params +=
      "(entry->>'dateOfInspection')::timestamp with time zone >= $1 AND (entry->>'dateOfInspection')::timestamp with time zone < $2";
  }
  if (params) {
    query = `${query} WHERE ${params}`.replace(/AND$/gi, "");
  }
  console.log(query);
  console.log([
    moment(dateOfInspection, moment.ISO_8601).startOf("day").toDate(),
    moment(dateOfInspection, moment.ISO_8601)
      .add(1, "day")
      .startOf("day")
      .toDate(),
  ]);
  con
    .query(
      query,
      dateOfInspection
        ? [
            moment(dateOfInspection, moment.ISO_8601).startOf("day").toDate(),
            moment(dateOfInspection, moment.ISO_8601)
              .add(1, "day")
              .startOf("day")
              .toDate(),
          ]
        : []
    )
    .then((resp) => {
      console.log(resp.rows);
      return res.send(resp.rows);
    })
    .catch((err) => {
      console.error(err);
      return res.send([]);
    });
});

router.get("/getDashBoardData", async function (req, res, next) {
  const con = pg.connect();
  let query = "SELECT * from vectorsurvey WHERE";
  query +=
    "(entry->>'dateOfInspection')::timestamp with time zone >= $1 AND (entry->>'dateOfInspection')::timestamp with time zone < $2";
  const responseObj = {};
  let resp = await con.query(query, [
    moment().startOf("day").toDate(),
    moment().add(1, "day").startOf("day").toDate(),
  ]);
  responseObj.todaySurvey = resp.rows;
  resp = await con.query(query, [
    moment().startOf("month").toDate(),
    moment().endOf("month").endOf("day").toDate(),
  ]);
  responseObj.thisMonthSurvey = resp.rows;
  query = "SELECT * from vectoraction WHERE";
  query +=
    "(entry->>'dateOfInspection')::timestamp with time zone >= $1 AND (entry->>'dateOfInspection')::timestamp with time zone < $2";
  resp = await con.query(query, [
    moment().startOf("day").toDate(),
    moment().add(1, "day").startOf("day").toDate(),
  ]);
  responseObj.todayAction = resp.rows;
  resp = await con.query(query, [
    moment().startOf("month").toDate(),
    moment().endOf("month").endOf("day").toDate(),
  ]);
  responseObj.thisMonthAction = resp.rows;
  return res.send(responseObj);
});

router.post("/", function (req, res, next) {
  const { op, id } = req.query;
  const { formType, userId, body } = req.body;
  const con = pg.connect();
  let query;
  if (formType === "survey") {
    if (op === "update") {
      query = `UPDATE vectorsurvey
      SET
      "userId" = ${userId},
      "entry" = $1
      WHERE id=${id}
      `;
    } else {
      query = `INSERT INTO vectorsurvey (
          "userId",
          "entry"
        )
      VALUES (
        ${userId},
        $1
          )`;
    }
  } else {
    if (op === "update") {
      query = `UPDATE vectoraction
      SET 
      "userId" = ${userId},
    "entry" = $1
    WHERE id=${id}
    `;
    } else {
      query = `INSERT INTO vectoraction (
        "userId",
        "entry"
        )
      VALUES (
        ${userId},
        $1)`;
    }
  }
  console.log(query);
  con
    .query(query, [body])
    .then((resp) => {
      console.log(resp);
      return res.send({ ok: true });
    })
    .catch((err) => {
      console.error(err);
      return res.send({ ok: false });
    });
});
module.exports = router;
