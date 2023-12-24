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


router.get('/course-review', (req, res) => {
    res.render("platform/pages/course-reviews");
});

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
  
  axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}`)
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
    axios.get(`${process.env.STRAPI_API_URL}/users?filters[email][$eqi]=${userEmail}`)
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

router.get('/course-wise', (req, res) => {
  res.render("platform/pages/course-wise")
});

router.get('/prof-wise', (req, res) => {
  res.render("platform/pages/prof-wise")
});

// Export the router
module.exports = router;