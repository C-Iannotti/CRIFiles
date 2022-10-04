# FileSharingWebsite
This project is being developed to learn more about web-based applications and web protocols. The goal
of the project is to allow users to upload any format file and have certain or all users be able to
access the file with three methods: by searching file's available to the user, by entering the file's URL
without a token, and by entering the file's URL with a token.
* https://ci-file-sharing-website.herokuapp.com
## Details
The application is divided into three separate pages, with a header displayed throughout the website.
The first page is the Home page, which allows anyone to search for files they have access to and go
to their page. The second page is the User page, which allows a user to search for files they have
uploaded and either go to their page or delete them. It also allows them to upload a file along with
privacy level, trusted users, and a comment. the privacy level can be public (anyone can access the file,
even without an account), shared (anyone with access to a generated token can access the file), and
private (only trusted users can access the file). The final page is the File page, which displays any
file for those with access by providing the file's ID (and maybe a token). The File page allows the
user who uploaded it to change the privacy level, update the trusted users, make a new comment, or
generate a new token for sharing. The File page stores a local copy of small files for the user to
view and allows the user to donwload any file size. The header has a login form, register form, and
logout button to control who is signed in. The header also has buttons displayed as text to allow a
user to go to the User page or Home page.
## Implementation
The application uses NodeJS and Express as the back-end and React with npm for the front-end. The
application also uses a cloud MongoDB database for managing files. Two separate .dot env files are
used to manage the variables for the front-end and the back-end (example files can be found as
example.env, but should be renamed to .env). to use https protocol, localhost-key.pem and
localhost.pem files are also placed in the root directory.
## Plan
* Change home page to include information about the application
<<<<<<< HEAD
* Redesign website for useability and appearance
* Move public website to AWS
=======
* Add OAuth methods
* Redesign website for useability and appearance
>>>>>>> 25eaaab52aa8721ed757ca48a69a5c464a7477ff
