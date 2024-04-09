const express = require('express');
const router = express.Router();
const transporter = require("../config/nodemailer-config"); // Import the Nodemailer configuration module
const fs = require('fs');
const publicTicketCategories = JSON.parse(fs.readFileSync('./data/public-tickets-all.json', 'utf8'));

const axios=require("axios");

const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers if required by your Strapi API
      'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
    },
};


const apiUrl = process.env.STRAPI_API_URL;

function createTicketId(prefix, length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < length; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${prefix}-${randomPart}`;
}



// Parse incoming request bodies as JSON
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// Define routes here
router.get('/', (req, res) => {
    res.render("platform/pages/index")
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
  const maxCoursesToLoad = 2500;
  axios.get(`${process.env.STRAPI_API_URL}/courses?fields[0]=courseCode&fields[1]=courseTitle&fields[2]=semester&fields[3]=year&populate[0]=faculties&populate[1]=course_reviews&populate[2]=reviews&pagination[pageSize]=${maxCoursesToLoad}&filters[$or][0][year][$eq]=2022&filters[$or][1][year][$eq]=2023&sort[0]=year:desc`, axiosConfig)
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
    const ticketId= createTicketId('SG', 8);
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
              <td>${(new Date()).toLocaleDateString()} ${(new Date()).toLocaleTimeString()}</td>
          </tr>
      </table>
  </div>
      </body>
      </html>
      
      `,
      replyTo:req.user._json.email
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
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


router.get('/events', (req, res) => {
    res.render("platform/pages/events-2")
});

router.get('/event', (req, res) => {
    res.render("platform/pages/events")
});

router.get('/prof-wise', (req, res) => {
  res.render("platform/pages/prof-wise")
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

    var user_filled = await axios.get(`${apiUrl}/users?filters[email][$eqi]=${req.user._json.email}&populate=pools`, axiosConfig);
    var user_detail = user_filled.data[0].pools;
    var userAvailablePools=0;
    for(var i=0;i<user_detail.length;i++){
      var poolDate=new Date(user_detail[i].day);
      if(user_detail[i].status=="available" && acceptableDates.includes(`${poolDate.getMonth() + 1}/${poolDate.getDate()}/${poolDate.getFullYear()}`)){
        userAvailablePools++;
      }
    }
    if (user_detail.length == 0 || userAvailablePools==0) {
      res.render("platform/pages/pool-cab-form")
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


router.get('/raju-img', async(req, res) => {
  res.sendFile("./data/raju.png");  
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



// TESTING EMAIL SEND:

let imageContent = fs.readFileSync('/Users/ibrahimkhalil/Desktop/raju.png');

// Convert the image to a base64 string
let imageBase64 = imageContent.toString('base64');

const mailOptions = {
  from: `Public Ticket System <${process.env.SGMAIL_ID}>`,
  to: "ibrahim.khalil_ug25@ashoka.edu.in",
  subject: "Introducing a New System for Faster and More Efficient Communication",
  attachments: [{
    content: imageContent,
    cid: 'image'
  }],
  html: `
  <!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title> Welcome to [Coded Mails] </title>
  <!--[if !mso]><!-- -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style>
  <!--[if mso]>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
  <!--[if lte mso 11]>
        <style type="text/css">
          .mj-outlook-group-fix { width:100% !important; }
        </style>
        <![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap);
  </style>
  <!--<![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>
  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }
  </style>
  <style type="text/css">
    a,
    span,
    td,
    th {
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }
  </style>
</head>

<body style="background-color:#F4F5FB;">
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;"> Preview - Welcome to Coded Mails </div>
  <div style="background-color:#F4F5FB;">
    <!--[if mso | IE]>
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:600px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tr>
                    <td style="font-size:0px;word-break:break-word;">
                      <!--[if mso | IE]>
    
        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="5" style="vertical-align:top;height:5px;">
      
    <![endif]-->
                      <div style="height:5px;"> &nbsp; </div>
                      <!--[if mso | IE]>
    
        </td></tr></table>
      
    <![endif]-->
                    </td>
                  </tr>
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      
        <v:rect  style="width:600px;" xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false">
        <v:fill  origin="0.5, 0" position="0.5, 0" src="https://images.unsplash.com/photo-1494253109108-2e30c049369b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=600&q=80" type="tile" />
        <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
      <![endif]-->
    <div style="padding:10px;margin:10px auto;border-radius:20px;max-width:600px;
    text-align: center;">
    <div style="padding:10px;background: rgb(6,112,184,0.5);margin:10px auto;border-radius:20px;max-width:600px;
text-align: center;    ">
      <div>
        <img style="margin:auto" src="cid:image" width="400px" height="400px" alt="">
      </div> 
    </div>
  </div>
    <!--[if mso | IE]>
        </v:textbox>
      </v:rect>
    
          </td>
        </tr>
      </table>
      
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="background:#F4F5FB;background-color:#F4F5FB;margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F4F5FB;background-color:#F4F5FB;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:15px;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:570px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="background:#ffffff;background-color:#ffffff;margin:0px auto;border-radius:20px;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;border-radius:20px;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:600px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tr>
                    <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:Montserrat, Helvetica, Arial, sans-serif;font-size:20px;font-weight:500;line-height:30px;text-align:left;color:#8189A9;">Dear Ashoka University Students,</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:Montserrat, Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:20px;text-align:left;color:#8189A9;">You can access the Ashoka University Public Ticket System by visiting the <a href="https://sg.ashoka.edu.in/platform/create-ticket" style="color: #0078be; text-decoration: none; font-weight: 500;">Public Ticket System</a>.</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" vertical-align="middle" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                        <tr>
                          <td align="center" bgcolor="#0078be" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#0078be;" valign="middle">
                            <a href="https://sg.ashoka.edu.in/platform/create-ticket" style="display: inline-block; background: #0078be; color: #ffffff; font-family: Montserrat, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 500; line-height: 24px; margin: 0; text-decoration: none; text-transform: none; padding: 10px 25px; mso-padding-alt: 0px; border-radius: 3px;" target="_blank">Public Ticket System</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:Montserrat, Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:20px;text-align:left;color:#73788f;"><br />
                        We are excited to announce a new system that will revolutionize the way we communicate with you. In an effort to streamline communication and reduce the <b>hassle of traditional email</b>, we are introducing a new form-based system for submitting requests and inquiries to the various ministries on campus.<br /><br /><br />

                        With this new system, you will <b>no longer need to compose lengthy emails or search through your inbox for important messages.</b> Instead, you can simply fill out a form with your request, and it will be automatically routed to the appropriate ministry for action.<br /><br /><br />
                        
                        One of the key benefits of this new system is the ability to <b>receive priority replies from the ministries</b>. By using the form, your request will be flagged as high priority, ensuring that it is addressed promptly and efficiently.<br /><br /><br />
                        
                        This form is not just about <b>convenience</b>; it's also about <b>empowerment</b>. Your submissions will be structured in a way that enables the Student Government to understand the most pressing matters affecting our community and advocate for necessary changes. It generates <b>valuable data points</b> that can be utilized by the student government to effectively communicate with the administration on behalf of the student body.<br /><br /><br />
                        
                        We believe that this new system will greatly improve communication between students and the various ministries on campus, making it easier for you to get the information and assistance you need.<br /><br />
                      
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="background:#F4F5FB;background-color:#F4F5FB;margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F4F5FB;background-color:#F4F5FB;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:15px;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:570px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="background:#edeef6;background-color:#edeef6;margin:0px auto;border-radius:20px;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#edeef6;background-color:#edeef6;width:100%;border-radius:20px;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:600px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <!--[if mso | IE]>
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
      >
        <tr>
      
              <td>
            <![endif]-->
                      <!-- <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:24px;">
                              <tr>
                                <td style="font-size:0;height:24px;vertical-align:middle;width:24px;">
                                  <a href="#" target="_blank" style="color: #0078be; text-decoration: none; font-weight: 500;">
                                    <img alt="twitter-logo" height="24" src="../../../images/social/light/twitter-logo-transparent-light.png" style="border-radius:3px;display:block;" width="24">
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> -->
                      <!--[if mso | IE]>
              </td>
            
              <td>
            <![endif]-->
                      
                      <!--[if mso | IE]>
              </td>
            
              <td>
            <![endif]-->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:24px;">
                              <tr>
                                <td style="font-size:0;height:24px;vertical-align:middle;width:24px;">
                                  <a href="#" target="_blank" style="color: #0078be; text-decoration: none; font-weight: 500;">
                                    <img alt="instagram-logo" height="24" src="https://lh3.googleusercontent.com/a-/ALV-UjU8f2RKGXhQG2s-xEvjutiaLD7KZc9tm_g_04H8n1qzQ74CfNw=s80-p" style="border-radius:3px;display:block;" width="24">
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:24px;">
                              <tr>
                                <td style="font-size:0;height:24px;vertical-align:middle;width:24px;">
                                  <a href="#" target="_blank" style="color: #0078be; text-decoration: none; font-weight: 500;">
                                    <img alt="facebook-logo" height="24" src="https://lh3.googleusercontent.com/a-/ALV-UjXxGdnLORXXGJbSx6IY1Om098E3SX8xmj7i4149ip-LdzuP7Ar2=s128-p-k-rw-no" style="border-radius:3px;display:block;" width="24">
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso | IE]>
              </td>
            
              <td>
            <![endif]-->
                      <!-- <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:3px;width:24px;">
                              <tr>
                                <td style="font-size:0;height:24px;vertical-align:middle;width:24px;">
                                  <a href="#" target="_blank" style="color: #0078be; text-decoration: none; font-weight: 500;">
                                    <img alt="youtube-logo" height="24" src="../../../images/social/light/youtube-logo-transparent-light.png" style="border-radius:3px;display:block;" width="24">
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> -->
                      <!--[if mso | IE]>
              </td>
            
          </tr>
        </table>
      <![endif]-->
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:Montserrat, Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;line-height:22px;text-align:center;color:#8189A9;">© 2024 Ministry of Technology, Student Government<br>Ashoka University</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:Montserrat, Helvetica, Arial, sans-serif;font-size:14px;font-weight:400;line-height:22px;text-align:center;color:#8189A9;">Visit us at <a class="footer-link" href="https://sg.ashoka.edu.in/platform" style="color: #0078be; text-decoration: none; font-weight: 500;">sg.ashoka.edu.in</a>.</div>
                    </td>
                  </tr>
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:600px;"
            >
          <![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tr>
                    <td style="font-size:0px;word-break:break-word;">
                      <!--[if mso | IE]>
    
        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="1" style="vertical-align:top;height:1px;">
      
    <![endif]-->
                      <div style="height:1px;"> &nbsp; </div>
                      <!--[if mso | IE]>
    
        </td></tr></table>
      
    <![endif]-->
                    </td>
                  </tr>
                </table>
              </div>
              <!--[if mso | IE]>
            </td>
          
        </tr>
      
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      <![endif]-->
  </div>
</body>

</html>
  `
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error occurred:', error.message);
    res.sendStatus(400);
    return;
  }
  console.log('Email sent successfully!', info.messageId);
  res.sendStatus(202);
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