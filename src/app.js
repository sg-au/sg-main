const express=require("../node_modules/express");
const app=express();
const port=process.env.PORT || 3000;
const bodyParser=require("../node_modules/body-parser");
const fs = require('fs');
const ejs=require("../node_modules/ejs");
const mongoose = require('mongoose');
const axios = require('axios');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const cookieParser = require("../node_modules/cookie-parser");
const sessions = require('express-session');

const { v4: uuidv4} = require('uuid');

app.set('trust proxy', 1);

app.use(cookieParser());

var cors = require('cors')
app.use(cors());

const threeDays = 3 * 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { 
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie
        maxAge: threeDays },
    resave: false 
}));

app.use(passport.initialize());
app.use(passport.session());
// Initialize Passport and session

REDIRECT_URI='https://toofantalks.com/auth/google/callback';
// REDIRECT_URI='http://localhost:3000/auth/google/callback';
// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: '34689862788-r4jamvrmrksp6f1hd3rq7ijkmu0gtbns.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: REDIRECT_URI,
  }, (accessToken, refreshToken, profile, done) => {
    // The user's Google profile information is available in the 'profile' object
    async function updateUser() {
      const email = profile._json.email; // Replace with the actual email
      const newName = profile._json.name; // Replace with the new name
      const newPicture = profile._json.picture; // Replace with the new picture URL
    
      // Check if the user exists
      const existingUser = await User.findOne({ email });
    
      if (existingUser) {
        // User exists, update the name and picture
        existingUser.name = newName;
        existingUser.picture = newPicture;
    
        // Save the updated user document
        await existingUser.save();
      } else {
        // User does not exist, handle accordingly
        console.log('User not found. Cannot update.');
      }
    }
    
    // Call the async function to execute the code
    updateUser()
      .then(() => {
        console.log('Update operation completed.');
      })
      .catch((error) => {
        console.error('Error during update:', error);
      });
      
    return done(null, profile);
  }));
  
  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });



app.set('view engine', 'ejs');


// Create a model following the defined schema

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
(req, res) => {
   // Function to update a user by email
   async function updateUserByEmail(email, uuid) {
      try {
      // Find the user with the given email and update the age
      const updatedUser = await User.findOneAndUpdate(
          { email },
          { $set: { uuid: uuid },
            $setOnInsert: { _id: uuidv4(),name:req.user._json.name,picture:req.user._json.picture } // Fields to set only during upsert
      },

          { new: true,upsert:true } // Set `new` to true to return the updated document
      ).exec();
  
      if (!updatedUser) {
          console.log('User not found');
          res.render("error",{msg:"Error occurred saving your session to database"});
        } else{
          res.redirect("/")
      }
      } catch (error) {
          console.log(error)
          res.render("error",{msg:"An error occurred"});
      } 
  }
  
  if(validateEmail(req.user._json.email)){
      const uuid = uuidv4();
      updateUserByEmail(req.user._json.email,uuid);
  }else{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.render("error",{msg:"Only Ashokan students allowed"});
    });      
  }
}
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(port, function(req,res){
    console.log("listening on port "+ port)
});

const options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html'],
    index: false,
    maxAge: '1d',
    redirect: false,
    setHeaders (res, path, stat) {
      res.set('x-timestamp', Date.now())
    }
  }

app.use('/',express.static(__dirname+"/public",options));

app.get("/",function(req,res){
    res.render("static/pages/index")
})

app.get("/ministries",function(req,res){
    res.render("static/pages/ministries")
})
app.get("/login",function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/");
    }else{
        res.redirect("/auth/google")
    }
});

app.post("/ask",function(req,res){
    if(req.isAuthenticated()){
        email=req.user._json.email;
        notifyAuthor=req.body.notifyAuthor == 'on'?true:false;
        mid=uuidv4();
        async function createQuestion(email,user) {
            try {
            // Find the user with the given email and update the age
            console.log(user);
            document={
                _id: mid,
                question: req.body.question,
                notifyAuthor: notifyAuthor,
                acceptingResponses: true,
                category: req.body.category,
                categoryText:req.body.category.join(" , "),
                author: user._id.toString(),
                answersText:""
              };
            
            const question = new Question(document);
            await question.save();
            const indexName = 'questions';
            const index = client.index(indexName);
            await index.addDocuments([document]);
            res.send({success:true});
        
            } catch (error) {
                console.log(error);
                res.send({success:false});
                return;
            }
        }
        User.findOne({ email }, { new: true }).exec()
        .then(user => {
            createQuestion(email,user);
        })
        .catch(err => {
            console.error('Error:', err);
            res.send({success:false});
        });
        }else{
            res.send({success:false});
        }
});

function validateEmail(email) {
    const domain = 'ashoka.edu.in';
    var a=false;
    if (email.endsWith(`@${domain}`)) {
      const username = email.slice(0, -domain.length - 1);
      if (username.includes('.') || username.includes('_')) {
        a=true;
      }
    }
    console.log(a)
  
    return a;
  }


app.get("/ug27",function(req,res){
    res.render("ug27-faqs")
});

app.get("/ug27/form",function(req,res){
    res.render("ug27-form")
});


app.get("/api/questions",function(req,res){
    payload = {
        q: req.query.query,
        attributesToHighlight: ["*"],
        attributesToRetrieve: ["_id"],
        // filter:"translated_language=PUNJABI"
    }
    const config = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    };
    
    axios.post('http://localhost:7700/indexes/questions/search', payload,config)
    .then(function(response){
        // console.log(response.data.hits)
        res.send(response.data);
    })
    .catch(function (error) {
        console.log(error)
        res.status(503).send({});
    });
});



app.get("/",function(req,res){
    if(req.isAuthenticated()){
        async function getQuestionsAcceptingResponses(){
            try {
              // Query the Question model to find questions where acceptingResponses is true
              const questions = await Question.aggregate([
                { $match: { acceptingResponses: true } },
                { $sample: { size: 50 } },
                { $project: { _id: 1, category: 1, question: 1 } }
              ]);          
              array=[]
              questions.forEach(question => {
                array.push(
                    {
                        _id:question._id,
                        question:question.question,
                        category:question.category
                    }
                )
              })
              return (array);
            } catch (error) {
              // Handle any errors that occur during the query
              console.error('Error fetching questions accepting responses:', error);
              throw error;
            }
        }
        getQuestionsAcceptingResponses()
        .then((questionsAcceptingResponses) => {
            // string=JSON.stringify(questions)
            // console.log('Questions accepting responses:', questions);
            // Meilisearch is typo-tolerant:
            index
            .search('')
            .then((response) => {
            // console.log(response);
                res.render("index",{questionsAcceptingResponses:questionsAcceptingResponses,questions:response.hits});
            })
            .catch((e) => {
                // console.log(e);
                res.render("index",{questionsAcceptingResponses:JSON.stringify(questionsAcceptingResponses),questions:{}});
            })

        })
        .catch((error) => {
            console.error('Error:', error);
            index
            .search('')
            .then((response) => {
            console.log(response);
                res.render("index",{questionsAcceptingResponses:{},questions:response.hits});
            })
            .catch((e) => {
                console.log(e);
                res.render("index",{questionsAcceptingResponses:{},questions:{}});
            })
        });    
    }else{
        res.render("about")
    }
});

app.get("/question/:id",function(req,res){
    if(req.isAuthenticated()){
        function calculateTimeAgo(inputDate) {
            const currentDate = new Date();
            const timeDifference = currentDate - inputDate;
            
            const seconds = Math.floor(timeDifference / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
        
            if (days > 0) {
                return `${days} day${days !== 1 ? 's' : ''} ago`;
            } else if (hours > 0) {
                return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            } else if (minutes > 0) {
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            } else {
                return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
            }
        }
async function fetchQuestionWithAnswers() {
    try {
        const question = await Question.findById(atob(req.params.id))
            .populate('author') // Populate author's info
            .populate({
                path: 'answers',
                populate: { path: 'answeredBy', select: '_id email' }, // Populate answers' authors' info
            })
            .exec();

        if (!question) {
            console.log('Question not found.');
            res.render("error",{msg:"404"});
        }
        // console.log('Question:', question);
        res.render("question",{question:question});

    } catch (err) {
        console.error('Error:', err);
    }
}

fetchQuestionWithAnswers();
    }else{
        res.redirect("/login")
    }
});

app.get("/search",function(req,res){
    if(req.isAuthenticated()){
        res.render("search");
    }else{
        res.redirect("/login")
    }
});


app.get("/petition",function(req,res){
  if(req.isAuthenticated()){

/// Get all nepSignatures and populate the "user" field
NepSignature.find({})
.populate('user') // Populate the "user" field with user data
.then((signatures) => {
    console.log('nepSignatures:', signatures);

    // Get all nepComments and populate the "user" field
    return NepComment.find({})
        .populate('user') // Populate the "user" field with user data
        .then((comments) => {
            console.log('nepComments:', comments);

            // Render your view with the data
            res.render("new-petition", { comments: comments, signatures: signatures });
        });
})
.catch((err) => {
    console.error('Error fetching data:', err);
});
  }else{
    res.render("error",{msg:"404"})
  }
});



app.post("/petition-comment",function(req,res){
  if(req.isAuthenticated()){
    async function getUserIdByEmail(email) {
        try {
          // Find the user with the given email
          const user = await User.findOne({ email });
          if (user) {
            // Return the user ID if found
            const userId = user._id;
                        // Example data for a new comment
            const newCommentData = {
              comment: req.body.comment, // The comment text
              user: userId // Replace with the actual user's ID who made the comment
            };

            // Create a new NepComment instance
            const newComment = new NepComment(newCommentData);

            // Save the new comment to the database
            newComment.save()
            .then((comment) => {
              res.send("SAVED")
            })
            .catch((error) => {
              console.log(error)
              res.render("error",{msg:"Unable to save comment"})
            })               
          } else {
            // If user is not found, handle the case here (e.g., return null or throw an error)
            return null;
          }
        } catch (err) {
          // Handle any error that might occur during the database query
          console.error('Error fetching user ID by email:', err);
          return null;
        }
    }
    getUserIdByEmail(req.user._json.email)
   
}else{
    res.sendStatus(403)
}
});


app.post("/petition-sign",function(req,res){
  if(req.isAuthenticated()){
    async function getUserIdByEmail(email) {
        try {
          // Find the user with the given email
          const user = await User.findOne({ email });
          console.log(user)
          if (user) {
            // Return the user ID if found
            const userId = user._id;
                        // Example data for a new comment
                        const newSignatureData = {
                          user: userId // Replace with the actual user's ID who signed
                        };
                        
                        // Define the query to find the signature by the user ID
                        const query = { user: userId };
                        
                        // Define the update operation (or new document to insert)
                        const update = { user: userId }; // You can include other fields to update if needed
                        
                        // Set the options to upsert and return the new document
                        const options = {
                          upsert: true,
                          new: true // Return the updated document if an update occurs
                        };
                        
                        // Use findOneAndUpdate with upsert option
                        NepSignature.findOneAndUpdate(query, update, options)
                          .then((signature) => {
                            if (signature) {
                              // Signature was either found and updated or inserted as new
                              console.log('Signature updated/inserted:', signature);
                            } else {
                              // Handle the case where the findOneAndUpdate did not find or insert a document
                              console.log('Signature not found/inserted.');
                            }
                            res.redirect("/petition");
                          })
                          .catch((error) => {
                            console.error('Error updating/inserting signature:', error);
                            res.render("error", { msg: "Error signing petition" });
                          });
          } else {
            // If user is not found, handle the case here (e.g., return null or throw an error)
            return null;
          }
        } catch (err) {
          // Handle any error that might occur during the database query
          console.error('Error fetching user ID by email:', err);
          return null;
        }
    }
    getUserIdByEmail(req.user._json.email)
   
}else{
    res.sendStatus(403)
}
});


app.post("/answer",function(req,res){
    if(req.isAuthenticated()){
        async function getUserIdByEmail(email) {
            try {
              // Find the user with the given email
              const user = await User.findOne({ email });
              if (user) {
                // Return the user ID if found
                const userId = user._id;
                const questionId = req.body.questionId;
                const answerText = req.body.answerText;
                // Create a new Answer
                const newAnswer = new Answer({
                _id:uuidv4(),
                answeredBy: userId,
                answer: answerText,
                question: questionId,
                });
                // Save the new Answer to the database
                newAnswer.save()
                .then(savedAnswer => {
                  updateQuestionWithNewAnswer(questionId,savedAnswer._id,savedAnswer.answer);
                  // You can access the saved document using the `savedAnswer` variable
                })
                .catch(error => {
                  console.error("Error saving answer:", error);
                });                
              } else {
                // If user is not found, handle the case here (e.g., return null or throw an error)
                return null;
              }
            } catch (err) {
              // Handle any error that might occur during the database query
              console.error('Error fetching user ID by email:', err);
              return null;
            }
        }
        getUserIdByEmail(req.user._json.email)
        // Assuming you have the user's ID, question ID, and answer text as variables.
        async function updateQuestionWithNewAnswer(questionId, answerId,text) {
            try {
              // Find the corresponding Question using its ID
              console.log(questionId)
              const question = await Question.findOne({ _id: questionId });          
          
              // Push the new Answer ID to the "answers" field
              question.answers.push(answerId);
              question.answersText+=text+'\n';


          
              // Save the updated Question back to the database
              await question.save();

              // Meilisearch update

              const existingDocument = await index.getDocument(questionId);
              client.index('questions').updateDocuments([{
                id: questionId,
                answersText:existingDocument.answersText+text+'\n'
            }])
              // Update fields of the existing document
              var updatedDocument = existingDocument;
              updatedDocument.answersText+=text+'\n'
              // Update the document in MeiliSearch
              const response = await index.updateDocuments(updatedDocument);
              console.log('Document updated in MeiliSearch:', response);
              res.send({success:true})
            } catch (err) {
              // Handle the error here
              console.log(err)
              res.send({success:false})

            }
        }    
    }else{
        res.sendStatus(403)
    }
});

app.get("/answer",function(req,res){
    if(req.isAuthenticated()){
        async function getQuestionsAcceptingResponses(){
            try {
              // Query the Question model to find questions where acceptingResponses is true
              const questions = await Question.find({ acceptingResponses: true }).exec();          
              return questions;
            } catch (error) {
              // Handle any errors that occur during the query
              console.error('Error fetching questions accepting responses:', error);
              throw error;
            }
        }
        getQuestionsAcceptingResponses()
        .then((questions) => {
            res.send(questions)
            console.log('Questions accepting responses:', questions);
        })
        .catch((error) => {
            console.error('Error:', error);
        });    
    }else{
        res.sendStatus(403);
    }
});


app.get('/logout',(req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

// EMAIL Template: https://github.com/mailpace/templates/blob/main/dist/confirmation.html



app.get('/api/get-email', (req, res) => {
    // Get the session data from wherever it's stored (e.g., database, memory)
    if(req.isAuthenticated() && req.query.code=="pQhnajnaq911bs91Xcvan"){
        res.send({email:req.user._json.email})
    }else{
        res.send({data:"403"}) 
    }
  });

  app.get('/code', (req, res) => {
    if(req.isAuthenticated()){
        res.render("code");
    }else{
        res.render("code");
    }
  });


app.get("/try/some/logo",function(req,res){
    if(req.query.value=="aa"){
        res.sendFile(__dirname+"/logo.jpeg");
    }else{
        res.render("error",{msg:""});
    }    
})

  
app.get('*', (req, res) => {
    res.render("error",{msg:"404 not found"});
  });

// async function indexDocuments() {
  
//     // Fetch all documents from the collection
//     const documents = await Question.find();
  
//     // Get the MeiliSearch index you want to use for indexing
//     const indexName = 'questions';
//     const index = client.index(indexName);
//     await index.addDocuments(documents);

//   }
//   indexDocuments()


