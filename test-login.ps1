$body = @{
    email = "yassin.mahmoud1236@gmail.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

Write-Host "Login Response:"
$response | ConvertTo-Json -Depth 10
