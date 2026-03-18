$apiKey = ""
if (Test-Path .env) {
  $apiKey = (Get-Content .env | Where-Object { $_ -match "^OPENROUTER_API_KEY=" }) -replace "^OPENROUTER_API_KEY=", ""
}

docker build -t prelegal .
docker rm -f prelegal 2>$null
docker run -d -p 8000:8000 --name prelegal -e "OPENROUTER_API_KEY=$apiKey" prelegal

Write-Host "Prelegal is running at http://localhost:8000"
