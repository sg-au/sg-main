const express = require('express');
const router = express.Router();
const {transporterSG,transporterTECH} = require("../config/nodemailer-config"); // Import the Nodemailer configuration module
const fs = require('fs');
const publicTicketCategories = JSON.parse(fs.readFileSync('./data/category-subcategory-map.json', 'utf8'));
const jsonfile = require('jsonfile')
const file = './data/tickets.jsonl'
const helpers=require('../config/helperFunctions.js');
const axios=require("axios");
var pdf = require("pdf-creator-node");
const { google } = require('googleapis');
const multer = require('multer')
// Read HTML Template
var undertakingTemplate = fs.readFileSync("./data/undertaking-template.html", "utf8");
    
const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers if required by your Strapi API
      'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
    },
};

// TODO: Move to separate file
const upload = multer({ dest: 'uploads/'})

const DRIVE_CLIENT_ID = process.env.DRIVE_CLIENT_ID;
const DRIVE_CLIENT_SECRET = process.env.DRIVE_CLIENT_SECRET;
const DRIVE_REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const DRIVE_REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  DRIVE_CLIENT_ID,
  DRIVE_CLIENT_SECRET,
  DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const apiUrl = process.env.STRAPI_API_URL;

// Parse incoming request bodies as JSON
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// Define routes here
router.get('/', async(req, res) => {
  var usersCount = (await axios.get(`${apiUrl}/users/count`, axiosConfig)).data;
  var poolCount = (await axios.get(`${apiUrl}/pools`, axiosConfig)).data.meta.pagination.total;
  var servicesCount = (await axios.get(`${apiUrl}/services`, axiosConfig)).data.meta.pagination.total;
  var reviewsCount = (await axios.get(`${apiUrl}/reviews`, axiosConfig)).data.meta.pagination.total;
  res.render("platform/pages/index",{usersCount:usersCount,poolCount:poolCount,servicesCount:servicesCount,reviewsCount:reviewsCount});

});

router.get('/intercollegiate', async (req, res) => {
    try {
        var endpoint = '/intercollegiate-events';
        var response = await axios.get(`${apiUrl}${endpoint}`, axiosConfig);
        events = response.data.data
        res.render("platform/pages/intercollegiate",{events:events});
      } catch (error) {
        console.error('An error occurred:', error);
    }
});

router.get('/announcements', (req, res) => {
    announcements=[];
    axios.get(`${process.env.STRAPI_API_URL}/announcements?populate=department.name&populate=department.profile.profile_pic&sort[0]=createdAt:desc`,axiosConfig)
    .then((response) => {
        // Access the response data
        announcements = response.data.data;
        // You can work with departmentsData here
        res.render("platform/pages/announcements",{announcements:announcements});
    })
    .catch((error) => {
        console.error('Error fetching departments:', error);
        // Handle error
        res.send("An error occurred");
    });
});

router.get('/course-reviews', (req, res) => {
  const maxCoursesToLoad = 3000;
  axios.get(`${process.env.STRAPI_API_URL}/courses?fields[0]=courseCode&fields[1]=courseTitle&fields[2]=semester&fields[3]=year&populate[0]=faculties&populate[1]=course_reviews&populate[2]=reviews&pagination[pageSize]=${maxCoursesToLoad}&filters[$or][0][year][$eq]=2024&filters[$or][1][year][$eq]=2023&filters[$or][2][year][$eq]=2022&sort[0]=year:desc`, axiosConfig)
    .then((response) => {
      res.render("platform/pages/course-reviews", { data: response.data.data });
    })
    .catch((error) => {
      console.error('Error fetching departments:', error);
    });
});



router.get('/course-reviews/:id', (req, res) => {
  axios.get(`${process.env.STRAPI_API_URL}/courses/${req.params.id}?populate[0]=faculties&populate[1]=reviews&populate[2]=course_reviews&populate[3]=reviews.author`,axiosConfig)
  .then((response) => {
    // Ratings
    let transparentTotal = 0;
    let relatabilityTotal = 0;
    let strictTotal = 0;
    let fairnessTotal = 0;
    let lecturerTotal = 0;
    let overallTotal = 0;

    let transparentCount=0;
    let relatabilityCount=0;
    let strictCount=0;
    let fairnessCount=0;
    let lecturerCount=0;
    let overallCount=0;

    courseReviews=response.data.data.attributes.reviews.data;
    // Loop through each course review
    courseReviews.forEach(review => {
        transparentTotal += (review.attributes.transparent?review.attributes.transparent:0);
        transparentCount += (review.attributes.transparent && review.attributes.transparent>0)?1:0;
        
        relatabilityTotal += (review.attributes.relatability?review.attributes.relatability:0);
        relatabilityCount += (review.attributes.relatability && review.attributes.relatability>0)?1:0;

        strictTotal += (review.attributes.strict?review.attributes.strict:0);
        strictCount += (review.attributes.strict && review.attributes.strict>0)?1:0;


        fairnessTotal+= (review.attributes.fair?review.attributes.fair:0);
        fairnessCount += (review.attributes.fair && review.attributes.fair>0)?1:0;


        lecturerTotal += (review.attributes.lecturer?review.attributes.lecturer:0);
        lecturerCount += (review.attributes.lecturer && review.attributes.lecturer>0)?1:0;

        overallTotal += (review.attributes.overall?review.attributes.overall:0);
        overallCount += (review.attributes.overall && review.attributes.overall>0)?1:0;

    });

    // Total number of reviews
    const totalReviews = courseReviews.length;

    transparentBool=transparentCount==0?false:true;
    relatabilityBool=relatabilityCount==0?false:true;
    strictBool=strictCount==0?false:true;
    fairBool=fairnessCount==0?false:true;
    lecturerBool=lecturerCount==0?false:true;
    overallBool=overallCount==0?false:true;
    
    // Calculate Average
    const transparent = transparentCount>0?(Math.round((transparentTotal / transparentCount)*10)/10):0;
    const relatability = relatabilityCount>0?(Math.round((relatabilityTotal / relatabilityCount)*10)/10):0;
    const strict = strictCount>0?(Math.round((strictTotal / strictCount)*10)/10):0;
    const fair = fairnessCount>0?(Math.round((fairnessTotal / fairnessCount)*10)/10):0;
    const lecturer = lecturerCount>0?(Math.round((lecturerTotal / lecturerCount)*10)/10):0;
    const overall = overallCount>0?(Math.round((overallTotal / overallCount)*10)/10):0;
    const bool = totalReviews == 0?false:true;
    const rating = (Math.round(((transparent+relatability+strict+fair+lecturer+overall)/6)*10)/10);

    const ratings={
      transparent,
      relatability,
      strict,
      fair,
      lecturer,
      overall,
      rating,
      bool,
      transparentCount,
      relatabilityCount,
      strictCount,
      fairnessCount,
      lecturerCount,
      overallCount,
      transparentBool,
      relatabilityBool,
      strictBool,
      fairBool,
      lecturerBool,
      overallBool
    }
    // Ratings
    // console.log(ratings)

    // Description
    response.data.data.attributes.description = response.data.data.attributes.description.replace(/<h4>.*?<\/h4>/, '');
    response.data.data.attributes.description = response.data.data.attributes.description.replace('<p class="cmsDescp">', '');
    response.data.data.attributes.description = response.data.data.attributes.description.replace('</p>', '');
    // Description


    // Reviews
    var reviews=[];
    courseReviews.forEach(rw => {
      // console.log(rw.attributes.author)
      if(rw.attributes.author && rw.attributes.author.data){
        object = {
          review:rw.attributes.review,
          grade:rw.attributes.grade,
          batch:rw.attributes.batch,
          major:rw.attributes.major,
          name:rw.attributes.author.data.attributes.username,
          overall:rw.attributes.overall,
          tf:rw.attributes.tf,
          gradingType:rw.attributes.grading_type,
          extracredit:rw.attributes.extracredit,
          mode:rw.attributes.mode
        }
      }else{
      object = {
        review:rw.attributes.review,
        grade:rw.attributes.grade,
        batch:rw.attributes.batch,
        major:rw.attributes.major,
        overall:rw.attributes.overall,
        name:"",
        tf:rw.attributes.tf,
        gradingType:rw.attributes.grading_type,
        extracredit:rw.attributes.extracredit,
        mode:rw.attributes.mode
      }
    }
      // console.log(object)
      reviews.push(object);
    });
    // Reviews


    res.render("platform/pages/course",{data:response.data.data.attributes,ratings:ratings,id:response.data.data.id, reviews:reviews});
  })
  .catch((error) => {
      console.error('Error fetching departments:', error);
      res.send(404);

  });
});

router.get('/add-course-review/:id', (req, res) => {
  axios.get(`${process.env.STRAPI_API_URL}/courses/${req.params.id}?populate[0]=faculties&populate[1]=course_reviews`,axiosConfig)
  .then((response) => {
    response.data.data.attributes.description = response.data.data.attributes.description.replace(/<h4>.*?<\/h4>/, '');
    response.data.data.attributes.description = response.data.data.attributes.description.replace('<p class="cmsDescp">', '');
    response.data.data.attributes.description = response.data.data.attributes.description.replace('</p>', '');
    res.render("platform/pages/add-course-review",{data:response.data.data.attributes,id:response.data.data.id});
  })
  .catch((error) => {
      console.error('Error fetching departments:', error);
      res.send(404);

  });
})

router.post('/add-course-review/:id', (req, res) => {
  // console.log(req.body);
  if (req.body.name && req.body.name === 'on') {
    // If req.body has a key called 'name' and its value is 'on', leave it blank
    userEmail=req.user._json.email;
    axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}`,axiosConfig)
    .then((response) => {
      // Assuming you get a single user with the specified email
      userId = response.data[0].id;
      req.body = { ...req.body, course: [req.params.id], author:[userId]};
      axios.post(`${process.env.STRAPI_API_URL}/reviews`,{data:req.body}, axiosConfig)
        .then((response) => {
          res.redirect("/platform/course-reviews")
        })
        .catch((error) => {
            console.log(error)
            res.send("An error occurred");
        });
    })
    .catch((error) => {
      console.error('Error fetching user:', error);
      // Handle error
      res.send("An error occurred");
    });
  } else {
    req.body = { ...req.body, course: [req.params.id]};
    axios.post(`${process.env.STRAPI_API_URL}/reviews`,{data:req.body}, axiosConfig)
        .then((response) => {
          res.redirect("/platform/course-reviews")
        })
        .catch((error) => {
          console.log(error)
          res.send("An error occurred");
        });
  }
})

router.get('/tickets', (req, res) => {
    const fetchData = async () => {
        try {
          const response = await axios.get(process.env.STRAPI_API_URL+'/users?populate[tickets][populate][departments][fields][0]=name&filters[email][$eqi]='+req.user._json.email,axiosConfig);
          return response.data;
        } catch (error) {
          console.error('Error fetching data:', error);
        //   throw error; // Re-throw the error to handle it at a higher level if needed
        }
      };
      
      (async () => {
        try {
          const data = await fetchData();
          let temp=data[0].tickets;
          function sortTicketsByStatusAndDate(tickets) {
            // Define the custom sorting order for the "status" field
            const statusOrder = { pending: 1, resolved: 2 };
          
            // Use the sort() method to sort the array of tickets
            tickets.sort((a, b) => {
              // Compare by "status" first (based on the statusOrder)
              const statusComparison = statusOrder[a.status] - statusOrder[b.status];
          
              // If the "status" is the same, compare by "createdAt" in reverse order (latest to last)
              if (statusComparison === 0) {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateB - dateA; // Reverse order for latest to last
              }
          
              return statusComparison;
            });
          
            return tickets;
          }
          data[0].tickets = sortTicketsByStatusAndDate(temp);
          res.render("platform/pages/tickets",{tickets:data[0].tickets});
        } catch (error) {
          // Handle the error here if needed
          console.error('An error occurred:', error);
        }
      })();
});

router.get('/create-ticket', (req, res) => {
    axios.get(`${process.env.STRAPI_API_URL}/departments?populate[0]=profile.email`,axiosConfig)
    .then((response) => {
        // Access the response data
        const departmentsData = response.data.data;
        // You can work with departmentsData here
        // Extract CategoryList
        const categoryList = publicTicketCategories.categories.map(category => category.name);

        // Extract SubcategoryList
        const subcategoryList = publicTicketCategories.categories.reduce((acc, category) => {
            category.subcategories.forEach(subcategory => {
                if (!acc.includes(subcategory.name)) {
                    acc.push(subcategory.name);
                }
            });
            return acc;
        }, []);

        // Extract CategorySubcategoryMap
        const categorySubcategoryMap = {};
        publicTicketCategories.categories.forEach(category => {
            categorySubcategoryMap[category.name] = category.subcategories.map(subcategory => subcategory.name);
        });

        // Extract SubCategoryMinistryMap
        const subcategoryMinistryMap = {};
        publicTicketCategories.categories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                subcategoryMinistryMap[subcategory.name] = subcategory.ministries;
            });
        });
        res.render("platform/pages/create-ticket",{departments:departmentsData,userEmail:req.user._json.email,categoryList:categoryList,subcategoryList:subcategoryList,categorySubcategoryMap:JSON.stringify(categorySubcategoryMap),subcategoryMinistryMap:JSON.stringify(subcategoryMinistryMap)});

    })
    .catch((error) => {
        console.error('Error fetching departments:', error);
        // Handle error
    });
});

router.post('/save-ticket-new', (req, res) => {
    const ticketId= helpers.createTicketId('SG', 8);
    
    // Save to local file

    let obj={
      ticketId:ticketId,
      subject:req.body.subject,
      author:req.user._json.email,
      category:req.body.category,
      subcategory:req.body.subcategory,
      ticket:req.body.ticket,
      ministries:req.body._cc,
      date:helpers.formatDate(new Date())
    }

    jsonfile.writeFile(file, obj, { flag: 'a+' }, function (err) {
      if (err) console.error(err)
    });
    // Save to local file

    const mailOptions = {
      from: `Public Ticket System <${process.env.SGMAIL_ID}>`,
      to: req.body._cc,
      cc:req.user._json.email,
      subject: req.body.subject,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Template</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  border-radius: 10px;
                  background-color: #ffffff;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              h1 {
                  text-align: center;
                  color: #0078be;
                  margin-bottom: 20px;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
              }
              table, th, td {
                  border: 1px solid #ddd;
              }
              th, td {
                  padding: 8px;
                  text-align: left;
              }
              th {
                  background-color: #f2f2f2;
              }
              .greeting {
                  color: #0078be;
                  font-size: 1.2em;
                  text-align: center;
                  margin-bottom: 20px;
              }
          </style>
      </head>
      <body>
      <div class="container">
      <h1>Confirmation of Ticket Receipt</h1>
      <p class="greeting">Dear User,<hr/><br> This message is to confirm the receipt of your ticket. Your ticket ID for future reference is <span style="color: #0078be;">#${ticketId}</span>. <br/><br/>The Ministry/body will get back to you on your query as soon as possible. <br/><br/>Thank you for your trust and cooperation.</p>
      <table>
          <tr>
              <th>Field</th>
              <th>Value</th>
          </tr>
          <tr>
              <td>Ticket ID</td>
              <td>${ticketId}</td>
          </tr>
          <tr>
              <td>Subject</td>
              <td>${req.body.subject}</td>
          </tr>
          <tr>
              <td>Category</td>
              <td style="color: #0078be;">${req.body.category}</td>
          </tr>
          <tr>
              <td>Subcategory</td>
              <td style="color: #0078be;">${req.body.subcategory}</td>
          </tr>
          <tr>
              <td>Ticket</td>
              <td>${req.body.ticket}</td>
          </tr>
          <tr>
              <td>Date and Time Created</td>
              <td>${helpers.formatDate(new Date())}</td>
          </tr>
      </table>
  </div>
      </body>
      </html>
      
      `,
      replyTo:req.user._json.email
    };

    // Send the email
    transporterSG.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred:', error.message);
        res.sendStatus(400);
        return;
      }
      console.log('Email sent successfully!', info.messageId);
      res.sendStatus(202);
    });
});


router.post('/create-ticket', (req, res) => {
    // Define the data for the new ticket
    var newTicketData=null;
    if(req.body.share=="on"){
        newTicketData = {
            status: 'pending',
            subject: req.body.subject,
            ticket: req.body.ticket,
            category: req.body.category,
            subcategory: req.body.subcategory,
            details:{
                name:req.user._json.name,
                email:req.user._json.email
            }
        };
    }else{
        newTicketData = {
            status: 'pending',
            subject: req.body.subject,
            ticket: req.body.ticket,
            category: req.body.category,
            subcategory: req.body.subcategory
        };
    }
  
  // Get the user ID based on the user's email
  // Replace 'userEmail' with the actual email you want to look up
  const userEmail = req.user._json.email; // Replace with the email
  let userId;
  
  axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}`,axiosConfig)
    .then((response) => {
      // Assuming you get a single user with the specified email
      userId = response.data[0].id;
  
      // Add the author field to the new ticket data
      newTicketData.author = userId;
      newTicketData.departments = req.body.departments;
      // Send a POST request to create the new ticket
      axios.post(`${process.env.STRAPI_API_URL}/tickets`, {
        data: newTicketData
      }, axiosConfig)
        .then((response) => {
        //   console.log('New ticket created:', response.data);
          res.redirect("/platform/tickets")
          // Handle success
        })
        .catch((error) => {
          console.error('Error creating ticket:', error);
          // Handle error
        });
    })
    .catch((error) => {
      console.error('Error fetching user:', error);
      // Handle error
    });
});

router.get('/tickets/:id', (req, res) => {
    const fetchData = async () => {
        try {
          const response = await axios.get(process.env.STRAPI_API_URL+'/users?populate[tickets][populate][departments][fields][0]=name&populate[tickets][populate][response][fields][0]=response&filters[email][$eqi]='+req.user._json.email,axiosConfig);
          return response.data;
        } catch (error) {
          console.error('Error fetching data:', error);
          throw error; // Re-throw the error to handle it at a higher level if needed
        }
      };
      
      (async () => {
        try {
          const data = await fetchData();
          userTicket=null;
          data[0].tickets.forEach(function(ticket){
            if(ticket.id==req.params.id){
                userTicket=ticket;
            }
          });
          if(userTicket){
            res.render("platform/pages/ticket",{ticket:userTicket});
          }else{
            res.send("error 404");
          }
    } catch (error) {
          // Handle the error here if needed
          console.error('An error occurred:', error);
        }
      })();
});


router.get('/public-forum', async (req, res) => {
    try {
        var endpoint = '/forums';
        var response = await axios.get(`${apiUrl}${endpoint}?populate=comments,signatures,department`, axiosConfig);
        res.render("platform/pages/public-forum", {petitions: response.data});
    } catch (error) {
        console.error('An error occurred:', error);
    }
});

router.get('/public-forum/:id', async (req, res) => {
    try {
        var endpoint = '/forums';
        var com_endpoint = '/comments';
        var petitionID = req.params.id;
        var response = await axios.get(`${apiUrl}${endpoint}/${petitionID}?populate=signatures,comments,department&pagination[pageSize]=1000`, axiosConfig);
        var comments = await axios.get(`${apiUrl}${com_endpoint}?populate=author,forum&pagination[pageSize]=1000`, axiosConfig);
        var user_array = [];
        (response.data.data.attributes.signatures.data).forEach(userSign => {
            user_array.push(userSign.attributes.email);
        });
        var com_array = []
        if(comments.data.data.length != 0) {
            (comments.data.data).forEach(comment => {
                if(comment.attributes.forum.data.id == petitionID) {
                    com_array.push(comment);
                } 
            });
        }
        res.render("platform/pages/petition", {petition: response.data.data, comments: com_array, signed: user_array.includes(req.user._json.email)});
    } catch (error) {
        console.error('An error occurred:', error);
    }
});

router.post('/create-comment', async (req, res) => {
  function sanitizeInput(inputString) {
    // Regular expression to match HTML tags
    var htmlTagsRegex = /<\/?[^>]+(>|$)/g;

    // Replace HTML tags with an empty string
    var sanitizedString = inputString.replace(htmlTagsRegex, '');

    return sanitizedString;
} 
    var com_endpoint = '/comments';
    var petitionId = Number(req.body.petitionId);
    var commentContent = sanitizeInput(req.body.commentContent);

    commentContent=commentContent.replaceAll("\n","</br>");
    var user_response = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
    var userId = user_response.data[0].id;  
    const commentData = {
        data: {
            comment: commentContent, // Add comment content
            author: userId, // Link the comment to the user
            forum: petitionId, // Link the comment to the petition
        } 
    }
    try {
        // Make an API request to create a new comment in Strapi
        var com_response = await axios.post(`${apiUrl}${com_endpoint}`, commentData, axiosConfig);
        res.redirect('/platform/public-forum/' + petitionId); // Redirect to the petition page after comment creation
      } catch (error) {
        console.error('Error creating comment:', error.response.data);
        res.status(500).send('Error creating comment.');
      }
});

router.post('/sign-petition', async (req, res) => {
    var endpoint = '/forums';
    var petitionId = Number(req.body.petitionId);
    var response = await axios.get(`${apiUrl}${endpoint}/${petitionId}?populate=signatures,comments`, axiosConfig);
    var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig)).data;
    var temp = response.data.data.attributes.signatures.data;
    temp.push(user[0]);
    const petitionUpdate = {
        data: {
            headline: response.data.data.attributes.headline,
            content: response.data.data.attributes.content,
            comments: response.data.data.attributes.comments,
            signatures: temp,
            description:response.data.data.attributes.description
        }
    }
    try {
        var signPetition = await axios.put(`${apiUrl}${endpoint}/${petitionId}`, petitionUpdate, axiosConfig);
        res.redirect('/platform/public-forum/' + petitionId);
    } catch (error) {
        console.error("Error Signing: ", error.response.data);
        res.status(500).send("Error while signing.");
    }
})

router.get('/notice', (req, res) => {
    res.render("platform/pages/notice");
}) ;

router.post('/feedback', (req, res) => {
    // console.log(req.body);
    const mailOptions = {
      from: `Feedback Report <${process.env.TECHMAIL_ID}>`,
      to: process.env.FEEDBACK_LIST,
      cc:req.user._json.email,
      subject: "Feedback for page "+req.body.feedbackPage,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Template</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  border-radius: 10px;
                  background-color: #ffffff;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              h1 {
                  text-align: center;
                  color: #0078be;
                  margin-bottom: 20px;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
              }
              table, th, td {
                  border: 1px solid #ddd;
              }
              th, td {
                  padding: 8px;
                  text-align: left;
              }
              th {
                  background-color: #f2f2f2;
              }
              .greeting {
                  color: #0078be;
                  font-size: 1.2em;
                  text-align: center;
                  margin-bottom: 20px;
              }
          </style>
      </head>
      <body>
      <div class="container">
      <h1>Confirmation of Feedback Receipt</h1>
      <p class="greeting">Dear member,<hr/><br> This mail is to inform you of a receipt of feedback from ${req.user._json.name}. Please provide necessary support to the member or mark the bug to be solved. <br/><br/>Thank you for the cooperation.</p>
      <table>
          <tr>
              <th>Field</th>
              <th>Value</th>
          </tr>
          <tr>
              <td>Name</td>
              <td>${req.user._json.name}</td>
          </tr>
          <tr>
              <td>Email</td>
              <td>${req.user._json.email}</td>
          </tr>
          <tr>
              <td>Date Reported</td>
              <td">${helpers.borrowDate(new Date())}</td>
          </tr>
          <tr>
              <td>Feedback Page</td>
              <td">${req.body.feedbackPage}</td>
          </tr>
          <tr>
              <td>Feedback/Bug</td>
              <td>${req.body.feedbackMessage}</td>
          </tr>
      </table>
  </div>
      </body>
      </html>
      
      `,
      replyTo:req.user._json.email,
    };
    // Send the email
    transporterTECH.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error occurred:', error.message);
          return res.sendStatus(400);
      }
      console.log('Email sent successfully!', info.messageId);
      res.sendStatus(202);
  });
}) ;




router.get('/profile', (req, res) => {
    userEmail = req.user._json.email;
    axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}`,axiosConfig)
    .then((response) => {
      // Assuming you get a single user with the specified email
      user = response.data[0];
      res.render("platform/pages/profile",{user:user})

      
    })
    .catch((error) => {
      console.error('Error fetching user:', error);
      // Handle error
    });
});

const options = ["Inductions", "Lost and Found", "Jobs and Internships", "Surveys", "Campaigns", "Fundraisers", "Events and Invitations", "Promotions"];


router.get('/sg-compose', async(req, res) => {
  userEmail = req.user._json.email;
    axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}`,axiosConfig)
    .then((response) => {
      // Assuming you get a single user with the specified email
      user = response.data[0];
      res.render("platform/pages/sg-compose",{phone:user.phone});
    })
    .catch((error) => {
      console.error('Error fetching user:', error);
      // Handle error
    });
});


router.get('/sg-compose-outbox', async(req, res) => {
  userEmail = req.user._json.email;
    axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}&populate=sg_mails`,axiosConfig)
    .then((response) => {
      // Assuming you get a single user with the specified email
      user = response.data[0];
      res.render("platform/pages/sg-compose-outbox",{phone:user.phone,mails:user.sg_mails});
    })
    .catch((error) => {
      console.error('Error fetching user:', error);
      // Handle error
    });
});


router.get('/sg-compose/dashboard', async(req, res) => {
  try {
    // console.log(mails)
    if(process.env.HOR_MEMBERS_LIST.includes(req.user._json.email)){
      var endpoint = '/sg-mails';
    var response = await axios.get(`${apiUrl}${endpoint}?populate=sender&pagination[pageSize]=${3000}`, axiosConfig);
    mails = response.data.data;
      res.render("platform/pages/sg-mails-dashboard",{mailcomposes:mails});
    }else{
      res.send("error 404");
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
});

router.post('/sg-compose', upload.array('files'), async (req, res) => {
  try {
    var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
    updateduser = user.data[0];
    updateduser.phone = req.body.phone;
    
    if (Array.isArray(req.body.recipients)) {
      req.body.recipients = req.body.recipients.join();
    } else {
      req.body.recipients = req.body.recipients;
    }

    await axios.put(`${apiUrl}/users/${user.data[0].id}`, updateduser, axiosConfig);   
    
    // Handle file uploads
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

    // Calculate total size of uploaded files
    let totalSize = 0;
    req.files.forEach(file => {
        totalSize += file.size;
    });

    // Check if total size exceeds 5MB
    if (totalSize > MAX_TOTAL_SIZE) {
        return res.status(400).send(`Total file size exceeds 10MB. Your files total: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`);
    }
    const attachment_path = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const response = await drive.files.create({
          requestBody: {
            name: file.originalname,
            mimeType: file.mimetype,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path),
          },
        });

        // Make the file publicly accessible
        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        const result = await drive.files.get({
          fileId: response.data.id,
          fields: 'webViewLink, webContentLink',
        });

        attachment_path.push(result.data.webViewLink);

        // Delete the temporary file
        fs.unlinkSync(file.path);
      }
    }
    
    // Add file links to the request body
    req.body.attachment_path = attachment_path.join(',');
    delete req.body.phone;

    // console.log(req.body);
    var aliasvalid = options.includes(req.body.alias) ? true : false;
    if(!aliasvalid){
      res.send("Invalid Alias");
    }
    else{

    req.body.status = "pending";
    req.body.sender = updateduser;

    const response = await axios.post(`${process.env.STRAPI_API_URL}/sg-mails`, { data: req.body }, axiosConfig);
    res.redirect("/platform/sg-compose-outbox");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred in your submission.");
  }
});

// TODO: Move to a separate file
function extractFileIds(attachment_path) {
  if (!attachment_path) return [];

  const links = attachment_path.split(',');
  
  return links.map(link => {
      // Extract file ID from various forms of Google Drive links
      const patterns = [
          /\/file\/d\/([^\/]+)/,  // matches /file/d/{fileId}
          /id=([^&]+)/,           // matches id={fileId}
          /\/([^\/]+)\/view/      // matches /{fileId}/view
      ];

      for (let pattern of patterns) {
          const match = link.match(pattern);
          if (match && match[1]) {
              return match[1];
          }
      }

      console.warn(`Could not extract file ID from link: ${link}`);
      return null;
  }).filter(id => id !== null);
}

router.post('/sg-approved', async(req, res) => {
  mailhtml = req.body.mail_body;
  mailhtml += `<br/><p style="color:rgb(177, 58, 58);font-size:12px;">${req.body.name} used  <a href="https://sg.ashoka.edu.in/platform/sg-compose">SG Compose</a>, because emails deserve a little tech flair — courtesy of the Ministry of Technology.</p>`;
  delete req.body.name;
  var aliasvalid = options.includes(req.body.alias) ? true : false;
  if(!aliasvalid){
    res.send("Invalid Alias").status(400);
    console.log("invalid")
  }
  else{
// Create an array to store attachment objects
// Extract file IDs from the attachment_path
  const attachmentIds = extractFileIds(req.body.attachment_path);
  const attachments = await Promise.all(attachmentIds.map(async (fileId, index) => {
      try {
          // Get file metadata
          const fileMetadata = await drive.files.get({ fileId: fileId, fields: 'name, mimeType' });
          
          // Get file content
          const response = await drive.files.get(
              { fileId: fileId, alt: 'media' },
              { responseType: 'stream' }
          );

          // Convert stream to buffer
          const buffers = [];
          for await (const chunk of response.data) {
              buffers.push(chunk);
          }
          const fileBuffer = Buffer.concat(buffers);

          return {
              filename: fileMetadata.data.name,
              content: fileBuffer,
              contentType: fileMetadata.data.mimeType
          };
      } catch (error) {
          console.error(`Error fetching attachment ${fileId}:`, error.message);
          return null;
      }
  }));

  // Filter out any null attachments (failed downloads)
  const validAttachments = attachments.filter(attachment => attachment !== null);
  // console.log(req.body)

  // TODO: Add req.body.recipients to the 'to' field
  const mailOptions = {
    from: req.body.alias + ` <${process.env.SGMAIL_ID}>`,
    to: req.body.recipients,
    cc: req.body.senderEmail,
    subject: req.body.subject,
    html: mailhtml,
    attachments: validAttachments
  };

  // Send the email
  try {
      await new Promise((resolve, reject) => {
        transporterSG.sendMail(mailOptions, async (error, info) => {
              if (error) {
                  console.error('Error occurred:', error.message);
                  reject(error);
              } else {
                  var approver = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
                  req.body.approver=approver.data[0];
                  req.body.status="approved";
                  await axios.put(`${apiUrl}/sg-mails/${req.body.mailid}`, { data: req.body }, axiosConfig);
                  console.log('Email sent successfully!', info.messageId);

                  resolve(info);
              }
          });
      });

      // Delete files from Google Drive
      for (const fileId of attachmentIds) {
          try {
              await drive.files.delete({ fileId: fileId });
              console.log(`File ${fileId} deleted successfully.`);
          } catch (error) {
              console.error(`Error deleting file ${fileId}:`, error.message);
          }
      }

      res.sendStatus(202);
  } catch (error) {
      console.error('Error:', error.message);
      res.sendStatus(400);
  }
  }
});


router.post('/sg-rejected', async(req, res) => {
  const attachmentIds = extractFileIds(req.body.attachment_path);
  delete req.body.name;
  let rejectReason = req.body.rejectReason;
  // TODO: Add req.body.recipients to to field
  const mailOptions = {
    from: `SG Compose <${process.env.SGMAIL_ID}>`,
    to: req.body.senderEmail,
    subject: "Email to Students Not Approved",
    text: "Dear Student, \nYour mail could not be sent to the recipients due to non-compliance with the policy. Kindly reach out to the SG for further clarification by replying to this email. \n\nReason for rejection: " + rejectReason +"\n\nSG Compose (feature by Ministry of Technology)",
    replyTo: req.user._json.email,
  };
  delete req.body.rejectReason;
  // Send the email
  try {
      await new Promise((resolve, reject) => {
        transporterSG.sendMail(mailOptions, async (error, info) => {
              if (error) {
                  console.error('Error occurred:', error.message);
                  reject(error);
              } else {
                  var approver = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
                  req.body.approver=approver.data[0];
                  req.body.status="rejected";
                  await axios.put(`${apiUrl}/sg-mails/${req.body.mailid}`, { data: req.body }, axiosConfig);
                  console.log('Email sent successfully!', info.messageId);
                  resolve(info);
              }
          });
      });

      // Delete files from Google Drive
      for (const fileId of attachmentIds) {
          try {
              await drive.files.delete({ fileId: fileId });
              console.log(`File ${fileId} deleted successfully.`);
          } catch (error) {
              console.error(`Error deleting file ${fileId}:`, error.message);
          }
      }

      res.sendStatus(202);
  } catch (error) {
      console.error('Error:', error.message);
      res.sendStatus(400);
  }
});


router.get('/grade-planner', (req, res) => {
  res.render("platform/pages/grade-planner");
});


router.get('/events', (req, res) => {
    res.render("platform/pages/events-2")
});

router.get('/event', (req, res) => {
    res.render("platform/pages/events")
});


router.get('/pool-cab', async (req, res) => {
  try{
    // Get the current date
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate());

    // Get the date 5 days from now
    let futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 5);

    let acceptableDates = [];
    for (let i = 0; i < 5; i++) {
      let date = new Date();
      date.setDate(date.getDate() + i);
      let dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      acceptableDates.push(dateString);
    }


    // Format the dates to ISO format (YYYY-MM-DD)
    let formattedCurrentDate = currentDate.toISOString().split('T')[0];
    let formattedFutureDate = futureDate.toISOString().split('T')[0];

    // Create an object with the current date and future date
    let dateRange = {
        currentDate: formattedCurrentDate,
        futureDate: formattedFutureDate
    };

    var user_filled = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&fields[0]=phone&populate=pools`, axiosConfig);
    var user_detail = user_filled.data[0].pools;
    var phone = user_filled.data[0].phone;
    var userAvailablePools=0;
    for(var i=0;i<user_detail.length;i++){
      var poolDate=new Date(user_detail[i].day);
      if(user_detail[i].status=="available" && acceptableDates.includes(`${poolDate.getMonth() + 1}/${poolDate.getDate()}/${poolDate.getFullYear()}`)){
        userAvailablePools++;
      }
    }
    if (user_detail.length == 0 || userAvailablePools==0) {
      res.render("platform/pages/pool-cab-form",{phone:phone})
    }else if(user_detail.length == 1){
      var pool_data = await axios.get(`${apiUrl}/pools?populate=pooler&pagination[pageSize]=2000&_where[day_gte]=${dateRange.currentDate}&_where[day_lt]=${dateRange.futureDate}`, axiosConfig);
      var pools = pool_data.data.data;
      // next 5 days only
      let filteredPools = pools.filter(pool => {
        let poolDate = new Date(pool.attributes.day);
        let poolDateString = `${poolDate.getMonth() + 1}/${poolDate.getDate()}/${poolDate.getFullYear()}`;
        return acceptableDates.includes(poolDateString);
      });
      res.render("platform/pages/pool-cab", {pools:filteredPools, user_detail:user_detail[0]});
    }else{
      var pool_data = await axios.get(`${apiUrl}/pools?populate=pooler&pagination[pageSize]=2000&_where[day_gte]=${dateRange.currentDate}&_where[day_lt]=${dateRange.futureDate}`, axiosConfig);
      var pools = pool_data.data.data;
      // next 5 days only
      let filteredPools = pools.filter(pool => {
        let poolDate = new Date(pool.attributes.day);
        let poolDateString = `${poolDate.getMonth() + 1}/${poolDate.getDate()}/${poolDate.getFullYear()}`;
        return acceptableDates.includes(poolDateString);
      });
      var i=0;
      while(i<user_detail.length && user_detail[i]!="available"){
        i++;
      }
      res.render("platform/pages/pool-cab", {pools:filteredPools, user_detail:user_detail[i-1]});
    }
  }catch(error){
    console.error('An error occurred:', error);
  }
});

router.post('/pool-submit', async(req, res) => {
  var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
  updateduser=user.data[0];
  updateduser.phone=req.body.phone;
  await axios.put(`${apiUrl}/users/${user.data[0].id}`, updateduser, axiosConfig);      
  delete req.body.phone;
  req.body.status="available";
  let parts = req.body.day.split('/');
  let formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  req.body.day=formattedDate;
  req.body.time=req.body.time + ":00.000"
  req.body.pooler=updateduser;
  axios.post(`${process.env.STRAPI_API_URL}/pools`,{data:req.body}, axiosConfig)
        .then((response) => {
          res.redirect("/platform/pool-cab")
        })
        .catch((error) => {
            console.log(error)
            res.send("An error occurred");
        });
});

router.post('/update-pool', async(req, res) => {
  var pool = (await axios.get(`${apiUrl}/pools/${atob(req.body.pool_id)}`, axiosConfig));
  updatedPool = pool.data.data;
  updatedPool.attributes.time= req.body.time + ":00.000";
  updatedPool.attributes.status=req.body.status;
  await axios.put(`${apiUrl}/pools/${atob(req.body.pool_id)}`, {data:updatedPool.attributes}, axiosConfig);
  res.redirect("/platform/pool-cab")     
});

router.get('/resources', async(req, res) => {
  var resources = (await axios.get(`${apiUrl}/resources`, axiosConfig));
  res.render("platform/pages/resources",{cards:resources.data.data});  
});

router.get('/semester-planner', async(req, res) => {
  arr = JSON.parse(fs.readFileSync('./data/timetable-planner2.json', 'utf8'));
  let obj=arr[0]; // get date and time last data fetched
  arr.shift(); // delete that from the array so as to keep only courses
  res.render("platform/pages/semester-planner",{courses:arr,obj:obj});  
});

router.get('/mail-spam-filter', async(req, res) => {
  data = JSON.parse(fs.readFileSync('./data/emails.json', 'utf8'));
  res.render("platform/pages/mail-spam-filter", {data: data, selectedEmails: []});
});

router.get('/cancel-cab-pool', async(req, res) => {
  userEmail=req.user._json.email;
  // var pool = (await axios.get(`${apiUrl}/pools?[pooler][email]=${userEmail}&filters[status][$eqi]=available`, axiosConfig));
  // console.log(pool.data.data);
  var userpools = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=pools`, axiosConfig);
  // console.log(userpools.data[0].pools);
  obj=[];
  for(var i=0;i<userpools.data[0].pools.length;i++){
    if(userpools.data[0].pools[i].status=="available"){
      obj.push(userpools.data[0].pools[i]);
    }
  };
  if(obj.length!=0){
    canceled=obj[0];
    // console.log(obj);
    id=(obj[0].id);
    canceled.status="canceled";
    delete canceled.id;
    delete canceled.createdAt;
    delete canceled.updatedAt;
    // console.log(canceled)
    await axios.put(`${apiUrl}/pools/${id}`, {data:canceled}, axiosConfig);
  }
  res.redirect("/platform/")   
});


router.get('/office-hours', async(req, res) => {
  res.render("platform/pages/office-hours")
});

router.get('/cgpa-planner', async(req, res) => {
  var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
  var cgpa_data=user.data[0].cgpa_data;
  var pf_credits=user.data[0].pf_credits || 0;
  if(cgpa_data==null){
    res.render("platform/pages/cgpa-planner-form");
  }else{
    res.render("platform/pages/cgpa-planner2",{cgpa_data:cgpa_data,pf_credits:pf_credits})
  }
});

router.post('/cgpa-planner', async(req, res) => {
  // console.log(req.body);
  var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
  updateduser=user.data[0];
  updateduser.cgpa_data=req.body.cgpa_data;
  updateduser.pf_credits=req.body.pf_credits || 0;
  await axios.put(`${apiUrl}/users/${user.data[0].id}`, updateduser, axiosConfig);
  // res.redirect("/platform/cgpa-planner");
  res.sendStatus(202)
});

router.get('/cgpa-planner-reset', async(req, res) => {
  // console.log(req.body);
  var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
  updateduser=user.data[0];
  updateduser.cgpa_data=null;
  updateduser.pf_credits=null;
  await axios.put(`${apiUrl}/users/${user.data[0].id}`, updateduser, axiosConfig);
  res.redirect("/platform/cgpa-planner");
});

router.get('/clubs-socs-catalogue', async(req, res) => {
  var clubs = (await axios.get(`${apiUrl}/clubs`, axiosConfig));
  var societies = (await axios.get(`${apiUrl}/societies`, axiosConfig));
  res.render("platform/pages/clubs-socs-catalogue",{clubs:clubs.data.data,societies:societies.data.data});
});

router.get('/clubs-socs-catalogue/:id', async(req, res) => {
  var organisation = (await axios.get(`${apiUrl}/clubs/${req.params.id}`, axiosConfig));
  res.render("platform/pages/club-soc",{club:organisation.data});
});

router.get('/pool-service', async (req, res) => {
  try{
    var user_filled = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&fields[0]=phone&populate=services`, axiosConfig);
    var user_services = user_filled.data[0].services;
    var phone = user_filled.data[0].phone;
    const currentDate = new Date().toISOString().split('T')[0];
    var userActiveServices=0;
    for(var i=0;i<user_services.length;i++){
      var endDate=new Date(user_services[i].end);
      if(user_services[i].status=="open" && new Date() < endDate.setDate(endDate.getDate() + 1)){
        userActiveServices++;
      }
    }
    if (user_services.length == 0 || userActiveServices==0) {
        res.render("platform/pages/pool-service-form",{phone:phone,currentDate:currentDate})
    }
    else if(user_services.length == 1 || userActiveServices==1){
      var services_data = await axios.get(`${apiUrl}/services?populate=user&pagination[pageSize]=2000&_where[end_lte]=${new Date()}`, axiosConfig);
      services_data = services_data.data.data;
      res.render("platform/pages/pool-service", {services:services_data, user_services:user_services[0]});
    }else{
      var services_data = await axios.get(`${apiUrl}/services?populate=user&pagination[pageSize]=2000&_where[end_lte]=${new Date()}`, axiosConfig);
      services_data = services_data.data.data;    
      var i=0;
      while(i<user_services.length && user_services[i]!="open"){
        i++;
      }
      res.render("platform/pages/pool-service", {services:services_data, user_services:user_services[i-1]});
    }
  }catch(error){
    console.error('An error occurred:', error);
  }
});


router.get('/cancel-pool-service', async(req, res) => {
  userEmail=req.user._json.email;
  // var pool = (await axios.get(`${apiUrl}/pools?[pooler][email]=${userEmail}&filters[status][$eqi]=available`, axiosConfig));
  // console.log(pool.data.data);
  var userservices = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=services`, axiosConfig);
  // console.log(userpools.data[0].pools);
  obj=[];
  for(var i=0;i<userservices.data[0].services.length;i++){
    if(userservices.data[0].services[i].status=="open"){
      obj.push(userservices.data[0].services[i]);
    }
  };

  if(obj.length!=0){
    canceled=obj[0];
    id=(obj[0].id);
    canceled.status="canceled";
    delete canceled.id;
    delete canceled.createdAt;
    delete canceled.updatedAt;
    await axios.put(`${apiUrl}/services/${id}`, {data:canceled}, axiosConfig);
  }
  res.redirect("/platform/")   
});

router.post('/pool-service', async(req, res) => {
  var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
  updateduser=user.data[0];
  updateduser.phone=req.body.phone;
  await axios.put(`${apiUrl}/users/${user.data[0].id}`, updateduser, axiosConfig);      
  delete req.body.phone;
  req.body.numberPeople=parseInt(req.body.numberPeople);
  req.body.status="open";
  req.body.user=updateduser;
  axios.post(`${process.env.STRAPI_API_URL}/services`,{data:req.body}, axiosConfig)
        .then((response) => {
          res.redirect("/platform/pool-service")
        })
        .catch((error) => {
            console.log(error)
            res.send("An error occurred");
        });
});

router.post('/update-pool-service', async(req, res) => {
  userEmail=req.user._json.email;
  // var pool = (await axios.get(`${apiUrl}/pools?[pooler][email]=${userEmail}&filters[status][$eqi]=available`, axiosConfig));
  // console.log(pool.data.data);
  var userservices = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=services`, axiosConfig);
  // console.log(userpools.data[0].pools);
  obj=[];
  for(var i=0;i<userservices.data[0].services.length;i++){
    if(userservices.data[0].services[i].status=="open"){
      obj.push(userservices.data[0].services[i]);
    }
  };
  if(obj.length!=0){
    updatedService=obj[0];
    id=(obj[0].id);
    updatedService.status="full";
    delete updatedService.id;
    delete updatedService.createdAt;
    delete updatedService.updatedAt;
    await axios.put(`${apiUrl}/services/${id}`, {data:updatedService}, axiosConfig);
  }
  res.redirect("/platform/");    
});

const hasDatePassed = (date) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate < currentDate;
};

router.get('/assets', async(req, res) => {
  var user_data = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig);
  var user = user_data.data[0];
  var assets = await axios.get(`${apiUrl}/assets?populate=last_borrow_request`, axiosConfig);
  assets = assets.data.data;
  res.render("platform/pages/assets",{assets:assets,user:user,hasDatePassed:hasDatePassed})
});

router.get('/assets/dashboard', async(req, res) => {
  if(process.env.BORROW_POC.includes(req.user._json.email)){
    var borrow_data = await axios.get(`${apiUrl}/borrow-requests?populate=user&populate=asset`, axiosConfig);
    // console.log(borrow_data.data.data);
    res.render("platform/pages/assets-dashboard",{requests:borrow_data.data.data});
  }else{
    res.send("error 404")
  }
});

router.get('/assets/accept/:id', async(req, res) => {
  if(process.env.BORROW_POC.includes(req.user._json.email)){
    var borrow_data = await axios.get(`${apiUrl}/borrow-requests/${req.params.id}`, axiosConfig);
    temp = borrow_data.data.data.attributes;
    var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
    user=user.data[0];
    id=user.id;
    temp.issued=1;
    temp.issued_by=[id];
    temp.issued_on=new Date();
    await axios.put(`${apiUrl}/borrow-requests/${req.params.id}`, {data:temp}, axiosConfig);      
    res.redirect("/platform/assets/dashboard");
  }
});

router.get('/assets/reject/:id', async(req, res) => {
  if(process.env.BORROW_POC.includes(req.user._json.email)){
    var borrow_data = await axios.get(`${apiUrl}/borrow-requests/${req.params.id}`, axiosConfig);
    temp = borrow_data.data.data.attributes;
    var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
    user=user.data[0];
    temp.returned=1;
    temp.to=null;
    temp.from=null;
    temp.issued=0;
    await axios.put(`${apiUrl}/borrow-requests/${req.params.id}`, {data:temp}, axiosConfig);      
    res.redirect("/platform/assets/dashboard");
  }
});
router.get('/assets/returned/:id', async(req, res) => {
  if(process.env.BORROW_POC.includes(req.user._json.email)){
    var borrow_data = await axios.get(`${apiUrl}/borrow-requests/${req.params.id}`, axiosConfig);
    temp = borrow_data.data.data.attributes;
    var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
    user=user.data[0];
    id=user.id;
    temp.returned=1;
    temp.returned_to=[id];
    temp.returned_on=new Date();
    temp.is_the_latest_booking_of=[];
    await axios.put(`${apiUrl}/borrow-requests/${req.params.id}`, {data:temp}, axiosConfig);      
    res.redirect("/platform/assets/dashboard");
  }
});

// router.get('/treasure-hunt', async(req, res) => {
//   var user_data = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=hunt_team`, axiosConfig);
//   var user = user_data.data[0];
//   if(user.hunt_team==null){
//     res.render("platform/pages/hunt-error",{message:"You are not registered for the hunt. Please contact the body conducting your event."});
//   }else{
//     res.redirect("/platform/treasure-hunt/"+user.hunt_team.id)
//   }
// });

// router.get('/treasure-hunt/:team', async(req, res) => {
//   var user_data = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=hunt_team`, axiosConfig);
//   var user = user_data.data[0];
//   if(user.hunt_team!=null && req.params.team==user.hunt_team.id){
//     // console.log(user);
//     var team_data = await axios.get(`${apiUrl}/hunt-teams/${req.params.team}?populate[0]=members&populate[1]=treasure_hunt&populate[2]=hints_claimed_by&populate[3]=hints_claimed_for`, axiosConfig);
//     var rank_data = await axios.get(`${apiUrl}/hunt-teams?filters[treasure_hunt][id][$eqi]=${team_data.data.data.attributes.treasure_hunt.data.id}&populate[0]=members&populate[1]=treasure_hunt&populate[2]=hints_claimed_by&populate[3]=hints_claimed_for`, axiosConfig);
//     var memberString="";
//     var hintsClaimedByString="";
    
//     teamsArray=rank_data.data.data;

//         // Assuming teamsArray is the array containing the team objects
//     const rankedTeams = teamsArray.sort((a, b) => {
//       // First, compare by clues solved (descending)
//       if (b.attributes.clues_solved !== a.attributes.clues_solved) {
//         return b.attributes.clues_solved - a.attributes.clues_solved;
//       }
//       // If clues solved are the same, compare by updatedAt (ascending)
//       return new Date(a.attributes.updatedAt) - new Date(b.attributes.updatedAt);
//     });
    
//     var team_id=team_data.data.data.id;
//     var team_users=team_data.data.data.attributes.members.data;
//     var hint_takers=team_data.data.data.attributes.hints_claimed_by.data;
//     // prepare the list of members in a string
//     for(var i=0;i<team_users.length;i++){
//       if(i==team_users.length-1){
//         memberString+=team_users[i].attributes.username;
//       }else{
//         memberString+=team_users[i].attributes.username+", ";
//       }
//     }
    
//     for(var i=0;i<hint_takers.length;i++){
//       if(i==hint_takers.length-1){
//         hintsClaimedByString+=hint_takers[i].attributes.username;
//       }else{
//         hintsClaimedByString+=hint_takers[i].attributes.username+", ";
//       }
//     }
//     // prepare the list of members in a string
//     teamName = team_data.data.data.attributes.name;
//     clues_solved = team_data.data.data.attributes.clues_solved;
//     // console.log(team_data.data.data.attributes.treasure_hunt.data.attributes.name);
//     hunt_name=team_data.data.data.attributes.treasure_hunt.data.attributes.name;
//     hunt_id=team_data.data.data.attributes.treasure_hunt.data.id;
//     hunt_start_time=new Date(team_data.data.data.attributes.treasure_hunt.data.attributes.start_time);
//     hunt_start_time=hunt_start_time.toLocaleDateString()+" | "+hunt_start_time.toLocaleTimeString();
//     hunt_end_time=new Date(team_data.data.data.attributes.treasure_hunt.data.attributes.end_time);
//     hunt_end_time=hunt_end_time.toLocaleDateString()+" | "+hunt_end_time.toLocaleTimeString();
//     hints_claimed=team_data.data.data.attributes.hints_claimed;

//     var hintsTakenFor=[];
//     team_data.data.data.attributes.hints_claimed_for.data.forEach(function(hint){
//       hintsTakenFor.push(hint.id)
//     })

//     var hunt = {
//       hunt_id,
//       hunt_name,
//       hunt_start_time,
//       hunt_end_time,
//       rankedTeams
//     }
//     var rank=1;
//     for(var i=0;i<rankedTeams.length;i++){
//       if(rankedTeams[i].id==team_id){
//         break;
//       }
//       rank++;
//     }
//     // console.log(rankedTeams)
//     var team = {
//       rank:rank,
//       teamName,
//       memberString,
//       hints_claimed,
//       hintsClaimedByString,
//       hintsTakenFor,
//       clues_solved
//     }
//     var clues_data = await axios.get(`${apiUrl}/hunt-clues?filters[treasure_hunt][id][$eqi]=${team_data.data.data.attributes.treasure_hunt.data.id}`, axiosConfig);
//     clues_data = clues_data.data.data;
//     var totalClues=clues_data.length;
//     clues_data = clues_data.filter(function(obj){
//        return obj.attributes.clue_number  <= clues_solved+1;
//     });

//     // get clues, where treasure_hunt = id, 
//     // & filter out first clues_solved+1 clues using clue_number. 
//     var completed=false;
//     if(clues_solved==totalClues){
//       completed=true;
//     } 
//     // console.log("hints taken for",hintsTakenFor);
//     // console.log("clues",clues_data);
//     // for(var i=clues_data.length-1;i>=0;i--){
//     //   if(hintsTakenFor.includes(clues_data[i].id)){
//     //     console.log("i",i,"clue id",clues_data[i].id)
//     //   }
//     // }
//     res.render("platform/pages/hunt-team",{team:team,hunt:hunt,clues:clues_data,completed:completed});
//   }else{
//     res.redirect("/platform/treasure-hunt");
//   }
// });

// router.get('/claim-hints/:hunt/:clue', async(req, res) => {
//   var user_data = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate[hunt_team][populate][hints_claimed_by]=*&populate[hunt_team][populate][hints_claimed_for]=*`, axiosConfig);
//   user_data=user_data.data[0];
//   // console.log(user_data.hunt_team.hints_claimed_for);
//   var hintsTakenFor=[];
//   user_data.hunt_team.hints_claimed_for.forEach(function(clue){
//     hintsTakenFor.push(clue.id)
//   })

//   if(user_data.hunt_team.hints_claimed<2 && !hintsTakenFor.includes(req.params.clue)){
//     // update it to +1
//     var obj=user_data.hunt_team;
//     obj.hints_claimed=obj.hints_claimed+1;
//     obj.hints_claimed_for.push(parseInt(req.params.clue));
//     obj.hints_claimed_by.push(parseInt(user_data.id));
//     // console.log(obj)
//     await axios.put(`${apiUrl}/hunt-teams/${user_data.hunt_team.id}`, {data:obj}, axiosConfig);  
//     res.redirect("/platform/treasure-hunt");
//   }else{
//     res.redirect("/platform/treasure-hunt");
//   }
// });

// router.get('/location/:hunt/:number', async(req, res) => {
//   // console.log(req.params.number,req.query.code);
//   var user_data = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate[hunt_team][populate][treasure_hunt]=*`, axiosConfig);
//   var user = user_data.data[0];
//   // console.log(user);
//   if(user.hunt_team.treasure_hunt.id!=parseInt(req.params.hunt)){
//     res.redirect("/platform/location/"+user.hunt_team.treasure_hunt.id+"/"+req.params.number);
//   }else{
//       if(req.params.number<=user.hunt_team.clues_solved){
//         res.render("platform/pages/hunt-error",{message:"You've already solved this clue."});
//       }else if(req.params.number==user.hunt_team.clues_solved+1){
//         var clues_data = await axios.get(`${apiUrl}/hunt-clues?filters[treasure_hunt][id][$eqi]=${req.params.hunt}&filters[clue_number][$eqi]=${req.params.number}`, axiosConfig);
//         // console.log(clues_data.data.data)

//         if(clues_data.data.data.length==1){
//           var clue=clues_data.data.data[0];
//           // console.log(clues_data.data.data)
//           if(req.query.code==clue.attributes.clue_code){
//             var obj=await axios.get(`${apiUrl}/hunt-teams/${user.hunt_team.id}`, axiosConfig);  
//             obj = obj.data.data;
//             obj.attributes.clues_solved=obj.attributes.clues_solved+1;
//             obj.attributes.id =obj.id;
//             obj=obj.attributes;
//             // obj.clues_solved=obj.clues_solved+1;
//             lol =await axios.put(`${apiUrl}/hunt-teams/${user.hunt_team.id}`, {data:obj}, axiosConfig);  
//             // console.log(lol);
//             res.redirect("/platform/treasure-hunt");
//           }else{
//             res.render("platform/pages/hunt-error",{message:"The QR Code is not rightly scanned. The clue code is missing/incorrect. Only scanning the QR code will allow you to pass."});
//           }
//         }
//       }else{
//         res.render("platform/pages/hunt-error",{message:"You'll need to solve the previous clues first."});
//       }
//   }
// });



router.post('/assets', async(req, res) => {
  var user = (await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}`, axiosConfig));
  updateduser=user.data[0];
  updateduser.phone=req.body.phone;
  await axios.put(`${apiUrl}/users/${user.data[0].id}`, updateduser, axiosConfig);      
  // console.log(req.body);

  req.body.asset=parseInt(req.body.asset);
  req.body.user=updateduser;
  req.body.from=new Date().toISOString().split('T')[0];
  req.body.issued=0;
  req.body.returned=0;
  req.body.is_the_latest_booking_of=parseInt(req.body.asset);
  var assetData = await axios.get(`${apiUrl}/assets/${req.body.asset}?populate=last_borrow_request`, axiosConfig);
  if(assetData.data.data.attributes.last_borrow_request.data==null || (assetData && hasDatePassed(assetData.data.data.attributes.last_borrow_request.data.attributes.to))){
    axios.post(`${process.env.STRAPI_API_URL}/borrow-requests`,{data:req.body}, axiosConfig)
        .then((response) => {
            // from here is left in assets: mail the ministry member and the user
            // of the request

            const mailOptions = {
              from: `Borrow Assets <${process.env.TECHMAIL_ID}>`,
              to: process.env.BORROW_POC,
              cc:req.user._json.email,
              subject: "Request to borrow asset "+assetData.data.data.attributes.name+" from "+helpers.borrowDate(new Date(req.body.from))+" to "+helpers.borrowDate(new Date(req.body.to)),
              html: `
                <!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Email Template</title>
                      <style>
                          body {
                              font-family: Arial, sans-serif;
                              line-height: 1.6;
                              background-color: #f4f4f4;
                              margin: 0;
                              padding: 0;
                          }
                          .container {
                              max-width: 600px;
                              margin: 0 auto;
                              padding: 20px;
                              border-radius: 10px;
                              background-color: #ffffff;
                              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                          }
                          h1 {
                              text-align: center;
                              color: #0078be;
                              margin-bottom: 20px;
                          }
                          table {
                              width: 100%;
                              border-collapse: collapse;
                              margin-bottom: 20px;
                          }
                          table, th, td {
                              border: 1px solid #ddd;
                          }
                          th, td {
                              padding: 8px;
                              text-align: left;
                          }
                          th {
                              background-color: #f2f2f2;
                          }
                          .greeting {
                              color: #0078be;
                              font-size: 1.2em;
                              text-align: center;
                              margin-bottom: 20px;
                          }
                          .undertaking {
                              font-family: Arial, sans-serif;
                              color: #333;
                              font-size: 12px;
                              line-height: 1.6;
                          }
                          .undertaking h2 {
                              color: #b55050;
                              text-align: center;
                              margin-bottom: 18px;
                              font-size: 14px;
                          }
                          .undertaking h3 {
                              color: #b55050;
                              margin-bottom: 6px;
                              font-size: 13px;
                          }
                          .undertaking ul {
                              font-size: 12px;
                              margin-bottom: 12px;
                          }
                          .undertaking p {
                              font-size: 12px;
                              margin-bottom: 12px;
                          }
                      </style>
                  </head>
                  <body>
                      <div class="container">
                          <h1>Confirmation of Request Receipt</h1>
                          <p class="greeting">Dear Ministry member,<hr/><br> This message is to inform you of a receipt of request to borrow a device. <br/>Should you believe as per the ministry's policy the student qualifies to get the borrowed device for the period, we request your support in extending to them the service of the device. <br/><br/>Thank you for your trust and cooperation.</p>
                          <table>
                              <tr>
                                  <th>Field</th>
                                  <th>Value</th>
                              </tr>
                              <tr>
                                  <td>Name</td>
                                  <td>${req.user._json.name}</td>
                              </tr>
                              <tr>
                                  <td>Email</td>
                                  <td>${req.user._json.email}</td>
                              </tr>
                              <tr>
                                  <td>From</td>
                                  <td>${helpers.borrowDate(new Date(req.body.from))}</td>
                              </tr>
                              <tr>
                                  <td>To</td>
                                  <td>${helpers.borrowDate(new Date(req.body.to))}</td>
                              </tr>
                              <tr>
                                  <td>Phone</td>
                                  <td>${req.body.phone}</td>
                              </tr>
                              <tr>
                                  <td>Reason</td>
                                  <td>${req.body.reason}</td>
                              </tr>
                              <tr>
                                  <td>Device ID</td>
                                  <td>${req.body.asset}</td>
                              </tr>
                              <tr>
                                  <td>Device Name</td>
                                  <td>${req.body.deviceName}</td>
                              </tr>
                              <tr>
                                  <td>Device Type</td>
                                  <td>${req.body.deviceType}</td>
                              </tr>
                              <tr>
                                  <td>Device Description</td>
                                  <td>${req.body.deviceDescription}</td>
                              </tr>
                              <tr>
                                  <td>Status</td>
                                  <td>Pending</td>
                              </tr>
                              <tr>
                                  <td>Date and Time of Request</td>
                                  <td>${helpers.formatDate(new Date())}</td>
                              </tr>
                          </table>
                          <br />
                          <hr/>
                          <br />
                          <!-- Undertaking Section -->
                          <div class="undertaking">
                              <h2>Undertaking for Borrowing Devices</h2>
                              <p>I, <strong>${req.user._json.name}</strong>, a student of Ashoka University, hereby agree to the following terms and conditions for borrowing devices from the Ministry of Technology:</p>
                              
                              <h3>Purpose and Use:</h3>
                              <ul>
                                  <li>I understand that the device borrowed is intended solely for my personal use in emergency situations or when I do not have access to my own device.</li>
                                  <li>I will use the device responsibly and in accordance with all applicable university policies.</li>
                              </ul>

                              <h3>Borrowing Period:</h3>
                              <ul>
                                  <li>I am borrowing the device from <strong>${helpers.borrowDate(new Date(req.body.from))}</strong> to <strong>${helpers.borrowDate(new Date(req.body.to))}</strong>, not exceeding the maximum borrowing period of two weeks.</li>
                                  <li>I understand that I must return the device by the specified end date unless an extension is granted by the Ministry of Technology.</li>
                              </ul>

                              <h3>Condition of the Device:</h3>
                              <ul>
                                  <li>I acknowledge that the device is in good working condition at the time of borrowing.</li>
                                  <li>I will return the device in the same condition as it was provided to me, excluding normal wear and tear.</li>
                              </ul>

                              <h3>Liability for Damage or Loss:</h3>
                              <ul>
                                  <li>I am responsible for any damage to the device while it is in my possession.</li>
                                  <li>In case of damage, I agree to cover the full cost of repair.</li>
                                  <li>In case of loss, I agree to reimburse the full replacement value of the device to the Student Life Office, Ashoka University.</li>
                              </ul>

                              <h3>Safety and Security:</h3>
                              <ul>
                                  <li>I will take all necessary precautions to protect the device from theft, damage, or loss.</li>
                                  <li>I will not lend the device to any other individual.</li>
                              </ul>

                              <h3>Return of Device:</h3>
                              <ul>
                                  <li>I will return the device to the Ministry of Technology office by the specified end date.</li>
                                  <li>I will ensure that all personal data is removed from the device before returning it.</li>
                              </ul>

                              <h3>Acknowledgment of Responsibility:</h3>
                              <p>I understand that failure to return the device on time, or returning it in a damaged condition, may result in penalties, including the suspension of borrowing privileges and additional disciplinary actions as deemed appropriate by the university.</p>

                              <h3>Borrower’s Details:</h3>
                              <p><strong>Full Name:</strong> ${req.user._json.name}</p>
                              <p><strong>Contact Number:</strong> ${req.body.phone}</p>
                              <p><strong>Email Address:</strong> ${req.user._json.email}</p>

                              <h3>Device Details:</h3>
                              <p><strong>Device Name:</strong> ${req.body.deviceName}</p>
                              <p><strong>Device Type:</strong> ${req.body.deviceType}</p>
                              <p><strong>Device ID:</strong> ${req.body.asset}</p>
                              <p><strong>Device Description:</strong> ${req.body.deviceDescription}</p>

                              <p>By signing this undertaking hereby submitting the form, I acknowledge that I have read, understood, and agree to abide by the terms and conditions stated above.</p>
                          </div>
                      </div>
                  </body>
                  </html>

              `,
              replyTo:req.user._json.email,
            };

          transporterTECH.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error occurred:', error.message);
                return res.sendStatus(400);
            }
            console.log('Email sent successfully!', info.messageId);
         });
        res.redirect("/platform/assets");
        })
        .catch((error) => {
            console.log(error)
            res.send("An error occurred");
        });
    await axios.put(`${apiUrl}/assets/${req.body.asset}`, {"data":{booked_until:req.body.to}}, axiosConfig);      
  }else{
    res.send("Booked already");
  }
  // also email the student with the undertaking and a ministry member attached

});



// router.get('/shuttle-service', async (req, res) => {
//   var user_filled = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=bids`, axiosConfig);
//   if (user_filled.data[0].bids.length == 0) {
//     res.render("platform/pages/shuttle-service")
//   }else{
//     res.render("platform/pages/pool-cab");
//   }
// });

// Export the router
module.exports = router;