// Function to initialize the page and load any saved data from localStorage
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();  // Load stored data on page load
});

// Helper to generate default components without labels
function generateDefaultComponents(component = { name: '', score: '', letter: '', total: '', weight: '' }) {
    return `
        <div class="row mb-3 component-row align-items-center">
            <div class="col-12 col-md-2">
                <input type="text" class="form-control assessment-name" placeholder="e.g. Quiz" value="${component.name}" oninput="recomputeGrade(this)">
            </div>
            <div class="col-12 col-md-2">
                <input type="number" class="form-control component-score" placeholder="Score" value="${component.score}" oninput="syncInputs(this, 'score')">
            </div>
            <div class="col-12 col-md-2">
                <select class="form-control component-letter" onchange="syncInputs(this, 'letter')">
                    <option value="">Select Grade</option>
                    ${generateLetterGradeOptions(component.letter)}
                </select>
            </div>
            <div class="col-12 col-md-2">
                <input type="number" class="form-control component-total" placeholder="Total" value="${component.total}" oninput="recomputeGrade(this)">
            </div>
            <div class="col-12 col-md-2">
                <input type="number" class="form-control component-weight" placeholder="% of Class Grade" value="${component.weight}" oninput="recomputeGrade(this)">
            </div>
            <div class="col-12 col-md-2 d-flex align-items-center">
                <span class="component-percentage"></span> / <span class="component-letter-grade"></span>
                <button class="btn btn-danger btn-sm remove-component-btn ml-2" onclick="removeComponent(this)">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        </div>`;
}

function generateLetterGradeOptions(selectedGrade = '') {
    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
    return grades
        .map(grade => `<option value="${grade}" ${grade === selectedGrade ? 'selected' : ''}>${grade}</option>`)
        .join('');
}

const gradeMapping = [
    { letter: 'A', min: 89.5, max: 100 },
    { letter: 'A-', min: 84.5, max: 89.49 },
    { letter: 'B+', min: 79.5, max: 84.99 },
    { letter: 'B', min: 74.5, max: 79.99 },
    { letter: 'B-', min: 69.5, max: 74.99 },
    { letter: 'C+', min: 64.5, max: 69.99 },
    { letter: 'C', min: 59.5, max: 64.99 },
    { letter: 'C-', min: 54.5, max: 59.99 },
    { letter: 'D+', min: 49.5, max: 54.99 },
    { letter: 'D', min: 44.5, max: 49.99 },
    { letter: 'D-', min: 39.5, max: 44.99 },
    { letter: 'F', min: 0, max: 39.99 }
];

function syncInputs(input, type) {
    const componentRow = input.closest('.component-row');
    const scoreInput = componentRow.querySelector('.component-score');
    const letterInput = componentRow.querySelector('.component-letter');
    const totalInput = componentRow.querySelector('.component-total');

    if (type === 'letter') {
        const letterGrade = input.value.toUpperCase();
        const matchingGrade = gradeMapping.find(grade => grade.letter === letterGrade);
        if (matchingGrade) {
            const avgScore = ((matchingGrade.min + matchingGrade.max) / 2).toFixed(2);
            scoreInput.value = avgScore; // Set numerical score based on letter grade
            totalInput.value = 100; // Automatically set total to 100
        }
    } else if (type === 'score') {
        const numericalScore = parseFloat(input.value);
        const matchingGrade = gradeMapping.find(
            grade => numericalScore >= grade.min && numericalScore <= grade.max
        );
        if (matchingGrade) {
            letterInput.value = matchingGrade.letter;
        }
    }

    recomputeGrade(input); // Update calculations
}

// Helper to generate the extra credit component
function generateExtraCreditComponent(extraCredit = {score: '', total: '', weight: ''}) {
    return `
        <!-- Extra Credit Section -->
        <div class="extra-credit-section card mb-3" style="border: 2px dashed #b3b3b3; background-color: #f7f7f7;">
            <div class="card-header bg-muted text-black"><strong>Extra Credit (Does not count towards 100% weightage)</strong></div>
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

// Function to add a new course initialized with 3 grade components
function addNewCourse() {
    const coursesContainer = document.getElementById('coursesContainer');

    const newCourseTemplate = `
    <div class="card mt-3 course-card">
        <div class="card-header d-flex justify-content-between align-items-center" style="color: white;">
            <h5>Course Name: <input type="text" class="form-control course-name" placeholder="e.g. Math 101" oninput="debounceSaveDataToLocalStorage()"></h5>
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
            <button class="btn btn-secondary mt-3 mb-3" onclick="addComponent(this)">+ Add Assessment</button>
            <div class="w-100"></div> <!-- Forces the next button onto a new line -->
            <button class="btn btn-secondary extra-credit-toggle-btn" onclick="toggleExtraCredit(this)">Add Extra Credit</button>
            <!-- Extra Credit Section will be added dynamically -->
        </div>
        <div class="card-footer text-center">
            <div class="current-grade-box" style="border: 2px solid #ccc; padding: 15px; font-size: 1.5rem;">
                <h6 class="current-grade">No Grade Computed</h6>
                <h6 class="current-weightage">Current Weightage: 0%</h6>
            </div>
        </div>
    </div>`;

    coursesContainer.insertAdjacentHTML('beforeend', newCourseTemplate);
}

// Function to generate the header row for fields (to be shown only once)
function generateHeaderRow() {
    return `
        <div class="row mb-2 component-header">
            <div class="col-12 col-md-2"><strong>Assessment Name</strong></div>
            <div class="col-12 col-md-2"><strong>Score</strong></div>
            <div class="col-12 col-md-2"><strong>Letter Grade</strong></div>
            <div class="col-12 col-md-2"><strong>Total</strong></div>
            <div class="col-12 col-md-2"><strong>% of Class Grade</strong></div>
            <div class="col-12 col-md-2"><strong>Percentage / Letter Grade</strong></div>
        </div>`;
}

// Function to toggle the extra credit visibility
function toggleExtraCredit(button) {
    const courseCard = button.closest('.course-card');
    const extraCreditSection = courseCard.querySelector('.extra-credit-section');
    
    if (extraCreditSection) {
        extraCreditSection.remove();
        button.textContent = 'Add Extra Credit';
    } else {
        const cardBody = courseCard.querySelector('.card-body');
        cardBody.insertAdjacentHTML('beforeend', generateExtraCreditComponent());
        button.textContent = 'Remove Extra Credit';
    }

    recomputeCourseGrade(courseCard); // Recompute the course grade after toggling extra credit
    debounceSaveDataToLocalStorage(); // Save the state (whether extra credit is shown or hidden)
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
    const componentRow = button.closest('.component-row'); // Find the parent row
    const courseCard = button.closest('.course-card'); // Get the associated course card
    componentRow.remove(); // Remove the component row

    recomputeCourseGrade(courseCard); // Recompute the course grade after removal
    debounceSaveDataToLocalStorage(); // Save the updated data
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
    const currentWeightageSpan = courseCard.querySelector('.current-weightage');
    const currentGradeBox = courseCard.querySelector('.current-grade-box');

    // Display the final grade and current weightage
    currentGradeSpan.textContent = `Current Grade: ${finalGrade.toFixed(2)}% (${getLetterGrade(finalGrade)})`;
    currentWeightageSpan.textContent = `Current Weightage: ${totalWeightage.toFixed(2)}%`;
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
            extraCredit: null,
            showExtraCredit: !!courseCard.querySelector('.extra-credit-section')
        };

        // Deconstruct regular components
        courseCard.querySelectorAll('.grade-components .component-row').forEach(componentRow => {
            const component = {
                name: componentRow.querySelector('.assessment-name').value,
                score: componentRow.querySelector('.component-score').value,
                letter: componentRow.querySelector('.component-letter').value,
                total: componentRow.querySelector('.component-total').value,
                weight: componentRow.querySelector('.component-weight').value
            };
            course.components.push(component);
        });

        // Deconstruct extra credit if present
        if (course.showExtraCredit) {
            const extraCreditRow = courseCard.querySelector('.extra-credit-section');
            const extraCredit = {
                score: extraCreditRow.querySelector('.component-score').value,
                total: extraCreditRow.querySelector('.component-total').value,
                weight: extraCreditRow.querySelector('.component-weight').value
            };
            course.extraCredit = extraCredit;
        }

        courses.push(course);
    });

    // Store the courses array as a JSON string in localStorage
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Function to debounce saving data to localStorage
function debounceSaveDataToLocalStorage() {
    clearTimeout(window.saveDataTimeout);
    window.saveDataTimeout = setTimeout(saveDataToLocalStorage, 500);
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

function addNewCourseFromData(courseData) {
    const coursesContainer = document.getElementById('coursesContainer');

    const newCourseTemplate = `
    <div class="card mt-3 course-card">
        <div class="card-header d-flex justify-content-between align-items-center" style="color: white;">
            <h5>Course Name: <input type="text" class="form-control course-name" value="${courseData.name}" oninput="debounceSaveDataToLocalStorage()"></h5>
            <button class="btn btn-danger" onclick="removeCourse(this)">Remove Course</button>
        </div>
        <div class="card-body">
            ${generateHeaderRow()}
            <div class="grade-components">
                ${courseData.components.map(component => generateDefaultComponents(component)).join('')}
            </div>
            <button class="btn btn-secondary mt-3 mb-3" onclick="addComponent(this)">+ Add Assessment</button>
            <div class="w-100"></div> <!-- Forces the next button onto a new line -->
            <button class="btn btn-secondary extra-credit-toggle-btn" onclick="toggleExtraCredit(this)">${courseData.showExtraCredit ? 'Remove Extra Credit' : 'Add Extra Credit'}</button>
        </div>
        <div class="card-footer text-center">
            <div class="current-grade-box" style="border: 2px solid #ccc; padding: 15px; font-size: 1.5rem;">
                <h6 class="current-grade">No Grade Computed</h6>
                <h6 class="current-weightage">Current Weightage: 0%</h6>
            </div>
        </div>
    </div>`;

    coursesContainer.insertAdjacentHTML('beforeend', newCourseTemplate);

    const courseCard = coursesContainer.lastElementChild;

    // Add extra credit if present
    if (courseData.showExtraCredit) {
        const cardBody = courseCard.querySelector('.card-body');
        cardBody.insertAdjacentHTML('beforeend', generateExtraCreditComponent(courseData.extraCredit));
    }

    recomputeCourseGrade(courseCard); // Recompute grades after loading
}

// Function to recompute the grade for a course card
function recomputeCourseGrade(courseCard) {
    courseCard.querySelectorAll('.component-score, .component-total, .component-weight').forEach(input => {
        recomputeGrade(input);
    });
}
