"use strict";
const express = require("express");
// const pg = require("pg");
const { NotFoundError } = require("../expressError");
const db = require("../db");

const router = express.Router();

// GET /companies
// Returns list of companies, like {companies: [{code, name}, ...]}

router.get("/", async function (req,res,next) {
    const results = await db.query(
        `SELECT code, name
            FROM companies`);
    const companies = results.rows;
    return res.json({ companies });
});


// GET /companies/[code]
// Return obj of company: {company: {code, name, description}}
router.get("/:code", 
    //TODO: Add middleware function to check if company exists?
    async function (req,res,next) {
    const code = req.params.code;
    
    const results = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);
    const company = results.rows[0];
    return res.json({ company });
});
// If the company given cannot be found, this should return a 404 status response.
/** Reference: 
 * app.get("/users/:username", function(req, res, next){
  const user = USERS.find(u => (
    u.username === req.params.username
  ));
  if (!user) throw new NotFoundError();
  return res.json({ user });
})
 */



// POST /companies
// Adds a company.
// Needs to be given JSON like: {code, name, description}
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


// Returns obj of new company: {company: {code, name, description}}

// PUT /companies/[code]
// Edit existing company.

// Should return 404 if company cannot be found.

// Needs to be given JSON like: {name, description}

// Returns update company object: {company: {code, name, description}}

// DELETE /companies/[code]
// Deletes company.

// Should return 404 if company cannot be found.

// Returns {status: "deleted"}

module.exports = router; 