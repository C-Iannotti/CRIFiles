# FileSharingWebsite
This project is being developed to learn more about web-based applications and web protocols. The goal
of the project is to allow users to upload any format file and then allow certain or all users to
download the file through a website link.
## Details
The application first lands on a home page, which allows the user to register or login by returning
a cookie that is used for a period of time or until the user register or logins into another account.
The user is redirected to the user's page, which allows them to upload a file or open and see on any
files they have uploaded. When a file is opened, it redirects the user to the file's page, which
would then download small files to a local database for the user to potentially view in an appropriate tag (if the user
was given permission by the creator to access it). Otherwise, any locally stored file is deleted,
and the user is redirected to their previous page. The user can click a button on the file's page
to download the file to their download folder from either the local database or the server, depending
on if the user already has a local copy.
## Implementation
This application uses Node to create both the front and back-end, and uses a .env file to instantiate
variables (each variable seen in the code). After running npm install in both package.json areas,
use npm run build in client folder to create React app and node server.js in the same directory
as the server.js file.
## Plan
* Allow selection of users from available users for trusted user
* Add restrictions based on privacy and trusted users
* Change login form to header accessible accross entire app
* Change home page to include information about the application
* Change back-end to support https requests
* Redesign website for useability and appearance
