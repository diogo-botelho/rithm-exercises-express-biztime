"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require("../db");

const router = express.Router();


/** GET /invoices
*  Return info on invoices: like {invoices: [{id, comp_code}, ...]}
*/
router.get("/", async function (req, res, next) {
    const results = await db.query(
      `SELECT id, comp_code
              FROM invoices
              ORDER BY comp_code, id`);
  
    const invoices = results.rows;
  
    return res.json({ invoices });
  });


/** GET /invoices/[id]
*      Returns obj on given invoice.
*      If invoice cannot be found, returns 404.
*      Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/
router.get("/:id",
  async function (req, res, next) {
    const id = req.params.id;

    const iResults = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code as company
            FROM invoices
            WHERE id = $1`, [id]);

    const invoice = iResults.rows[0];
    if (!invoice) throw new NotFoundError(`Not found: ${id}`);

    const cResults = await db.query(`
    SELECT code, name, description
    FROM companies
    WHERE code=$1`, [invoice.company]);

    const company = cResults.rows[0];

    invoice.company = company;

    return res.json({ invoice });
  });


/** POST /invoices
*      Adds an invoice.
*      Needs to be passed in JSON body of: {comp_code, amt}
*      Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function (req, res, next) {
    const { comp_code, amt } = req.body;
  
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
               VALUES ($1, $2)
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt],
    );
  
    const invoice = result.rows[0];
  
    return res.status(201).json({ invoice });
  });


/**
*  PUT /invoices/[id]
*      Updates an invoice.
*      If invoice cannot be found, returns a 404.
*      Needs to be passed in a JSON body of {amt}
*      Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put("/:id", async function (req, res, next) {
    const { amt } = req.body;
    const id = req.params.id;

    const result = await db.query(
      `UPDATE invoices
             SET amt=$1
             WHERE id = $2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, req.params.id],
    );
  
    const invoice = result.rows[0];
  
    if (!invoice) throw new NotFoundError(`Not found: ${id}`);
  
    return res.json({ invoice });
  })


/**
*  DELETE /invoices/[id]
*      Deletes an invoice.
*      If invoice cannot be found, returns a 404.
*      Returns: {status: "deleted"}
*/
router.delete("/:id", async function (req, res, next) {
    const id = req.params.id;
    
    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 
          RETURNING id`,
      [req.params.id]
    );
  
    const invoice = result.rows[0];
  
    if (!invoice) throw new NotFoundError(`Not found: ${id}`);
  
    return res.json({ status: "deleted" });
  });

module.exports = router;