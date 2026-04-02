// MongoDB non-root initialization script
db = db.getSiblingDB('ai-task-platform');

db.createUser({
  user: 'atp_user',
  pwd: 'atp_password',
  roles: [
    {
      role: 'readWrite',
      db: 'ai-task-platform',
    },
  ],
});

console.log('MongoDB: Application user created successfully.');
