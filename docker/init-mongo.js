// Init script to create an application user for the shoes_db database
// This runs inside the mongo container during first-time initialization.

// connect to admin db
var admin = db.getSiblingDB('admin');

// create application user with readWrite on shoes_db
try {
  admin.createUser({
    user: 'appUser',
    pwd: 'AppPass123',
    roles: [ { role: 'readWrite', db: 'shoes_db' } ]
  });
  print('Created appUser for shoes_db');
} catch (e) {
  print('Skipping user creation (may already exist): ' + e);
}
