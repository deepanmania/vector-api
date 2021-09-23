var express = require("express");
var router = express.Router();
const { Client } = require("pg");
const { pg } = require("../lib");
const moment = require("moment");
global.pgCon = undefined;

router.get("/", function (req, res, next) {
  const con = pg.connect();
  const id = req.query.id;
  const query = `SELECT * from waterentry WHERE id=${id}`;
  con
    .query(query)
    .then((resp) => {
      resp.rows[0] = Object.assign(resp.rows[0], resp.rows[0].labdata);
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
   from waterentry`;
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
    district,
    hud,
    block,
    village,
    habitation,
    placeType,
    dateOfInspection,
  } = req.body.body;
  let query = `SELECT *
   from waterentry`;
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

router.get("/getDashBoardData", function (req, res, next) {
  const con = pg.connect();
  let query = "SELECT * from waterentry WHERE";
  query +=
    "(entry->>'dateOfInspection')::timestamp with time zone >= $1 AND (entry->>'dateOfInspection')::timestamp with time zone < $2";
  const responseObj = {};
  con
    .query(query, [
      moment().startOf("day").toDate(),
      moment().add(1, "day").startOf("day").toDate(),
    ])
    .then((resp) => {
      responseObj.today = resp.rows;
      con
        .query(query, [
          moment().startOf("month").toDate(),
          moment().endOf("month").endOf("day").toDate(),
        ])
        .then((resp) => {
          responseObj.thisMonth = resp.rows;
          return res.send(responseObj);
        })
        .catch((err) => {
          console.error(err);
          return res.send({});
        });
    })
    .catch((err) => {
      console.error(err);
      return res.send({});
    });
});

router.post("/", function (req, res, next) {
  const { op, id, lab = false } = req.query;
  const con = pg.connect();
  const { userId, body } = req.body;
  let query = "";
  if (!lab) {
    if (op === "update" || (op === "draft" && id)) {
      query = `UPDATE waterentry
      SET
      "userId" = ${userId},
      "entry" = $1
      WHERE id=${id}
      `;
      return con
        .query(query, [body])
        .then((resp) => {
          console.log(resp);
          return res.send();
        })
        .catch((err) => {
          console.error(err);
          return res.send();
        });
    } else {
      query = `INSERT INTO waterentry (
        "userId",
        "entry",
        "labentry"
      )
    VALUES (
      ${userId},
      $1,
      $2
        )`;
    }
  } else {
    query = `UPDATE waterentry
      SET 
      "userId" = ${userId},
    "labentry" = $1${op === "draft" ? ',"draft" = true' : ',"draft" = false'}
    WHERE id=${id}
    `;
  }
  console.log(query);
  con
    .query(query, op === "create" ? [body, {}] : [body])
    .then((resp) => {
      console.log(resp);
      return res.send({ ok: true });
    })
    .catch((err) => {
      console.error(err);
      return res.send({ ok: true });
    });
});

module.exports = router;
