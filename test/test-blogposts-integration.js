const mongoose = require('mongoose')
const faker = require('faker')
const chai = require('chai')
const chaiHttp = require('chai-http')

const should = chai.should()
const expect = require('chai').expect

mongoose.Promise = global.Promise

const {BlogPosts} = require('../models')
const {TEST_DATABASE_URL} = require('../config')
const {app, runServer, closeServer} = require('../server')

chai.use(chaiHttp)

function seedBlogPostsData() {
	console.log('Seeding Data to database')
	seedData = []

	for (let i = 0; i < 10; i++) {
		seedData.push(generateBlogPostsData())
	}

	return BlogPosts.insertMany(seedData)
}

function generateBlogPostsData() {
	return {
		title: faker.lorem.sentence(),
		content: faker.lorem.paragraph(),
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		created: faker.date.past()
	}
}


function tearDownDb() {
	console.log('Deleting Database')
	return mongoose.connection.dropDatabase()
}

describe('Blog Posts API Resource', function(){
	before(function(){
		return runServer(TEST_DATABASE_URL)
	})

	beforeEach(function(){
		return seedBlogPostsData()
	})

	afterEach(function(){
		return tearDownDb()
	})

	after(function(){
		return closeServer()
	})

	describe('GET Endpoint', function(){
		it('Should return all existing data', function(){
			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res){
					res = _res
					res.should.have.status(200)
					res.body.blogposts.should.have.length.of.at.least(1)
					return BlogPosts.count()
				})
				.then(function(count){
					res.body.blogposts.should.have.length.of(count)
				})
		})

		it('Should return blogposts with the right fields', function(){
			let resBlogPost;
			return chai.request(app)
				.get('/posts')
				.then(function(res){
					res.should.have.status(200)
					res.should.be.json
					res.body.blogposts.should.be.an.Array
					res.body.blogposts.should.have.length.of.at.least(1)
					res.body.blogposts.forEach(function(blogpost) {
						blogpost.should.be.a('object')
						blogpost.should.include.keys(
							'id', 'title', 'content', 'author')
					})
					resBlogPost = res.body.blogposts[0];
					return BlogPosts.findById(resBlogPost.id)
				})
				.then(function(blogpost) {
					resBlogPost.title.should.equal(blogpost.title)
					resBlogPost.content.should.equal(blogpost.content)
					resBlogPost.author.should.equal(`${blogpost.author.firstName} ${blogpost.author.lastName}`)
				})
		})
	})

	describe('POST Endpoint', function(){
		it('Should return a new restaurant', function(){
			let newPost = generateBlogPostsData()
			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res){
					res.should.have.status(201)
					res.should.be.json
					res.body.should.be.a('Object')
					res.body.should.include.keys(
						'id', 'title', 'content', 'author')
					res.body.id.should.not.be.null
					res.body.title.should.equal(newPost.title)
					res.body.content.should.equal(newPost.content)
					res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`)
					return BlogPosts.findById(res.body.id)
				})
				.then(function(blogpost){
					console.log(blogpost.author)
					blogpost.title.should.equal(newPost.title)
					blogpost.content.should.equal(newPost.content)
					blogpost.author.firstName.should.equal(newPost.author.firstName)
					blogpost.author.lastName.should.equal(newPost.author.lastName)
				})
		})
	})

	describe('PUT Endpoint', function(){
		it('Should update fields you send over', function(){
			let updatePost = {
				title: 'Updated Title 1',
				content: 'Updated Content 1',
				author: {
					firstName: 'John',
					lastName: 'Doe'
				}
			}
			return BlogPosts
				.findOne()
				.exec()
				.then(function(res){
					updatePost.id = res.id
					return chai.request(app)
						.put(`/posts/${updatePost.id}`)
						.send(updatePost)
				})
				.then(function(res){
					res.should.have.status(201)
					res.should.be.json
					res.body.should.be.a('Object')
					res.body.should.include.keys(
						'id', 'title', 'content', 'author')
					res.body.id.should.equal(updatePost.id)
					res.body.title.should.equal(updatePost.title)
					res.body.content.should.equal(updatePost.content)
					res.body.author.should.equal(`${updatePost.author.firstName} ${updatePost.author.lastName}`)
					return BlogPosts.findById(updatePost.id).exec()
				})
				.then(function(blogpost){
					blogpost.id.should.equal(updatePost.id)
					blogpost.title.should.equal(updatePost.title)
					blogpost.content.should.equal(updatePost.content)
					blogpost.author.firstName.should.equal(updatePost.author.firstName)
					blogpost.author.lastName.should.equal(updatePost.author.lastName)
				})
		})
	})

	describe('DELETE Endpoint', function(){
		it('Should delete a blogpost by id', function(){
			let postId;
			return BlogPosts
				.findOne()
				.exec()
				.then(function(res) {
					postId = res.id
					return chai.request(app)
						.delete(`/posts/${postId}`)
				})
				.then(function(res){
					res.should.have.status(204)
					return BlogPosts.findById(postId)
				})
				.then(function(blogpost){
					expect(blogpost).to.equal.null
				})
		})
	})
})