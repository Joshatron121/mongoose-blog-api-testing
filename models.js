const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
	title:  		{ type: String, required: true },
	content: 	{ type: String, required: true },
	author: 	{
		firstName: 	{ type: String, required: true },
		lastName: 	{ type: String, required: true}
	}
});

blogPostSchema.virtual('nameString').get(function(){
	return `${this.author.firstName} ${this.author.lastName}`.trim();
})

blogPostSchema.methods.apiResponse = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.nameString
	}
}

const BlogPosts = mongoose.model('Blogposts', blogPostSchema);

module.exports = {BlogPosts};