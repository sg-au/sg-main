const express = require('express');
const router = express.Router();

const axios=require("axios");

const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers if required by your Strapi API
      'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
    },
};
const apiUrl = process.env.STRAPI_API_URL;



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
    axios.get(`${process.env.STRAPI_API_URL}/departments`,axiosConfig)
    .then((response) => {
        // Access the response data
        const departmentsData = response.data.data;
        // You can work with departmentsData here
        res.render("platform/pages/create-ticket",{departments:departmentsData});

    })
    .catch((error) => {
        console.error('Error fetching departments:', error);
        // Handle error
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
        var response = await axios.get(`${apiUrl}${endpoint}?populate=signatures,department`, axiosConfig);
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
        var response = await axios.get(`${apiUrl}${endpoint}/${petitionID}?populate=signatures,comments,department`, axiosConfig);
        var comments = await axios.get(`${apiUrl}${com_endpoint}?populate=author,forum`, axiosConfig);
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
    var com_endpoint = '/comments';
    var petitionId = Number(req.body.petitionId);
    var commentContent = req.body.commentContent;
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

// Export the router
module.exports = router;