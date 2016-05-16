/**
 * New node file
 */
var mongoose = require('mongoose');  
var listingsSchema = new mongoose.Schema({  
	id: Number,
	title: String,
	description: String,
	isactive: Boolean
});
mongoose.model('Listing', listingsSchema);
