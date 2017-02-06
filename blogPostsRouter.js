const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const {BlogPosts} = require('./models');

router.get('/', (req, res) => {
	const filters = {}
	const queryableFields = ['title']

	queryableFields.forEach(field => {
		if(req.query[field]) {
			filters[field] = req.query[field];
			console.log(filters)	
		}
	})
	BlogPosts
		.find(filters)
		.exec()
		.then(posts => {
			res.json({
				posts: posts.map(
					(blogposts) => blogposts.apiResponse())
			});
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal Server Error'});
		})
})

router.get('/:id', (req, res) => {
	BlogPosts
		.findById(req.params.id)
		.exec()
		.then(blogposts => res.json(blogposts.apiResponse()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal Server Error'});
		})
})

router.post('/', (req, res) => {
	console.log(req.body.author.firstName);
	const requiredFields = ['title', 'content', 'firstName', 'lastName'];
	for(let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body || req.body.author)) {
				const message = `Cannot complete request, missing required field: ${field}`;
				console.error(message);
				return res.status(400).send(message);
		}
	};
	
	const newItem = {
		title: req.body.title,
		content: req.body.content,
		author: {
			firstName: req.body.author.firstName,
			lastName: req.body.author.lastName
		}
	};
	BlogPosts
		.create(newItem)
		.then(blogposts => res.status(201).json(blogposts.apiResponse()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal Server Error'});
		})
	
})

router.put('/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = `Id provided in the parameters: ${req.params.id} does not match id provided in the body: ${req.body.id}`;
		console.error(message);
		res.status(400).json({ message: message });
	}

	const toUpdate = {};
	const updateableFields = ['title', 'content', 'firstName', 'lastName']

	for(let i = 0; i < updateableFields.length; i++) {
		let field = updateableFields[i];
		for(field in req.body){
			toUpdate[field] = req.body[field]; 
		}
		for(field in req.body.author){
			toUpdate.author[field] = req.body.author[field];
		}
	}

	BlogPosts
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.exec()
		.then(blogposts => res.status(201).json(blogposts.apiResponse()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal Server Error'});
		})
})

router.delete('/:id', (req, res) => {
	BlogPosts
		.findByIdAndRemove(req.params.id)
		.exec()
		.then(blogposts => res.status(204).json({message: `Item with Id: ${req.params.id} has been deleted.`}))
})

module.exports = router;