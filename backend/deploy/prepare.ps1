# Publish the API and apply the IIS post-processing that MSBuild regenerates away.
# usage: powershell -ExecutionPolicy Bypass -File backend\deploy\prepare.ps1
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root "src\Fiagmazation.Api\Fiagmazation.Api.csproj"
$out = Join-Path $root "publish"

if (Get-Process -Name "Fiagmazation.Api" -ErrorAction SilentlyContinue) {
    throw "Stop the running Fiagmazation.Api process first (it locks the build output)."
}

dotnet publish $project -c Release -o $out --nologo -v q
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)" }

$webConfig = Join-Path $out "web.config"
$xml = Get-Content $webConfig -Raw
$old = '<aspNetCore processPath="dotnet" arguments=".\Fiagmazation.Api.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />'
$new = @'
<aspNetCore processPath="dotnet" arguments=".\Fiagmazation.Api.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
        </environmentVariables>
      </aspNetCore>
'@
if ($xml -notlike "*$old*") { throw "web.config layout changed - update this script" }
[System.IO.File]::WriteAllText($webConfig, $xml.Replace($old, $new), (New-Object System.Text.UTF8Encoding($false)))
New-Item -ItemType Directory -Path (Join-Path $out "logs") -Force | Out-Null

"published to $out"
"files: " + (Get-ChildItem $out -Recurse -File).Count
