var BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
var Book = require('../models/book');
var async = require('async');
const bookinstance = require('../models/bookinstance');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render('bookinstance_detail', {
        title: 'Copy: ' + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, 'title').exec(function (err, books) {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title').exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  async.parallel(
    {
      book_instance: function (callback) {
        BookInstance.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      // Error in API usage
      if (err) {
        return next(err);
      }

      // No results
      if (results.book_instance == null) {
        var err = new Error('Bookinstance not found');
        err.status = 404;
        return next(err);
      }

      // On success, render.
      res.render('bookinstance_delete', {
        title: 'Delete Book Instance',
        book_instance: results.book_instance,
      });
    }
  );
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  async.parallel(
    {
      book_instance: function (callback) {
        BookInstance.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      // Error in API usage
      if (err) {
        return next(err);
      }
      BookInstance.findByIdAndRemove(
        req.body.bookinstanceid,
        function deleteBookInstance(err) {
          if (err) {
            return next(err);
          }
          // Success - redirect to genre list
          res.redirect('/catalog/bookinstances');
        }
      );
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  // Get Book instance for form.
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).populate('book').exec(callback);
      },
      books: function (callback) {
        Book.find(callback);
      },
    },
    function (err, results) {
      // API Error
      if (err) {
        return next(err);
      }
      // No results
      if (results.bookinstance == null) {
        var err = new Error('BookInstance not found');
        err.status = 404;
        return next(err);
      }
      // Success - render form with values
      res.render('bookinstance_form', {
        title: 'Update BookInstance',
        book_list: results.books,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('bookinstance_form', {
        title: 'Update BookInstance',
        book_list: books,
        selected_book: bookinstance.book._id,
        bookinstance: bookinstance,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Create a BookInstance object with escaped and trimmed data (and the old id!)
      var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id,
      });

      // Update the record
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        function (err, thebookinstance) {
          if (err) {
            return next(err);
          }
          // Successful - redirect to detail page
          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
