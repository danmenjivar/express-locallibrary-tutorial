var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema({
  name: { type: String, required: true, maxLength: 100, minLength: 3 },
});

// Virtual for Genre's URL
GenreSchema.virtual('url').get(function () {
  return '/catalog/author' + this._id;
});

// Export model
module.exports = mongoose.model('Genre', GenreSchema);
