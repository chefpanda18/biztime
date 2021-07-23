const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM invoices`);
		return res.json({ invoices: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query('SELECT * FROM invoices WHERE id = $1', [ id ]);
		if (results.rows.length === 0) {
			throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
		}
		return res.send({ invoices: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		const results = await db.query(
			'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
			[ comp_code, amt ]
		);
		return res.status(201).json({ invoices: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.put('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt, paid, paid_date } = req.body;
		const results = await db.query(
			`UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ amt, paid, paid_date, id ]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
		}
		return res.send({ invoices: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.delete('/:id', async function(req, res, next) {
	try {
		let id = req.params.id;

		const result = await db.query(
			`DELETE FROM invoices
             WHERE id=$1
             RETURNING id`,
			[ id ]
		);

		if (result.rows.length == 0) {
			throw new ExpressError(`No such invoice: ${id}`, 404);
		} else {
			return res.json({ status: 'deleted' });
		}
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
