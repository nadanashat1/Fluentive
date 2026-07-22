SELECT email, "isActive", password, role, createdAt, updatedAt, isDeleted, deletedAt
FROM "User" 
WHERE email ILIKE '%yassin%';
