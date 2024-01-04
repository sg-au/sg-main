const express = require('express');
const router = express.Router();

// HOME

router.get('/', (req, res) => {
    res.render("website/pages/index",{ activePage: 'home' })
});

// HOME




// ABOUT 

router.get('/about', (req, res) => {
    res.render("website/pages/about",{ activePage: 'about' })
});

// ABOUT 




// HOR

router.get('/hor/about', (req, res) => {
    res.render("website/pages/hor-about",{ activePage: 'hor-about' })
});

router.get('/council', (req, res) => {
    res.render("website/pages/council",{ activePage: 'council' })
});

router.get('/hor/committees', (req, res) => {
    res.render("website/pages/hor-committees",{ activePage: 'hor-committees' })
});

// HOR



// CABINET AND MINISTRIES
router.get('/cabinet/about', (req, res) => {
    res.render("website/pages/about-cabinet",{ activePage: 'cabinet-about' })
});

router.get('/cabinet/culmin', (req, res) => {
    res.render("website/pages/JAZBAA",{ activePage: 'cabinet-culmin' })
});

router.get('/cabinet/techmin', (req, res) => {
    res.render("website/pages/TECH",{ activePage: 'cabinet-techmin' })
});

router.get('/cabinet/maa', (req, res) => {
    res.render("website/pages/MAA",{ activePage: 'cabinet-maa' })
});

router.get('/cabinet/mpa', (req, res) => {
    res.render("website/pages/MPA",{ activePage: 'cabinet-mpa' })
});

router.get('/cabinet/envmin', (req, res) => {
    res.render("website/pages/TARANG",{ activePage: 'cabinet-envmin' })
});

router.get('/cabinet/mcwb', (req, res) => {
    res.render("website/pages/CWB",{ activePage: 'cabinet-mcwb' })
});

router.get('/cabinet/clm', (req, res) => {
    res.render("website/pages/CLM",{ activePage: 'cabinet-clm' })
});

router.get('/cabinet/finance', (req, res) => {
    res.render("website/pages/FINANCE",{ activePage: 'cabinet-finance' })
});

router.get('/cabinet/mpa', (req, res) => {
    res.render("website/pages/MPA",{ activePage: 'cabinet-mpa' })
});


router.get('/cabinet/sport', (req, res) => {
    res.render("website/pages/sports",{ activePage: 'cabinet-mpa' })
});

router.get('/cabinet/tarang', (req, res) => {
    res.render("website/pages/tarang",{ activePage: 'cabinet-mpa' })
});
// CABINET AND MINISTRIES



// RESOURCES

router.get('/resources/amenities', (req, res) => {
    res.render("website/pages/amenities",{ activePage: 'resources-amenities' })
});

router.get('/resources/food', (req, res) => {
    res.render("website/pages/food",{ activePage: 'resources-food' })
});

router.get('/resources/health', (req, res) => {
    res.render("website/pages/health",{ activePage: 'resources-health' })
});

router.get('/resources/helpful-resources', (req, res) => {
    res.render("website/pages/helpful-resources",{ activePage: 'resources-helpful-resources' })
});

router.get('/resources/aura', (req, res) => {
    res.render("website/pages/aura",{ activePage: 'resources-aura' })
});


// RESOURCES


router.get('/budget', (req, res) => {
    res.render("website/pages/budget",{ activePage: 'budget' })
});

// Export the router
module.exports = router;