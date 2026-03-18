docker build -t prelegal .
docker rm -f prelegal 2>$null
docker run -d -p 8000:8000 --name prelegal prelegal

Write-Host "Prelegal is running at http://localhost:8000"
