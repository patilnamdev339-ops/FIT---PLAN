Create a modern, responsive, and user-friendly web application called **“FitPlan – Personalized Fitness, Nutrition & Workout Recommendation System.”**

The purpose of this website is to provide users with personalized fitness, nutrition, and workout recommendations based on their personal information, body measurements, lifestyle, fitness goals, dietary preferences, and workout preferences.

## 1. Technology Stack

Use the following technologies:

* Frontend: HTML5, CSS3, JavaScript, Bootstrap 5
* Backend: Python with Flask
* Database: MySQL
* Charts: Chart.js
* Authentication: Flask Session or Flask-Login
* Version Control: Git and GitHub
* UI/UX Design: Figma

The application should have a clean and professional fitness-themed interface and should be fully responsive on desktop, tablet, and mobile devices.

## 2. Home Page

Create an attractive landing page containing:

* Website name and logo: FitPlan
* Navigation bar
* Hero section with a fitness-related headline
* Short description of the platform
* “Get Started” button
* “Login” and “Register” buttons
* Features section
* How It Works section
* Benefits section
* Footer

The design should look modern, clean, motivating, and professional rather than like a basic template.

## 3. User Registration and Login

Create secure authentication functionality.

Registration should include:

* Full name
* Email
* Password
* Confirm password

Login should include:

* Email
* Password

Users should be able to:

* Register
* Login
* Logout
* Access their personal dashboard
* Update their profile

Passwords must be stored securely using password hashing.

## 4. Fitness Assessment

After registration/login, ask the user to complete a fitness assessment.

Collect the following information:

### Personal Information

* Age
* Gender

### Body Information

* Height
* Weight
* Optional waist measurement

### Lifestyle

* Activity level

### Fitness Goal

Provide options such as:

* Fat Loss
* Cutting
* Muscle Gain
* Lean Bulk
* Body Recomposition
* Maintenance
* General Fitness

### Workout Information

* Experience level: Beginner, Intermediate, Advanced
* Workout location: Home or Gym
* Available equipment
* Workout days per week
* Workout duration

### Diet Information

* Vegetarian
* Eggetarian
* Non-Vegetarian
* Number of meals per day
* Food preferences

Use proper form validation and user-friendly input fields.

## 5. Fitness Calculation Engine

After the user submits the assessment, calculate:

* BMI
* BMR
* Estimated TDEE
* Daily calorie target
* Protein target
* Carbohydrate target
* Fat target

Use established formulas such as the Mifflin-St Jeor equation for BMR.

The calorie target should be adjusted according to the user's selected fitness goal.

Do not use random values. Keep calculation parameters configurable in the backend.

Display the calculated results clearly to the user.

## 6. Personalized Diet Recommendation

Create a recommendation engine that generates a personalized diet plan based on:

* User's calorie target
* Protein target
* Carbohydrate target
* Fat target
* Fitness goal
* Diet type
* Number of meals
* Food preferences

The system should recommend suitable foods and meals.

Include common foods such as:

* Rice
* Roti
* Bhakri
* Oats
* Eggs
* Chicken
* Fish
* Paneer
* Soya chunks
* Dal
* Chana
* Fruits
* Vegetables
* Milk/curd
* Nuts and seeds

Each food item should have nutritional information such as:

* Calories
* Protein
* Carbohydrates
* Fat
* Serving size

The system should try to keep the generated diet close to the user's calculated calorie and macro targets.

## 7. Food Replacement Feature

Allow users to replace unavailable foods.

For example:

Chicken → Eggs / Paneer / Soya

Rice → Roti / Bhakri / Potatoes

The replacement should be nutritionally reasonable and compatible with the user's diet type.

## 8. Personalized Workout Recommendation

Create a workout recommendation engine based on:

* Fitness goal
* Experience level
* Workout location
* Available equipment
* Workout days
* Workout duration

Each workout should contain:

* Exercise name
* Target muscle group
* Sets
* Repetitions
* Rest time
* Difficulty level
* Instructions

For example:

Gym users can receive exercises involving gym equipment, while Home users should receive suitable bodyweight or home-equipment exercises.

Create different workout structures for different numbers of training days.

## 9. User Dashboard

After completing the assessment, show a personalized dashboard containing:

* User name
* Current weight
* Fitness goal
* Daily calorie target
* Protein target
* Carbohydrate target
* Fat target
* BMI
* Today's diet
* Today's workout
* Progress summary

Include navigation to:

* Dashboard
* My Diet
* My Workout
* Progress
* Profile
* Settings
* Logout

## 10. Progress Tracking

Allow users to regularly record:

* Weight
* Waist measurement
* Optional body measurements
* Workout completion

Use Chart.js to display progress graphs.

For example:

* Weight progress over time
* Waist measurement progress
* Workout completion

The progress data must be stored in the MySQL database.

## 11. Database Design

Create a properly structured MySQL database with tables such as:

* users
* profiles
* foods
* exercises
* diet_plans
* workout_plans
* progress
* food_replacements

Use relationships between tables where appropriate.

## 12. Recommendation Engine

The recommendation system should be rule-based and data-driven.

Example logic:

If goal = Fat Loss:
Set calorie target below estimated TDEE.

If goal = Muscle Gain:
Set calorie target above estimated TDEE.

If goal = Recomposition:
Keep calories around maintenance or use a small deficit and prioritize resistance training.

If workout location = Home:
Select exercises available for home workouts.

If workout location = Gym:
Select gym-appropriate exercises.

If diet type = Vegetarian:
Exclude meat and fish.

If diet type = Eggetarian:
Allow eggs but exclude meat and fish.

If diet type = Non-Vegetarian:
Allow meat, fish, eggs, etc.

The recommendation engine should be implemented in Python rather than generating the entire plan through an AI model.

## 13. UI/UX Requirements

Use a modern fitness dashboard design.

Design requirements:

* Clean layout
* Responsive design
* Modern cards
* Progress bars
* Charts
* Clear buttons
* Easy navigation
* Proper spacing
* Professional typography
* Fitness-related icons
* Mobile-friendly layout
* Accessible form fields

Use Bootstrap where appropriate but customize the design so that it does not look like a default Bootstrap website.

## 14. Security

Implement:

* Password hashing
* Login authentication
* Session management
* Form validation
* Protection against unauthorized dashboard access
* Secure database queries
* Basic input sanitization

## 15. Project Structure

Use a clean Flask project structure similar to:

fitness-project/
│
├── app.py
├── requirements.txt
│
├── models/
├── routes/
├── recommendation/
├── database/
│
├── templates/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── assessment.html
│   ├── dashboard.html
│   ├── diet.html
│   ├── workout.html
│   ├── progress.html
│   └── profile.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
└── README.md

## 16. Important Requirement

This should be a real full-stack final-year college project, not a static website.

The system must have:

Frontend + Backend + MySQL Database + Authentication + Fitness Calculations + Recommendation Engine + Personalized Diet + Personalized Workout + Progress Tracking.

The application should actually store user data in the database and generate recommendations dynamically based on the user's inputs.

Build the project in a modular and maintainable way so that additional features such as an AI Fitness Assistant, reminders, advanced analytics, and machine-learning recommendations can be added later.

The core recommendation system should work independently without requiring an AI API.

Include a general disclaimer stating that the recommendations are for educational/general fitness purposes and are not a substitute for professional medical or dietetic advice.
