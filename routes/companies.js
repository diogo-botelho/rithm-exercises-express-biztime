"use strict";
const express = require("express");
const { NotFoundError } = require("../expressError");

const db = require("../db");

const router = express.Router();

/** GET /companies
* Returns list of companies, like {companies: [{code, name}, ...]}
*/
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
            FROM companies
            ORDER BY code`);

  const companies = results.rows;

  return res.json({ companies });
});


/** GET /companies/[code]
* Returns obj of company: {company: {code, name, description}}
*/
router.get("/:code",
  async function (req, res, next) {
    const code = req.params.code;

    const cResults = await db.query(
      `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);

    const company = cResults.rows[0];

    if (!company) throw new NotFoundError(`Not found: ${code}`);

    const iResults = await db.query(
      `SELECT id
            FROM invoices
            WHERE comp_code = $1
            ORDER BY id`, [code]);

    const invoices = iResults.rows.map(invoice => invoice.id);

    company.invoices = invoices;

    return res.json({ company });
  });

  /**
*  Also, one route from the previous part should be updated:
*  GET /companies/[code]
*      Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
*      If the company given cannot be found, this should return a 404 status response.
*/


/** POST /companies
* Adds a company.
* Needs to be given JSON like: {code, name, description}
* Returns object of company
*/
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
    [code, name, description],
  );

  const company = result.rows[0];

  return res.status(201).json({ company });
});

/** PUT /companies/[code]
* Edit existing company.
* Should return 404 if company cannot be found.
* Needs to be given JSON like: {name, description}
* Returns update company object: {company: {code, name, description}}
*/
router.put("/:code", async function (req, res, next) {
  const { name, description } = req.body;
  // console.log(req.body);
  // console.log(req.params);

  const result = await db.query(
    `UPDATE companies
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, req.params.code],
  );

  const company = result.rows[0];

  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ company });
})

/** DELETE /companies/[code]
* Deletes company.
* Should return 404 if company cannot be found.
* Returns {status: "deleted"}
*/
router.delete("/:code", async function (req, res, next) {
  const result = await db.query(
    `DELETE FROM companies WHERE code = $1 
        RETURNING code`,
    [req.params.code]
  );

  const company = result.rows[0];

  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ status: "deleted" });
});

module.exports = router;