// Function to initialize the page and load any saved data from localStorage
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromLocalStorage();  // Load stored data on page load
});

// Helper to generate default components without labels
function generateDefaultComponents(component = {name: '', score: '', total: '', weight: ''}) {
    return `
        <!-- Default component row -->
        <div class="row mb-3 component-row">
            <div class="col-12 col-md-3"><input type="text" class="form-control assessment-name" placeholder="e.g. Quiz" value="${component.name}" oninput="recomputeGrade(this)"></div>
            <div class="col-12 col-md-2"><input type="number" class="form-control component-score" placeholder="Score" value="${component.score}" oninput="recomputeGrade(this)"></div>
            <div class="col-12 col-md-2"><input type="number" class="form-control component-total" placeholder="Total" value="${component.total}" oninput="recomputeGrade(this)"></div>
            <div class="col-12 col-md-2"><input type="number" class="form-control component-weight" placeholder="% of Class Grade" value="${component.weight}" oninput="recomputeGrade(this)"></div>
            <div class="col-12 col-md-2"><span class="component-percentage"></span> / <span class="component-letter-grade"></span></div>
            <div class="col-12 col-md-1"><button class="btn btn-danger" onclick="removeComponent(this)">X</button></div>
        </div>`;
}

// Function to generate the header row for fields (to be shown only once)
function generateHeaderRow() {
    return `
        <div class="row mb-2 component-header">
            <div class="col-12 col-md-3"><strong>Assessment Name</strong></div>
            <div class="col-12 col-md-2"><strong>Score</strong></div>
            <div class="col-12 col-md-2"><strong>Total</strong></div>
            <div class="col-12 col-md-2"><strong>% of Class Grade</strong></div>
            <div class="col-12 col-md-2"><strong>Percentage / Letter Grade</strong></div>
            <div class="col-12 col-md-1"></div>
        </div>`;
}

// Helper to generate the extra credit component
function generateExtraCreditComponent(extraCredit = {score: '', total: '', weight: ''}) {
    return `
        <!-- Extra Credit Section -->
        <div class="extra-credit-section card mb-3" style="border: 2px dashed #00bcd4;">
            <div class="card-header bg-info text-white"><strong>Extra Credit (Does not count towards 100% weightage)</strong></div>
            <div class="card-body">
                <div class="row component-row">
                    <div class="col-12 col-md-3"><input type="text" class="form-control assessment-name" value="Extra Credit" disabled></div>
                    <div class="col-12 col-md-2"><input type="number" class="form-control component-score" placeholder="Score" value="${extraCredit.score}" oninput="recomputeGrade(this)"></div>
                    <div class="col-12 col-md-2"><input type="number" class="form-control component-total" placeholder="Total" value="${extraCredit.total}" oninput="recomputeGrade(this)"></div>
                    <div class="col-12 col-md-2"><input type="number" class="form-control component-weight extra-credit" placeholder="% of Class Grade" value="${extraCredit.weight}" oninput="recomputeGrade(this)"></div>
                    <div class="col-12 col-md-2"><span class="component-percentage"></span> / <span class="component-letter-grade"></span></div>
                </div>
            </div>
        </div>`;
}

// Function to add a new course initialized with 3 grade components + extra credit
function addNewCourse() {
    const coursesContainer = document.getElementById('coursesContainer');

    const newCourseTemplate = `
    <div class="card mt-3 course-card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5>Course Name: <input type="text" class="form-control course-name" placeholder="e.g. Math 101" oninput="saveDataToLocalStorage()"></h5>
            <button class="btn btn-danger" onclick="removeCourse(this)">Remove Course</button>
        </div>
        <div class="card-body">
            <!-- Field labels displayed only once -->
            ${generateHeaderRow()}
            <div class="grade-components">
                <!-- Default grade components without labels -->
                ${generateDefaultComponents()}
                ${generateDefaultComponents()}
                ${generateDefaultComponents()}
            </div>
            <button class="btn btn-secondary mb-3" onclick="addComponent(this)">+ Add Assessment</button>
            <!-- Extra Credit Section -->
            ${generateExtraCreditComponent()}
        </div>
        <div class="card-footer text-center">
            <div class="current-grade-box" style="border: 2px solid #ccc; padding: 15px; font-size: 1.5rem;">
                <h6 class="current-grade">No Grade Computed</h6>
            </div>
        </div>
    </div>`;

    coursesContainer.insertAdjacentHTML('beforeend', newCourseTemplate);
}

// Function to add a new component (assessment) to a course
function addComponent(button) {
    const gradeComponents = button.closest('.card-body').querySelector('.grade-components');
    const extraCreditSection = button.closest('.card-body').querySelector('.extra-credit-section');

    const componentTemplate = generateDefaultComponents();
    gradeComponents.insertAdjacentHTML('beforeend', componentTemplate);

    // Ensure extra credit remains at the bottom
    button.closest('.card-body').appendChild(extraCreditSection);

    // Recompute the grade after adding a component
    recomputeGrade(button.closest('.course-card'));
    saveDataToLocalStorage();  // Save the updated data
}

// Function to remove a component (assessment) from a course
function removeComponent(button) {
    const componentRow = button.closest('.component-row');
    const courseCard = button.closest('.course-card');
    componentRow.remove();
    recomputeGrade(courseCard);  // Recompute the grade after removal
    saveDataToLocalStorage();  // Save the updated data
}

// Function to remove a course
function removeCourse(button) {
    const courseCard = button.closest('.course-card');
    courseCard.remove();
    saveDataToLocalStorage();  // Save the updated data
}

// Function to recompute course grade on any input change
function recomputeGrade(inputElement) {
    calculatePercentage(inputElement);
    calculateCourseGrade(inputElement.closest('.course-card'));
    saveDataToLocalStorage();  // Save data whenever a grade is recalculated
}

// Function to calculate the percentage for each assessment component
function calculatePercentage(inputElement) {
    const componentRow = inputElement.closest('.component-row');
    const score = parseFloat(componentRow.querySelector('.component-score').value);
    const total = parseFloat(componentRow.querySelector('.component-total').value);
    const percentageSpan = componentRow.querySelector('.component-percentage');
    const letterGradeSpan = componentRow.querySelector('.component-letter-grade');

    if (!isNaN(score) && !isNaN(total) && total > 0) {
        const percentage = (score / total) * 100;
        percentageSpan.textContent = percentage.toFixed(2) + '%';
        letterGradeSpan.textContent = getLetterGrade(percentage);
    } else {
        percentageSpan.textContent = '';
        letterGradeSpan.textContent = '';
    }
}

// Function to calculate the overall grade for a course
function calculateCourseGrade(courseCard) {
    const componentRows = courseCard.querySelectorAll('.component-row');  // Include both regular and extra credit components
    let totalWeightedScore = 0;
    let totalWeightage = 0;

    // Calculate regular and extra credit components
    componentRows.forEach(row => {
        const score = parseFloat(row.querySelector('.component-score').value);
        const total = parseFloat(row.querySelector('.component-total').value);
        const weightage = parseFloat(row.querySelector('.component-weight').value);

        if (!isNaN(score) && !isNaN(total) && !isNaN(weightage) && total > 0) {
            const componentPercentage = (score / total) * 100;
            totalWeightedScore += (componentPercentage * weightage) / 100;
            totalWeightage += weightage;
        }
    });

    // Normalize grade if total weightage is less than 100%
    let finalGrade = totalWeightedScore;
    if (totalWeightage > 0 && totalWeightage < 100) {
        finalGrade = (totalWeightedScore / totalWeightage) * 100;
    }

    const currentGradeSpan = courseCard.querySelector('.current-grade');
    const currentGradeBox = courseCard.querySelector('.current-grade-box');

    // Display the final grade
    currentGradeSpan.textContent = `Current Grade: ${finalGrade.toFixed(2)}% (${getLetterGrade(finalGrade)})`;
    currentGradeBox.classList.add('highlight');  // Add subtle highlight to results box
    currentGradeBox.style.borderColor = 'lightgreen';  // Green border when grade is computed
    currentGradeBox.style.backgroundColor = '#e6ffe6';  // Subtle green background
}

// Grade to letter mapping function with boundary case handling
function getLetterGrade(percentage) {
    const roundedPercentage = Math.round(percentage);  // Round to nearest integer
    if (roundedPercentage >= 90) return 'A';
    if (roundedPercentage >= 85) return 'A-';
    if (roundedPercentage >= 80) return 'B+';
    if (roundedPercentage >= 75) return 'B';
    if (roundedPercentage >= 70) return 'B-';
    if (roundedPercentage >= 65) return 'C+';
    if (roundedPercentage >= 60) return 'C';
    if (roundedPercentage >= 55) return 'C-';
    if (roundedPercentage >= 50) return 'D+';
    if (roundedPercentage >= 45) return 'D';
    if (roundedPercentage >= 40) return 'D-';
    return 'F';
}

// Function to store course data in localStorage
function saveDataToLocalStorage() {
    const coursesContainer = document.getElementById('coursesContainer');
    const courses = [];

    // Loop through each course card and deconstruct its data
    coursesContainer.querySelectorAll('.course-card').forEach(courseCard => {
        const course = {
            name: courseCard.querySelector('.course-name').value,
            components: [],
            extraCredit: {}
        };

        // Deconstruct regular components
        courseCard.querySelectorAll('.grade-components .component-row').forEach(componentRow => {
            const component = {
                name: componentRow.querySelector('.assessment-name').value,
                score: componentRow.querySelector('.component-score').value,
                total: componentRow.querySelector('.component-total').value,
                weight: componentRow.querySelector('.component-weight').value
            };
            course.components.push(component);
        });

        // Deconstruct extra credit
        const extraCreditRow = courseCard.querySelector('.extra-credit-section');
        const extraCredit = {
            score: extraCreditRow.querySelector('.component-score').value,
            total: extraCreditRow.querySelector('.component-total').value,
            weight: extraCreditRow.querySelector('.component-weight').value
        };
        course.extraCredit = extraCredit;

        courses.push(course);
    });

    // Store the courses array as a JSON string in localStorage
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Function to load course data from localStorage and restore the UI
function loadDataFromLocalStorage() {
    const savedCourses = JSON.parse(localStorage.getItem('courses'));

    if (savedCourses && savedCourses.length > 0) {
        savedCourses.forEach(courseData => {
            addNewCourseFromData(courseData);
        });
    } else {
        // If no data, add a default empty course
        addNewCourse();
    }
}

// Function to add a course card from stored data
function addNewCourseFromData(courseData) {
    const coursesContainer = document.getElementById('coursesContainer');

    const newCourseTemplate = `
    <div class="card mt-3 course-card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5>Course Name: <input type="text" class="form-control course-name" value="${courseData.name}" oninput="saveDataToLocalStorage()"></h5>
            <button class="btn btn-danger" onclick="removeCourse(this)">Remove Course</button>
        </div>
        <div class="card-body">
            ${generateHeaderRow()}
            <div class="grade-components">
                ${courseData.components.map(component => generateDefaultComponents(component)).join('')}
            </div>
            <button class="btn btn-secondary mb-3" onclick="addComponent(this)">+ Add Assessment</button>
            <!-- Extra Credit Section -->
            ${generateExtraCreditComponent(courseData.extraCredit)}
        </div>
        <div class="card-footer text-center">
            <div class="current-grade-box" style="border: 2px solid #ccc; padding: 15px; font-size: 1.5rem;">
                <h6 class="current-grade">No Grade Computed</h6>
            </div>
        </div>
    </div>`;

    coursesContainer.insertAdjacentHTML('beforeend', newCourseTemplate);

    // Automatically recompute the grade for all components after loading the saved data
    const courseCard = coursesContainer.lastElementChild;
    courseCard.querySelectorAll('.component-score, .component-total, .component-weight').forEach(input => {
        recomputeGrade(input);
    });
}
