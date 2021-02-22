const { body,validationResult } = require("express-validator");
var Book = require('../models/book');
var async = require('async');
var Genre = require('../models/genre');

// Display list of all Genres.
exports.genre_list = function(req, res, next) {

  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};


// Handle Genre create on POST.
exports.genre_create_post =  [

  // Validate and santise the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre(
      { name: req.body.name }
    );

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
      return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec( function(err, found_genre) {
           if (err) { return next(err); }

           if (found_genre) {
             // Genre exists, redirect to its detail page.
             res.redirect(found_genre.url);
           }
           else {

             genre.save(function (err) {
               if (err) { return next(err); }
               // Genre saved. Redirect to genre detail page.
               res.redirect(genre.url);
             });

           }

         });
    }
  }
];

// Display Genre delete form on GET.
//exports.genre_delete_get = function(req, res) {
    //res.send('NOT IMPLEMENTED: Genre delete GET');
//};

// Display genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
          Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Handle Genre delete on POST.
//exports.genre_delete_post = function(req, res) {
    //res.send('NOT IMPLEMENTED: Genre delete POST');
//};

// Handle genre delete on POST.
exports.genre_delete_post = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.id).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre': req.body.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genre_books.length > 0) {
            // genre has books. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/genres')
            })
        }
    });
};

// Display Genre update form on GET.
//exports.genre_update_get = function(req, res) {
    //res.send('NOT IMPLEMENTED: Genre update GET');
//};

// Display genre update form on GET.
exports.genre_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        
        
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.genre==null) { // No results.
                var err = new Error('Genre not found');
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
            res.render('genre_form', { title: 'Update Genre', genre: results.genre });
        });

};

// Handle Genre update on POST.
//exports.genre_update_post = function(req, res) {
    //res.send('NOT IMPLEMENTED: Genre update POST');
//};

// Handle book update on POST.
exports.genre_update_post = [

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

    // Validate and santise the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        
		// Create a genre object with escaped and trimmed data.
		var genre = new Genre(
		  { name: req.body.name, 
		    _id:req.params.id 
		  });

		if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
			//redirect to the author update get 
			//add console.log
			
			res.send('Form has errors');
			
           
        }
       else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,genre) {
                if (err) { return next(err); }
                   // Successful - redirect to genre detail page.
                   res.redirect(genre.url);
                });
        }

       /* if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

                            
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                //for (let i = 0; i < results.genres.length; i++) {
                   // if (book.genre.indexOf(results.genres[i]._id) > -1) {
                       // results.genres[i].checked='true';
                    //}
                //}
                res.render('genre_form', { title: 'Update Genre',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,genre) {
                if (err) { return next(err); }
                   // Successful - redirect to genre detail page.
                   res.redirect(genre.url);
                });
        }*/
    }
];