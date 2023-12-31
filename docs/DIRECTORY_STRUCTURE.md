# Directory Structure

This project follows a specific directory structure to organize its codebase.

- `app/` - Application-specific code and logic.
- `public/` - Static assets, including CSS, JavaScript, and images.
- `routes/` - Route-specific handlers for the application.
- `views/` - Template views for rendering pages.
- ...

Feel free to explore these directories for a better understanding of the project's organization.

.
├── README.md
├── changelog.txt
├── directory-structure.txt
├── package-lock.json
├── package.json
└── src
    ├── app.js
    ├── config
    │   ├── mongodb-config.js
    │   └── passport-config.js
    ├── public
    │   ├── platform
    │   └── website
    │       └── assets
    │           ├── css
    │           │   └── style.css
    │           ├── img
    │           │   ├── apple-touch-icon.png
    │           │   ├── ashoka.jpg
    │           │   ├── clients
    │           │   │   ├── client-1.png
    │           │   │   ├── client-2.png
    │           │   │   ├── client-3.png
    │           │   │   ├── client-4.png
    │           │   │   ├── client-5.png
    │           │   │   └── client-6.png
    │           │   ├── counts-img.svg
    │           │   ├── favicon.png
    │           │   ├── hero-img.png
    │           │   ├── illustration-6.svg
    │           │   ├── more-services-1.jpg
    │           │   ├── more-services-2.jpg
    │           │   ├── more-services-3.jpg
    │           │   ├── more-services-4.jpg
    │           │   ├── portfolio
    │           │   │   ├── portfolio-1.jpg
    │           │   │   ├── portfolio-2.jpg
    │           │   │   ├── portfolio-3.jpg
    │           │   │   ├── portfolio-4.jpg
    │           │   │   ├── portfolio-5.jpg
    │           │   │   ├── portfolio-6.jpg
    │           │   │   ├── portfolio-7.jpg
    │           │   │   ├── portfolio-8.jpg
    │           │   │   ├── portfolio-9.jpg
    │           │   │   ├── portfolio-details-1.jpg
    │           │   │   ├── portfolio-details-2.jpg
    │           │   │   └── portfolio-details-3.jpg
    │           │   ├── team
    │           │   │   ├── team-1.jpg
    │           │   │   ├── team-2.jpg
    │           │   │   ├── team-3.jpg
    │           │   │   └── team-4.jpg
    │           │   └── testimonials
    │           │       ├── testimonials-1.jpg
    │           │       ├── testimonials-2.jpg
    │           │       ├── testimonials-3.jpg
    │           │       ├── testimonials-4.jpg
    │           │       └── testimonials-5.jpg
    │           ├── js
    │           │   ├── main.js
    │           │   └── theme.js
    │           ├── scss
    │           │   ├── _footer.scss
    │           │   ├── _general.scss
    │           │   ├── _header.scss
    │           │   ├── _hero.scss
    │           │   ├── _sections.scss
    │           │   ├── _variables.scss
    │           │   └── style.scss
    │           └── vendor
    │               ├── aos
    │               │   ├── aos.css
    │               │   └── aos.js
    │               ├── bootstrap
    │               │   ├── css
    │               │   │   ├── bootstrap-grid.css
    │               │   │   ├── bootstrap-grid.css.map
    │               │   │   ├── bootstrap-grid.min.css
    │               │   │   ├── bootstrap-grid.min.css.map
    │               │   │   ├── bootstrap-grid.rtl.css
    │               │   │   ├── bootstrap-grid.rtl.css.map
    │               │   │   ├── bootstrap-grid.rtl.min.css
    │               │   │   ├── bootstrap-grid.rtl.min.css.map
    │               │   │   ├── bootstrap-reboot.css
    │               │   │   ├── bootstrap-reboot.css.map
    │               │   │   ├── bootstrap-reboot.min.css
    │               │   │   ├── bootstrap-reboot.min.css.map
    │               │   │   ├── bootstrap-reboot.rtl.css
    │               │   │   ├── bootstrap-reboot.rtl.css.map
    │               │   │   ├── bootstrap-reboot.rtl.min.css
    │               │   │   ├── bootstrap-reboot.rtl.min.css.map
    │               │   │   ├── bootstrap-utilities.css
    │               │   │   ├── bootstrap-utilities.css.map
    │               │   │   ├── bootstrap-utilities.min.css
    │               │   │   ├── bootstrap-utilities.min.css.map
    │               │   │   ├── bootstrap-utilities.rtl.css
    │               │   │   ├── bootstrap-utilities.rtl.css.map
    │               │   │   ├── bootstrap-utilities.rtl.min.css
    │               │   │   ├── bootstrap-utilities.rtl.min.css.map
    │               │   │   ├── bootstrap.css
    │               │   │   ├── bootstrap.css.map
    │               │   │   ├── bootstrap.min.css
    │               │   │   ├── bootstrap.min.css.map
    │               │   │   ├── bootstrap.rtl.css
    │               │   │   ├── bootstrap.rtl.css.map
    │               │   │   ├── bootstrap.rtl.min.css
    │               │   │   └── bootstrap.rtl.min.css.map
    │               │   └── js
    │               │       ├── bootstrap.bundle.js
    │               │       ├── bootstrap.bundle.js.map
    │               │       ├── bootstrap.bundle.min.js
    │               │       ├── bootstrap.bundle.min.js.map
    │               │       ├── bootstrap.esm.js
    │               │       ├── bootstrap.esm.js.map
    │               │       ├── bootstrap.esm.min.js
    │               │       ├── bootstrap.esm.min.js.map
    │               │       ├── bootstrap.js
    │               │       ├── bootstrap.js.map
    │               │       ├── bootstrap.min.js
    │               │       └── bootstrap.min.js.map
    │               ├── boxicons
    │               │   ├── css
    │               │   │   ├── animations.css
    │               │   │   ├── boxicons.css
    │               │   │   ├── boxicons.min.css
    │               │   │   └── transformations.css
    │               │   └── fonts
    │               │       ├── boxicons.eot
    │               │       ├── boxicons.svg
    │               │       ├── boxicons.ttf
    │               │       ├── boxicons.woff
    │               │       └── boxicons.woff2
    │               ├── counterup
    │               │   └── counterup.min.js
    │               ├── icofont
    │               │   ├── fonts
    │               │   │   ├── icofont.woff
    │               │   │   └── icofont.woff2
    │               │   └── icofont.min.css
    │               ├── isotope-layout
    │               │   ├── isotope.pkgd.js
    │               │   └── isotope.pkgd.min.js
    │               ├── jquery
    │               │   ├── jquery.min.js
    │               │   └── jquery.min.map
    │               ├── jquery.easing
    │               │   └── jquery.easing.min.js
    │               ├── owl.carousel
    │               │   ├── LICENSE
    │               │   ├── README.md
    │               │   ├── assets
    │               │   │   ├── ajax-loader.gif
    │               │   │   ├── owl.carousel.css
    │               │   │   ├── owl.carousel.min.css
    │               │   │   ├── owl.theme.default.css
    │               │   │   ├── owl.theme.default.min.css
    │               │   │   ├── owl.theme.green.css
    │               │   │   ├── owl.theme.green.min.css
    │               │   │   └── owl.video.play.png
    │               │   ├── owl.carousel.js
    │               │   └── owl.carousel.min.js
    │               ├── php-email-form
    │               │   ├── changelog.txt
    │               │   ├── php-email-form.php
    │               │   └── validate.js
    │               ├── remixicon
    │               │   ├── remixicon.css
    │               │   ├── remixicon.eot
    │               │   ├── remixicon.less
    │               │   ├── remixicon.svg
    │               │   ├── remixicon.symbol.svg
    │               │   ├── remixicon.ttf
    │               │   ├── remixicon.woff
    │               │   └── remixicon.woff2
    │               ├── venobox
    │               │   ├── venobox.css
    │               │   ├── venobox.js
    │               │   ├── venobox.min.css
    │               │   └── venobox.min.js
    │               └── waypoints
    │                   └── jquery.waypoints.min.js
    ├── routes
    │   ├── platformRoutes.js
    │   └── websiteRoutes.js
    └── views
        ├── platform
        │   ├── pages
        │   │   └── test.ejs
        │   ├── partials
        │   └── sg-platform-template
        │       ├── assets
        │       │   ├── css
        │       │   │   ├── icons
        │       │   │   │   └── tabler-icons
        │       │   │   │       ├── fonts
        │       │   │   │       │   ├── tabler-icons.eot
        │       │   │   │       │   ├── tabler-icons.svg
        │       │   │   │       │   ├── tabler-icons.ttf
        │       │   │   │       │   ├── tabler-icons.woff
        │       │   │   │       │   └── tabler-icons.woff2
        │       │   │   │       └── tabler-icons.css
        │       │   │   ├── styles.css
        │       │   │   └── styles.min.css
        │       │   ├── images
        │       │   │   ├── backgrounds
        │       │   │   │   └── rocket.png
        │       │   │   ├── logos
        │       │   │   │   ├── dark-logo.svg
        │       │   │   │   └── favicon.png
        │       │   │   ├── products
        │       │   │   │   ├── s1.jpg
        │       │   │   │   ├── s11.jpg
        │       │   │   │   ├── s4.jpg
        │       │   │   │   ├── s5.jpg
        │       │   │   │   └── s7.jpg
        │       │   │   └── profile
        │       │   │       └── user-1.jpg
        │       │   ├── js
        │       │   │   ├── app.min.js
        │       │   │   ├── dashboard.js
        │       │   │   └── sidebarmenu.js
        │       │   ├── libs
        │       │   │   ├── apexcharts
        │       │   │   │   ├── LICENSE
        │       │   │   │   ├── README.md
        │       │   │   │   ├── dist
        │       │   │   │   │   ├── apexcharts.amd.js
        │       │   │   │   │   ├── apexcharts.common.js
        │       │   │   │   │   ├── apexcharts.css
        │       │   │   │   │   ├── apexcharts.esm.js
        │       │   │   │   │   ├── apexcharts.js
        │       │   │   │   │   ├── apexcharts.min.js
        │       │   │   │   │   └── locales
        │       │   │   │   │       ├── ar.json
        │       │   │   │   │       ├── ca.json
        │       │   │   │   │       ├── cs.json
        │       │   │   │   │       ├── de.json
        │       │   │   │   │       ├── el.json
        │       │   │   │   │       ├── en.json
        │       │   │   │   │       ├── es.json
        │       │   │   │   │       ├── et.json
        │       │   │   │   │       ├── fa.json
        │       │   │   │   │       ├── fi.json
        │       │   │   │   │       ├── fr.json
        │       │   │   │   │       ├── he.json
        │       │   │   │   │       ├── hi.json
        │       │   │   │   │       ├── hr.json
        │       │   │   │   │       ├── hu.json
        │       │   │   │   │       ├── hy.json
        │       │   │   │   │       ├── id.json
        │       │   │   │   │       ├── it.json
        │       │   │   │   │       ├── ja.json
        │       │   │   │   │       ├── ka.json
        │       │   │   │   │       ├── ko.json
        │       │   │   │   │       ├── lt.json
        │       │   │   │   │       ├── lv.json
        │       │   │   │   │       ├── nb.json
        │       │   │   │   │       ├── nl.json
        │       │   │   │   │       ├── pl.json
        │       │   │   │   │       ├── pt-br.json
        │       │   │   │   │       ├── pt.json
        │       │   │   │   │       ├── rs.json
        │       │   │   │   │       ├── ru.json
        │       │   │   │   │       ├── se.json
        │       │   │   │   │       ├── sk.json
        │       │   │   │   │       ├── sl.json
        │       │   │   │   │       ├── sq.json
        │       │   │   │   │       ├── th.json
        │       │   │   │   │       ├── tr.json
        │       │   │   │   │       ├── ua.json
        │       │   │   │   │       ├── zh-cn.json
        │       │   │   │   │       └── zh-tw.json
        │       │   │   │   ├── package.json
        │       │   │   │   ├── src
        │       │   │   │   │   ├── apexcharts.js
        │       │   │   │   │   ├── assets
        │       │   │   │   │   │   ├── apexcharts.css
        │       │   │   │   │   │   ├── ico-camera.svg
        │       │   │   │   │   │   ├── ico-home.svg
        │       │   │   │   │   │   ├── ico-menu.svg
        │       │   │   │   │   │   ├── ico-minus-square.svg
        │       │   │   │   │   │   ├── ico-minus.svg
        │       │   │   │   │   │   ├── ico-pan-hand.svg
        │       │   │   │   │   │   ├── ico-pan.svg
        │       │   │   │   │   │   ├── ico-plus-square.svg
        │       │   │   │   │   │   ├── ico-plus.svg
        │       │   │   │   │   │   ├── ico-refresh.svg
        │       │   │   │   │   │   ├── ico-reset.svg
        │       │   │   │   │   │   ├── ico-select.svg
        │       │   │   │   │   │   ├── ico-select1.svg
        │       │   │   │   │   │   ├── ico-zoom-in.svg
        │       │   │   │   │   │   ├── ico-zoom-out.svg
        │       │   │   │   │   │   └── ico-zoom.svg
        │       │   │   │   │   ├── charts
        │       │   │   │   │   │   ├── Bar.js
        │       │   │   │   │   │   ├── BarStacked.js
        │       │   │   │   │   │   ├── BoxCandleStick.js
        │       │   │   │   │   │   ├── HeatMap.js
        │       │   │   │   │   │   ├── Line.js
        │       │   │   │   │   │   ├── Pie.js
        │       │   │   │   │   │   ├── Radar.js
        │       │   │   │   │   │   ├── Radial.js
        │       │   │   │   │   │   ├── RangeBar.js
        │       │   │   │   │   │   ├── Scatter.js
        │       │   │   │   │   │   ├── Treemap.js
        │       │   │   │   │   │   └── common
        │       │   │   │   │   │       ├── bar
        │       │   │   │   │   │       │   ├── DataLabels.js
        │       │   │   │   │   │       │   └── Helpers.js
        │       │   │   │   │   │       ├── circle
        │       │   │   │   │   │       │   └── Helpers.js
        │       │   │   │   │   │       ├── line
        │       │   │   │   │   │       │   └── Helpers.js
        │       │   │   │   │   │       └── treemap
        │       │   │   │   │   │           └── Helpers.js
        │       │   │   │   │   ├── libs
        │       │   │   │   │   │   └── Treemap-squared.js
        │       │   │   │   │   ├── locales
        │       │   │   │   │   │   ├── ar.json
        │       │   │   │   │   │   ├── ca.json
        │       │   │   │   │   │   ├── cs.json
        │       │   │   │   │   │   ├── de.json
        │       │   │   │   │   │   ├── el.json
        │       │   │   │   │   │   ├── en.json
        │       │   │   │   │   │   ├── es.json
        │       │   │   │   │   │   ├── et.json
        │       │   │   │   │   │   ├── fa.json
        │       │   │   │   │   │   ├── fi.json
        │       │   │   │   │   │   ├── fr.json
        │       │   │   │   │   │   ├── he.json
        │       │   │   │   │   │   ├── hi.json
        │       │   │   │   │   │   ├── hr.json
        │       │   │   │   │   │   ├── hu.json
        │       │   │   │   │   │   ├── hy.json
        │       │   │   │   │   │   ├── id.json
        │       │   │   │   │   │   ├── it.json
        │       │   │   │   │   │   ├── ja.json
        │       │   │   │   │   │   ├── ka.json
        │       │   │   │   │   │   ├── ko.json
        │       │   │   │   │   │   ├── lt.json
        │       │   │   │   │   │   ├── lv.json
        │       │   │   │   │   │   ├── nb.json
        │       │   │   │   │   │   ├── nl.json
        │       │   │   │   │   │   ├── pl.json
        │       │   │   │   │   │   ├── pt-br.json
        │       │   │   │   │   │   ├── pt.json
        │       │   │   │   │   │   ├── rs.json
        │       │   │   │   │   │   ├── ru.json
        │       │   │   │   │   │   ├── se.json
        │       │   │   │   │   │   ├── sk.json
        │       │   │   │   │   │   ├── sl.json
        │       │   │   │   │   │   ├── sq.json
        │       │   │   │   │   │   ├── th.json
        │       │   │   │   │   │   ├── tr.json
        │       │   │   │   │   │   ├── ua.json
        │       │   │   │   │   │   ├── zh-cn.json
        │       │   │   │   │   │   └── zh-tw.json
        │       │   │   │   │   ├── modules
        │       │   │   │   │   │   ├── Animations.js
        │       │   │   │   │   │   ├── Base.js
        │       │   │   │   │   │   ├── Core.js
        │       │   │   │   │   │   ├── CoreUtils.js
        │       │   │   │   │   │   ├── Crosshairs.js
        │       │   │   │   │   │   ├── Data.js
        │       │   │   │   │   │   ├── DataLabels.js
        │       │   │   │   │   │   ├── Events.js
        │       │   │   │   │   │   ├── Exports.js
        │       │   │   │   │   │   ├── Fill.js
        │       │   │   │   │   │   ├── Filters.js
        │       │   │   │   │   │   ├── Formatters.js
        │       │   │   │   │   │   ├── Graphics.js
        │       │   │   │   │   │   ├── Markers.js
        │       │   │   │   │   │   ├── Range.js
        │       │   │   │   │   │   ├── Responsive.js
        │       │   │   │   │   │   ├── Scales.js
        │       │   │   │   │   │   ├── Series.js
        │       │   │   │   │   │   ├── Theme.js
        │       │   │   │   │   │   ├── TimeScale.js
        │       │   │   │   │   │   ├── TitleSubtitle.js
        │       │   │   │   │   │   ├── Toolbar.js
        │       │   │   │   │   │   ├── ZoomPanSelection.js
        │       │   │   │   │   │   ├── annotations
        │       │   │   │   │   │   │   ├── Annotations.js
        │       │   │   │   │   │   │   ├── Helpers.js
        │       │   │   │   │   │   │   ├── PointsAnnotations.js
        │       │   │   │   │   │   │   ├── XAxisAnnotations.js
        │       │   │   │   │   │   │   └── YAxisAnnotations.js
        │       │   │   │   │   │   ├── axes
        │       │   │   │   │   │   │   ├── Axes.js
        │       │   │   │   │   │   │   ├── AxesUtils.js
        │       │   │   │   │   │   │   ├── Grid.js
        │       │   │   │   │   │   │   ├── XAxis.js
        │       │   │   │   │   │   │   └── YAxis.js
        │       │   │   │   │   │   ├── dimensions
        │       │   │   │   │   │   │   ├── Dimensions.js
        │       │   │   │   │   │   │   ├── Grid.js
        │       │   │   │   │   │   │   ├── Helpers.js
        │       │   │   │   │   │   │   ├── XAxis.js
        │       │   │   │   │   │   │   └── YAxis.js
        │       │   │   │   │   │   ├── helpers
        │       │   │   │   │   │   │   ├── Destroy.js
        │       │   │   │   │   │   │   ├── InitCtxVariables.js
        │       │   │   │   │   │   │   ├── Localization.js
        │       │   │   │   │   │   │   └── UpdateHelpers.js
        │       │   │   │   │   │   ├── legend
        │       │   │   │   │   │   │   ├── Helpers.js
        │       │   │   │   │   │   │   └── Legend.js
        │       │   │   │   │   │   ├── settings
        │       │   │   │   │   │   │   ├── Config.js
        │       │   │   │   │   │   │   ├── Defaults.js
        │       │   │   │   │   │   │   ├── Globals.js
        │       │   │   │   │   │   │   └── Options.js
        │       │   │   │   │   │   └── tooltip
        │       │   │   │   │   │       ├── AxesTooltip.js
        │       │   │   │   │   │       ├── Intersect.js
        │       │   │   │   │   │       ├── Labels.js
        │       │   │   │   │   │       ├── Marker.js
        │       │   │   │   │   │       ├── Position.js
        │       │   │   │   │   │       ├── README.md
        │       │   │   │   │   │       ├── Tooltip.js
        │       │   │   │   │   │       └── Utils.js
        │       │   │   │   │   ├── svgjs
        │       │   │   │   │   │   └── svg.js
        │       │   │   │   │   └── utils
        │       │   │   │   │       ├── DateTime.js
        │       │   │   │   │       ├── Resize.js
        │       │   │   │   │       └── Utils.js
        │       │   │   │   └── types
        │       │   │   │       └── apexcharts.d.ts
        │       │   │   ├── bootstrap
        │       │   │   │   ├── LICENSE
        │       │   │   │   ├── README.md
        │       │   │   │   ├── dist
        │       │   │   │   │   ├── css
        │       │   │   │   │   │   ├── bootstrap-grid.css
        │       │   │   │   │   │   ├── bootstrap-grid.css.map
        │       │   │   │   │   │   ├── bootstrap-grid.min.css
        │       │   │   │   │   │   ├── bootstrap-grid.min.css.map
        │       │   │   │   │   │   ├── bootstrap-grid.rtl.css
        │       │   │   │   │   │   ├── bootstrap-grid.rtl.css.map
        │       │   │   │   │   │   ├── bootstrap-grid.rtl.min.css
        │       │   │   │   │   │   ├── bootstrap-grid.rtl.min.css.map
        │       │   │   │   │   │   ├── bootstrap-reboot.css
        │       │   │   │   │   │   ├── bootstrap-reboot.css.map
        │       │   │   │   │   │   ├── bootstrap-reboot.min.css
        │       │   │   │   │   │   ├── bootstrap-reboot.min.css.map
        │       │   │   │   │   │   ├── bootstrap-reboot.rtl.css
        │       │   │   │   │   │   ├── bootstrap-reboot.rtl.css.map
        │       │   │   │   │   │   ├── bootstrap-reboot.rtl.min.css
        │       │   │   │   │   │   ├── bootstrap-reboot.rtl.min.css.map
        │       │   │   │   │   │   ├── bootstrap-utilities.css
        │       │   │   │   │   │   ├── bootstrap-utilities.css.map
        │       │   │   │   │   │   ├── bootstrap-utilities.min.css
        │       │   │   │   │   │   ├── bootstrap-utilities.min.css.map
        │       │   │   │   │   │   ├── bootstrap-utilities.rtl.css
        │       │   │   │   │   │   ├── bootstrap-utilities.rtl.css.map
        │       │   │   │   │   │   ├── bootstrap-utilities.rtl.min.css
        │       │   │   │   │   │   ├── bootstrap-utilities.rtl.min.css.map
        │       │   │   │   │   │   ├── bootstrap.css
        │       │   │   │   │   │   ├── bootstrap.css.map
        │       │   │   │   │   │   ├── bootstrap.min.css
        │       │   │   │   │   │   ├── bootstrap.min.css.map
        │       │   │   │   │   │   ├── bootstrap.rtl.css
        │       │   │   │   │   │   ├── bootstrap.rtl.css.map
        │       │   │   │   │   │   ├── bootstrap.rtl.min.css
        │       │   │   │   │   │   └── bootstrap.rtl.min.css.map
        │       │   │   │   │   └── js
        │       │   │   │   │       ├── bootstrap.bundle.js
        │       │   │   │   │       ├── bootstrap.bundle.js.map
        │       │   │   │   │       ├── bootstrap.bundle.min.js
        │       │   │   │   │       ├── bootstrap.bundle.min.js.map
        │       │   │   │   │       ├── bootstrap.esm.js
        │       │   │   │   │       ├── bootstrap.esm.js.map
        │       │   │   │   │       ├── bootstrap.esm.min.js
        │       │   │   │   │       ├── bootstrap.esm.min.js.map
        │       │   │   │   │       ├── bootstrap.js
        │       │   │   │   │       ├── bootstrap.js.map
        │       │   │   │   │       ├── bootstrap.min.js
        │       │   │   │   │       └── bootstrap.min.js.map
        │       │   │   │   ├── js
        │       │   │   │   │   ├── dist
        │       │   │   │   │   │   ├── alert.js
        │       │   │   │   │   │   ├── alert.js.map
        │       │   │   │   │   │   ├── base-component.js
        │       │   │   │   │   │   ├── base-component.js.map
        │       │   │   │   │   │   ├── button.js
        │       │   │   │   │   │   ├── button.js.map
        │       │   │   │   │   │   ├── carousel.js
        │       │   │   │   │   │   ├── carousel.js.map
        │       │   │   │   │   │   ├── collapse.js
        │       │   │   │   │   │   ├── collapse.js.map
        │       │   │   │   │   │   ├── dom
        │       │   │   │   │   │   │   ├── data.js
        │       │   │   │   │   │   │   ├── data.js.map
        │       │   │   │   │   │   │   ├── event-handler.js
        │       │   │   │   │   │   │   ├── event-handler.js.map
        │       │   │   │   │   │   │   ├── manipulator.js
        │       │   │   │   │   │   │   ├── manipulator.js.map
        │       │   │   │   │   │   │   ├── selector-engine.js
        │       │   │   │   │   │   │   └── selector-engine.js.map
        │       │   │   │   │   │   ├── dropdown.js
        │       │   │   │   │   │   ├── dropdown.js.map
        │       │   │   │   │   │   ├── modal.js
        │       │   │   │   │   │   ├── modal.js.map
        │       │   │   │   │   │   ├── offcanvas.js
        │       │   │   │   │   │   ├── offcanvas.js.map
        │       │   │   │   │   │   ├── popover.js
        │       │   │   │   │   │   ├── popover.js.map
        │       │   │   │   │   │   ├── scrollspy.js
        │       │   │   │   │   │   ├── scrollspy.js.map
        │       │   │   │   │   │   ├── tab.js
        │       │   │   │   │   │   ├── tab.js.map
        │       │   │   │   │   │   ├── toast.js
        │       │   │   │   │   │   ├── toast.js.map
        │       │   │   │   │   │   ├── tooltip.js
        │       │   │   │   │   │   ├── tooltip.js.map
        │       │   │   │   │   │   └── util
        │       │   │   │   │   │       ├── backdrop.js
        │       │   │   │   │   │       ├── backdrop.js.map
        │       │   │   │   │   │       ├── component-functions.js
        │       │   │   │   │   │       ├── component-functions.js.map
        │       │   │   │   │   │       ├── config.js
        │       │   │   │   │   │       ├── config.js.map
        │       │   │   │   │   │       ├── focustrap.js
        │       │   │   │   │   │       ├── focustrap.js.map
        │       │   │   │   │   │       ├── index.js
        │       │   │   │   │   │       ├── index.js.map
        │       │   │   │   │   │       ├── sanitizer.js
        │       │   │   │   │   │       ├── sanitizer.js.map
        │       │   │   │   │   │       ├── scrollbar.js
        │       │   │   │   │   │       ├── scrollbar.js.map
        │       │   │   │   │   │       ├── swipe.js
        │       │   │   │   │   │       ├── swipe.js.map
        │       │   │   │   │   │       ├── template-factory.js
        │       │   │   │   │   │       └── template-factory.js.map
        │       │   │   │   │   ├── index.esm.js
        │       │   │   │   │   ├── index.umd.js
        │       │   │   │   │   ├── src
        │       │   │   │   │   │   ├── alert.js
        │       │   │   │   │   │   ├── base-component.js
        │       │   │   │   │   │   ├── button.js
        │       │   │   │   │   │   ├── carousel.js
        │       │   │   │   │   │   ├── collapse.js
        │       │   │   │   │   │   ├── dom
        │       │   │   │   │   │   │   ├── data.js
        │       │   │   │   │   │   │   ├── event-handler.js
        │       │   │   │   │   │   │   ├── manipulator.js
        │       │   │   │   │   │   │   └── selector-engine.js
        │       │   │   │   │   │   ├── dropdown.js
        │       │   │   │   │   │   ├── modal.js
        │       │   │   │   │   │   ├── offcanvas.js
        │       │   │   │   │   │   ├── popover.js
        │       │   │   │   │   │   ├── scrollspy.js
        │       │   │   │   │   │   ├── tab.js
        │       │   │   │   │   │   ├── toast.js
        │       │   │   │   │   │   ├── tooltip.js
        │       │   │   │   │   │   └── util
        │       │   │   │   │   │       ├── backdrop.js
        │       │   │   │   │   │       ├── component-functions.js
        │       │   │   │   │   │       ├── config.js
        │       │   │   │   │   │       ├── focustrap.js
        │       │   │   │   │   │       ├── index.js
        │       │   │   │   │   │       ├── sanitizer.js
        │       │   │   │   │   │       ├── scrollbar.js
        │       │   │   │   │   │       ├── swipe.js
        │       │   │   │   │   │       └── template-factory.js
        │       │   │   │   │   └── tests
        │       │   │   │   │       ├── README.md
        │       │   │   │   │       ├── browsers.js
        │       │   │   │   │       ├── helpers
        │       │   │   │   │       │   └── fixture.js
        │       │   │   │   │       ├── integration
        │       │   │   │   │       │   ├── bundle-modularity.js
        │       │   │   │   │       │   ├── bundle.js
        │       │   │   │   │       │   ├── index.html
        │       │   │   │   │       │   ├── rollup.bundle-modularity.js
        │       │   │   │   │       │   └── rollup.bundle.js
        │       │   │   │   │       ├── karma.conf.js
        │       │   │   │   │       ├── unit
        │       │   │   │   │       │   ├── alert.spec.js
        │       │   │   │   │       │   ├── base-component.spec.js
        │       │   │   │   │       │   ├── button.spec.js
        │       │   │   │   │       │   ├── carousel.spec.js
        │       │   │   │   │       │   ├── collapse.spec.js
        │       │   │   │   │       │   ├── dom
        │       │   │   │   │       │   │   ├── data.spec.js
        │       │   │   │   │       │   │   ├── event-handler.spec.js
        │       │   │   │   │       │   │   ├── manipulator.spec.js
        │       │   │   │   │       │   │   └── selector-engine.spec.js
        │       │   │   │   │       │   ├── dropdown.spec.js
        │       │   │   │   │       │   ├── jquery.spec.js
        │       │   │   │   │       │   ├── modal.spec.js
        │       │   │   │   │       │   ├── offcanvas.spec.js
        │       │   │   │   │       │   ├── popover.spec.js
        │       │   │   │   │       │   ├── scrollspy.spec.js
        │       │   │   │   │       │   ├── tab.spec.js
        │       │   │   │   │       │   ├── toast.spec.js
        │       │   │   │   │       │   ├── tooltip.spec.js
        │       │   │   │   │       │   └── util
        │       │   │   │   │       │       ├── backdrop.spec.js
        │       │   │   │   │       │       ├── component-functions.spec.js
        │       │   │   │   │       │       ├── config.spec.js
        │       │   │   │   │       │       ├── focustrap.spec.js
        │       │   │   │   │       │       ├── index.spec.js
        │       │   │   │   │       │       ├── sanitizer.spec.js
        │       │   │   │   │       │       ├── scrollbar.spec.js
        │       │   │   │   │       │       ├── swipe.spec.js
        │       │   │   │   │       │       └── template-factory.spec.js
        │       │   │   │   │       └── visual
        │       │   │   │   │           ├── alert.html
        │       │   │   │   │           ├── button.html
        │       │   │   │   │           ├── carousel.html
        │       │   │   │   │           ├── collapse.html
        │       │   │   │   │           ├── dropdown.html
        │       │   │   │   │           ├── modal.html
        │       │   │   │   │           ├── popover.html
        │       │   │   │   │           ├── scrollspy.html
        │       │   │   │   │           ├── tab.html
        │       │   │   │   │           ├── toast.html
        │       │   │   │   │           └── tooltip.html
        │       │   │   │   ├── package.json
        │       │   │   │   └── scss
        │       │   │   │       ├── _accordion.scss
        │       │   │   │       ├── _alert.scss
        │       │   │   │       ├── _badge.scss
        │       │   │   │       ├── _breadcrumb.scss
        │       │   │   │       ├── _button-group.scss
        │       │   │   │       ├── _buttons.scss
        │       │   │   │       ├── _card.scss
        │       │   │   │       ├── _carousel.scss
        │       │   │   │       ├── _close.scss
        │       │   │   │       ├── _containers.scss
        │       │   │   │       ├── _dropdown.scss
        │       │   │   │       ├── _forms.scss
        │       │   │   │       ├── _functions.scss
        │       │   │   │       ├── _grid.scss
        │       │   │   │       ├── _helpers.scss
        │       │   │   │       ├── _images.scss
        │       │   │   │       ├── _list-group.scss
        │       │   │   │       ├── _maps.scss
        │       │   │   │       ├── _mixins.scss
        │       │   │   │       ├── _modal.scss
        │       │   │   │       ├── _nav.scss
        │       │   │   │       ├── _navbar.scss
        │       │   │   │       ├── _offcanvas.scss
        │       │   │   │       ├── _pagination.scss
        │       │   │   │       ├── _placeholders.scss
        │       │   │   │       ├── _popover.scss
        │       │   │   │       ├── _progress.scss
        │       │   │   │       ├── _reboot.scss
        │       │   │   │       ├── _root.scss
        │       │   │   │       ├── _spinners.scss
        │       │   │   │       ├── _tables.scss
        │       │   │   │       ├── _toasts.scss
        │       │   │   │       ├── _tooltip.scss
        │       │   │   │       ├── _transitions.scss
        │       │   │   │       ├── _type.scss
        │       │   │   │       ├── _utilities.scss
        │       │   │   │       ├── _variables-dark.scss
        │       │   │   │       ├── _variables.scss
        │       │   │   │       ├── bootstrap-grid.css
        │       │   │   │       ├── bootstrap-grid.css.map
        │       │   │   │       ├── bootstrap-grid.scss
        │       │   │   │       ├── bootstrap-reboot.css
        │       │   │   │       ├── bootstrap-reboot.css.map
        │       │   │   │       ├── bootstrap-reboot.scss
        │       │   │   │       ├── bootstrap-utilities.css
        │       │   │   │       ├── bootstrap-utilities.css.map
        │       │   │   │       ├── bootstrap-utilities.scss
        │       │   │   │       ├── bootstrap.css
        │       │   │   │       ├── bootstrap.css.map
        │       │   │   │       ├── bootstrap.scss
        │       │   │   │       ├── css
        │       │   │   │       │   ├── bootstrap-grid.css
        │       │   │   │       │   ├── bootstrap-grid.css.map
        │       │   │   │       │   ├── bootstrap-reboot.css
        │       │   │   │       │   ├── bootstrap-reboot.css.map
        │       │   │   │       │   ├── bootstrap-utilities.css
        │       │   │   │       │   ├── bootstrap-utilities.css.map
        │       │   │   │       │   ├── bootstrap.css
        │       │   │   │       │   └── bootstrap.css.map
        │       │   │   │       ├── forms
        │       │   │   │       │   ├── _floating-labels.scss
        │       │   │   │       │   ├── _form-check.scss
        │       │   │   │       │   ├── _form-control.scss
        │       │   │   │       │   ├── _form-range.scss
        │       │   │   │       │   ├── _form-select.scss
        │       │   │   │       │   ├── _form-text.scss
        │       │   │   │       │   ├── _input-group.scss
        │       │   │   │       │   ├── _labels.scss
        │       │   │   │       │   └── _validation.scss
        │       │   │   │       ├── helpers
        │       │   │   │       │   ├── _clearfix.scss
        │       │   │   │       │   ├── _color-bg.scss
        │       │   │   │       │   ├── _colored-links.scss
        │       │   │   │       │   ├── _position.scss
        │       │   │   │       │   ├── _ratio.scss
        │       │   │   │       │   ├── _stacks.scss
        │       │   │   │       │   ├── _stretched-link.scss
        │       │   │   │       │   ├── _text-truncation.scss
        │       │   │   │       │   ├── _visually-hidden.scss
        │       │   │   │       │   └── _vr.scss
        │       │   │   │       ├── mixins
        │       │   │   │       │   ├── _alert.scss
        │       │   │   │       │   ├── _backdrop.scss
        │       │   │   │       │   ├── _banner.scss
        │       │   │   │       │   ├── _border-radius.scss
        │       │   │   │       │   ├── _box-shadow.scss
        │       │   │   │       │   ├── _breakpoints.scss
        │       │   │   │       │   ├── _buttons.scss
        │       │   │   │       │   ├── _caret.scss
        │       │   │   │       │   ├── _clearfix.scss
        │       │   │   │       │   ├── _color-mode.scss
        │       │   │   │       │   ├── _color-scheme.scss
        │       │   │   │       │   ├── _container.scss
        │       │   │   │       │   ├── _deprecate.scss
        │       │   │   │       │   ├── _forms.scss
        │       │   │   │       │   ├── _gradients.scss
        │       │   │   │       │   ├── _grid.scss
        │       │   │   │       │   ├── _image.scss
        │       │   │   │       │   ├── _list-group.scss
        │       │   │   │       │   ├── _lists.scss
        │       │   │   │       │   ├── _pagination.scss
        │       │   │   │       │   ├── _reset-text.scss
        │       │   │   │       │   ├── _resize.scss
        │       │   │   │       │   ├── _table-variants.scss
        │       │   │   │       │   ├── _text-truncate.scss
        │       │   │   │       │   ├── _transition.scss
        │       │   │   │       │   ├── _utilities.scss
        │       │   │   │       │   └── _visually-hidden.scss
        │       │   │   │       ├── utilities
        │       │   │   │       │   └── _api.scss
        │       │   │   │       └── vendor
        │       │   │   │           └── _rfs.scss
        │       │   │   ├── jquery
        │       │   │   │   ├── AUTHORS.txt
        │       │   │   │   ├── LICENSE.txt
        │       │   │   │   ├── README.md
        │       │   │   │   ├── bower.json
        │       │   │   │   ├── dist
        │       │   │   │   │   ├── core.js
        │       │   │   │   │   ├── jquery.js
        │       │   │   │   │   ├── jquery.min.js
        │       │   │   │   │   ├── jquery.min.map
        │       │   │   │   │   ├── jquery.slim.js
        │       │   │   │   │   ├── jquery.slim.min.js
        │       │   │   │   │   └── jquery.slim.min.map
        │       │   │   │   ├── external
        │       │   │   │   │   └── sizzle
        │       │   │   │   │       ├── LICENSE.txt
        │       │   │   │   │       └── dist
        │       │   │   │   │           ├── sizzle.js
        │       │   │   │   │           ├── sizzle.min.js
        │       │   │   │   │           └── sizzle.min.map
        │       │   │   │   ├── package.json
        │       │   │   │   └── src
        │       │   │   │       ├── ajax
        │       │   │   │       │   ├── jsonp.js
        │       │   │   │       │   ├── load.js
        │       │   │   │       │   ├── parseXML.js
        │       │   │   │       │   ├── script.js
        │       │   │   │       │   ├── var
        │       │   │   │       │   │   ├── location.js
        │       │   │   │       │   │   ├── nonce.js
        │       │   │   │       │   │   └── rquery.js
        │       │   │   │       │   └── xhr.js
        │       │   │   │       ├── ajax.js
        │       │   │   │       ├── attributes
        │       │   │   │       │   ├── attr.js
        │       │   │   │       │   ├── classes.js
        │       │   │   │       │   ├── prop.js
        │       │   │   │       │   ├── support.js
        │       │   │   │       │   └── val.js
        │       │   │   │       ├── attributes.js
        │       │   │   │       ├── callbacks.js
        │       │   │   │       ├── core
        │       │   │   │       │   ├── DOMEval.js
        │       │   │   │       │   ├── access.js
        │       │   │   │       │   ├── camelCase.js
        │       │   │   │       │   ├── init.js
        │       │   │   │       │   ├── isAttached.js
        │       │   │   │       │   ├── nodeName.js
        │       │   │   │       │   ├── parseHTML.js
        │       │   │   │       │   ├── ready-no-deferred.js
        │       │   │   │       │   ├── ready.js
        │       │   │   │       │   ├── readyException.js
        │       │   │   │       │   ├── stripAndCollapse.js
        │       │   │   │       │   ├── support.js
        │       │   │   │       │   ├── toType.js
        │       │   │   │       │   └── var
        │       │   │   │       │       └── rsingleTag.js
        │       │   │   │       ├── core.js
        │       │   │   │       ├── css
        │       │   │   │       │   ├── addGetHookIf.js
        │       │   │   │       │   ├── adjustCSS.js
        │       │   │   │       │   ├── curCSS.js
        │       │   │   │       │   ├── finalPropName.js
        │       │   │   │       │   ├── hiddenVisibleSelectors.js
        │       │   │   │       │   ├── showHide.js
        │       │   │   │       │   ├── support.js
        │       │   │   │       │   └── var
        │       │   │   │       │       ├── cssExpand.js
        │       │   │   │       │       ├── getStyles.js
        │       │   │   │       │       ├── isHiddenWithinTree.js
        │       │   │   │       │       ├── rboxStyle.js
        │       │   │   │       │       ├── rnumnonpx.js
        │       │   │   │       │       └── swap.js
        │       │   │   │       ├── css.js
        │       │   │   │       ├── data
        │       │   │   │       │   ├── Data.js
        │       │   │   │       │   └── var
        │       │   │   │       │       ├── acceptData.js
        │       │   │   │       │       ├── dataPriv.js
        │       │   │   │       │       └── dataUser.js
        │       │   │   │       ├── data.js
        │       │   │   │       ├── deferred
        │       │   │   │       │   └── exceptionHook.js
        │       │   │   │       ├── deferred.js
        │       │   │   │       ├── deprecated.js
        │       │   │   │       ├── dimensions.js
        │       │   │   │       ├── effects
        │       │   │   │       │   ├── Tween.js
        │       │   │   │       │   └── animatedSelector.js
        │       │   │   │       ├── effects.js
        │       │   │   │       ├── event
        │       │   │   │       │   ├── ajax.js
        │       │   │   │       │   ├── alias.js
        │       │   │   │       │   ├── focusin.js
        │       │   │   │       │   ├── support.js
        │       │   │   │       │   └── trigger.js
        │       │   │   │       ├── event.js
        │       │   │   │       ├── exports
        │       │   │   │       │   ├── amd.js
        │       │   │   │       │   └── global.js
        │       │   │   │       ├── jquery.js
        │       │   │   │       ├── manipulation
        │       │   │   │       │   ├── _evalUrl.js
        │       │   │   │       │   ├── buildFragment.js
        │       │   │   │       │   ├── getAll.js
        │       │   │   │       │   ├── setGlobalEval.js
        │       │   │   │       │   ├── support.js
        │       │   │   │       │   ├── var
        │       │   │   │       │   │   ├── rscriptType.js
        │       │   │   │       │   │   └── rtagName.js
        │       │   │   │       │   └── wrapMap.js
        │       │   │   │       ├── manipulation.js
        │       │   │   │       ├── offset.js
        │       │   │   │       ├── queue
        │       │   │   │       │   └── delay.js
        │       │   │   │       ├── queue.js
        │       │   │   │       ├── selector-native.js
        │       │   │   │       ├── selector-sizzle.js
        │       │   │   │       ├── selector.js
        │       │   │   │       ├── serialize.js
        │       │   │   │       ├── traversing
        │       │   │   │       │   ├── findFilter.js
        │       │   │   │       │   └── var
        │       │   │   │       │       ├── dir.js
        │       │   │   │       │       ├── rneedsContext.js
        │       │   │   │       │       └── siblings.js
        │       │   │   │       ├── traversing.js
        │       │   │   │       ├── var
        │       │   │   │       │   ├── ObjectFunctionString.js
        │       │   │   │       │   ├── arr.js
        │       │   │   │       │   ├── class2type.js
        │       │   │   │       │   ├── concat.js
        │       │   │   │       │   ├── document.js
        │       │   │   │       │   ├── documentElement.js
        │       │   │   │       │   ├── fnToString.js
        │       │   │   │       │   ├── getProto.js
        │       │   │   │       │   ├── hasOwn.js
        │       │   │   │       │   ├── indexOf.js
        │       │   │   │       │   ├── isFunction.js
        │       │   │   │       │   ├── isWindow.js
        │       │   │   │       │   ├── pnum.js
        │       │   │   │       │   ├── push.js
        │       │   │   │       │   ├── rcheckableType.js
        │       │   │   │       │   ├── rcssNum.js
        │       │   │   │       │   ├── rnothtmlwhite.js
        │       │   │   │       │   ├── slice.js
        │       │   │   │       │   ├── support.js
        │       │   │   │       │   └── toString.js
        │       │   │   │       └── wrap.js
        │       │   │   └── simplebar
        │       │   │       ├── LICENSE
        │       │   │       ├── README.md
        │       │   │       ├── dist
        │       │   │       │   ├── simplebar-core.esm.js
        │       │   │       │   ├── simplebar-core.esm.js.map
        │       │   │       │   ├── simplebar.css
        │       │   │       │   ├── simplebar.d.ts
        │       │   │       │   ├── simplebar.esm.js
        │       │   │       │   ├── simplebar.esm.js.map
        │       │   │       │   ├── simplebar.js
        │       │   │       │   ├── simplebar.min.css
        │       │   │       │   ├── simplebar.min.js
        │       │   │       │   └── simplebar.umd.js
        │       │   │       ├── package.json
        │       │   │       └── src
        │       │   │           ├── helpers.js
        │       │   │           ├── index.js
        │       │   │           ├── scrollbar-width.js
        │       │   │           ├── simplebar.css
        │       │   │           └── simplebar.js
        │       │   └── scss
        │       │       ├── component
        │       │       │   ├── _card.scss
        │       │       │   └── _reboot.scss
        │       │       ├── layouts
        │       │       │   ├── _header.scss
        │       │       │   ├── _layouts.scss
        │       │       │   └── _sidebar.scss
        │       │       ├── pages
        │       │       │   └── _dashboard1.scss
        │       │       ├── prepros.config
        │       │       ├── styles.scss
        │       │       ├── utilities
        │       │       │   ├── _background.scss
        │       │       │   └── _icon-size.scss
        │       │       └── variables
        │       │           ├── _theme-variables.scss
        │       │           └── _variables.scss
        │       └── html
        │           ├── authentication-login.html
        │           ├── authentication-register.html
        │           ├── create-ticket.html
        │           ├── icon-tabler.html
        │           ├── index.html
        │           ├── profile.html
        │           ├── sample-page.html
        │           ├── tickets-alt.html
        │           ├── tickets.html
        │           ├── ui-alerts.html
        │           ├── ui-buttons.html
        │           ├── ui-card.html
        │           ├── ui-forms.html
        │           └── ui-typography.html
        └── website
            ├── pages
            │   ├── CLM.ejs
            │   ├── CWB.ejs
            │   ├── FINANCE.ejs
            │   ├── JAZBAA.ejs
            │   ├── MAA.ejs
            │   ├── MPA.ejs
            │   ├── SPORTS.ejs
            │   ├── TARANG.ejs
            │   ├── TECH.ejs
            │   ├── about-cabinet.ejs
            │   ├── about.ejs
            │   ├── amenities.ejs
            │   ├── hor-about.ejs
            │   ├── hor-committees.ejs
            │   ├── hor-work.ejs
            │   ├── index.ejs
            │   ├── inner-page.ejs
            │   ├── ministries.ejs
            │   └── portfolio-details.ejs
            └── partials
                ├── footer.ejs
                └── menu.ejs

140 directories, 822 files
