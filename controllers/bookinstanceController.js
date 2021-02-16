const { body,validationResult } = require('express-validator');
var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');

var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });

};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })

};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });

};

//***TO DO 16 FEB***

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
//exports.bookinstance_delete_get = function(req, res) {
    //res.send('NOT IMPLEMENTED: BookInstance delete GET');
//};

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback)
        },
        
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            res.redirect('/catalog/bookinstances');
        }
        // Successful, so render.
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: results.bookinstance } );
    });

};

// Handle BookInstance delete on POST.
//exports.bookinstance_delete_post = function(req, res) {
    //res.send('NOT IMPLEMENTED: BookInstance delete POST');
//};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {

    async.parallel({
        bookinstance: function(callback) {
          BookInstance.findById(req.body.bookinstanceid).exec(callback)
        },
        
    }, function(err, results) {
             
		// Delete bookinstance object and redirect to the list of bookinstances.
		BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err) {
			if (err) { return next(err); }
			// Success - go to bookinstance list
			res.redirect('/catalog/bookinstances')
		})
        
    });
};

// Display BookInstance update form on GET.
//exports.bookinstance_update_get = function(req, res) {
//res.send('NOT IMPLEMENTED: BookInstance update GET');
//};

// Display book update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('bookinstance').exec(callback);
        },
        
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.bookinstance==null) { // No results.
                var err = new Error('BookInstance not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            //for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                //for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    //if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                       // results.genres[all_g_iter].checked='true';
                    //}
                //}
            //}
            res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: results.bookinstances });
        });

};

// Handle bookinstance update on POST.
//exports.bookinstance_update_post = function(req, res) {
    //res.send('NOT IMPLEMENTED: BookInstance update POST');
//};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

     // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

       
        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });


        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
			//redirect to the author update get 
			//add console.log
			
			res.send('Form has errors');
			
           
        }
        else {
            // Data from form is valid. Update the record.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,bookinstance) {
                if (err) { return next(err); }
                   // Successful - redirect to bookinstance detail page.
                   
				   res.redirect(bookinstance.url);
                });
        }
    }
];